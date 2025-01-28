import React, { useState, useCallback, useRef, memo, lazy, Suspense, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Card, IconButton, Typography, Box, CircularProgress } from '@mui/material'
import { PlayArrow, Stop, Close, Edit } from '@mui/icons-material'
import { Stream } from '../types/stream'
import { StreamErrorBoundary } from './StreamErrorBoundary'

// Lazy load ReactPlayer for better initial load time
const ReactPlayer = lazy(() => import('react-player'))

// Helper function to detect stream type
const detectStreamType = (url: string): 'hls' | 'dash' | 'other' => {
  const hlsPatterns = [/\.m3u8(\?.*)?$/i]
  const dashPatterns = [/\.mpd(\?.*)?$/i, /manifest\.mpd/i]

  if (hlsPatterns.some(pattern => pattern.test(url))) {
    return 'hls'
  }
  if (dashPatterns.some(pattern => pattern.test(url))) {
    return 'dash'
  }
  return 'other'
}

// Base player config
const BASE_CONFIG = {
  attributes: {
    crossOrigin: 'anonymous'
  }
}

// HLS specific config
const HLS_CONFIG = {
  ...BASE_CONFIG,
  forceHLS: true,
  hlsVersion: '1.4.12',
  hlsOptions: {
    enableWorker: false,
    lowLatencyMode: true,
    backBufferLength: 90,
    liveDurationInfinity: true,
    debug: false,
    xhrSetup: (xhr: XMLHttpRequest): void => {
      xhr.withCredentials = false
    },
    manifestLoadingTimeOut: 10000,
    manifestLoadingMaxRetry: 3,
    levelLoadingTimeOut: 10000,
    levelLoadingMaxRetry: 3
  }
}

// DASH specific config
const DASH_CONFIG = {
  ...BASE_CONFIG,
  forceDASH: true,
  dashVersion: '4.7.2', // Current version of dashjs
  dashOptions: {
    lowLatencyMode: true,
    streaming: {
      lowLatencyEnabled: true,
      abr: {
        useDefaultABRRules: true
      },
      liveCatchup: {
        enabled: true,
        maxDrift: 12
      }
    }
  }
}

interface StreamCardProps {
  stream: Stream
  onRemove: (id: string) => void
  onEdit: (stream: Stream) => void
}

const StreamCard: React.FC<StreamCardProps> = memo(({ stream, onRemove, onEdit }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Update logoUrl when stream.logoUrl changes
  useEffect(() => {
    setLogoUrl(stream.logoUrl)
  }, [stream.logoUrl])

  // Determine player config based on stream type
  const playerConfig = useMemo(() => {
    const streamType = detectStreamType(stream.streamUrl)
    console.log(`Stream type detected for ${stream.name}:`, streamType)

    return {
      file: streamType === 'dash' ? DASH_CONFIG : HLS_CONFIG
    }
  }, [stream.streamUrl, stream.name])

  const handlePlay = useCallback((): void => {
    console.log('Attempting to play stream:', stream.streamUrl)
    setIsPlaying(true)
    setIsLoading(true)
  }, [stream.streamUrl])

  const handleStop = useCallback((): void => {
    setIsPlaying(false)
    setError(null)
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
  }, [])

  const handleReady = useCallback(() => {
    console.log('Stream ready:', stream.streamUrl)
    setIsLoading(false)
    setError(null)
    // Clear any pending error timer when stream recovers
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
  }, [stream.streamUrl])

  const handleError = useCallback(() => {
    console.error('Stream connection issue:', stream.streamUrl)
    setIsLoading(true)

    // Clear any existing timer
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
    }

    // Set new timer for 15 seconds
    errorTimerRef.current = setTimeout(() => {
      console.error('Stream failed to recover:', stream.streamUrl)
      setError('Failed to load stream')
      setIsLoading(false)
      errorTimerRef.current = null
    }, 15000)
  }, [stream.streamUrl])

  // Cleanup timer on unmount
  React.useEffect(() => {
    return (): void => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current)
      }
    }
  }, [])

  return (
    <Card
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: '40px',
          flexShrink: 0,
          bgcolor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          px: 1
        }}
      >
        <Typography
          variant="subtitle2"
          noWrap
          sx={{
            color: 'white',
            minWidth: 0,
            mr: 1
          }}
        >
          {stream.name}
        </Typography>
        <Box
          className="drag-handle"
          sx={{
            flex: 1,
            height: '100%',
            cursor: 'move',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        />

        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {isPlaying && (
            <IconButton
              onClick={handleStop}
              sx={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'error.main'
                },
                padding: '4px'
              }}
              size="small"
            >
              <Stop fontSize="small" />
            </IconButton>
          )}
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              onEdit(stream)
            }}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'primary.main'
              },
              padding: '4px'
            }}
            size="small"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              onRemove(stream.id)
            }}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'error.main'
              },
              padding: '4px'
            }}
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {!isPlaying ? (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            cursor: 'pointer',
            '&:hover': {
              '& .play-overlay': {
                opacity: 1
              }
            }
          }}
          onClick={handlePlay}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={logoUrl}
              alt={stream.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
                const img = e.currentTarget
                if (!img.hasAttribute('crossOrigin')) {
                  // If first attempt failed, try with CORS
                  img.setAttribute('crossOrigin', 'anonymous')
                  img.src = logoUrl
                } else {
                  // If CORS attempt also failed, clear the image
                  img.removeAttribute('src')
                  console.error('Failed to load logo:', logoUrl)
                }
              }}
            />
          </Box>
          <Box
            className="play-overlay"
            sx={{
              position: 'absolute',
              top: 40,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.3)',
              opacity: 0,
              transition: 'opacity 0.2s'
            }}
          >
            <PlayArrow sx={{ fontSize: 48, color: 'white' }} />
          </Box>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <Box
            sx={{
              position: 'absolute',
              top: '0px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <StreamErrorBoundary>
              <Suspense
                fallback={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <CircularProgress />
                  </Box>
                }
              >
                <ReactPlayer
                  url={stream.streamUrl}
                  width="100%"
                  height="100%"
                  playing={true}
                  controls={true}
                  onReady={handleReady}
                  onError={handleError}
                  config={playerConfig}
                  playsinline
                  stopOnUnmount
                  pip={false}
                />
              </Suspense>
            </StreamErrorBoundary>
          </Box>
          {(error || isLoading) && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)'
              }}
            >
              {error ? (
                <Typography
                  sx={{
                    color: 'error.main',
                    px: 2,
                    py: 1,
                    bgcolor: 'rgba(255,0,0,0.2)',
                    borderRadius: 1
                  }}
                >
                  {error}
                </Typography>
              ) : (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    border: 4,
                    borderColor: 'primary.main',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': {
                        transform: 'rotate(0deg)'
                      },
                      '100%': {
                        transform: 'rotate(360deg)'
                      }
                    }
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      )}
    </Card>
  )
})

StreamCard.displayName = 'StreamCard'

StreamCard.propTypes = {
  stream: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    streamUrl: PropTypes.string.isRequired,
    logoUrl: PropTypes.string.isRequired
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
}

export { StreamCard }
