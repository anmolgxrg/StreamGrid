import React, { useState, useCallback, useRef } from 'react'
import ReactPlayer from 'react-player'
import { Card, CardMedia, IconButton, Typography, Box } from '@mui/material'
import { PlayArrow, Stop, Close } from '@mui/icons-material'
import { Stream } from '../types/stream'

interface StreamCardProps {
  stream: Stream
  onRemove: (id: string) => void
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, onRemove }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null)

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
      <Box sx={{ position: 'relative', height: '40px', bgcolor: 'rgba(0,0,0,0.8)' }}>
        <Box
          className="drag-handle"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            cursor: 'move',
            backgroundColor: 'rgba(0,0,0,0.0)',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.2)'
            },
            zIndex: 1
          }}
        />
        <Typography
          variant="subtitle2"
          noWrap
          sx={{
            color: 'white',
            position: 'absolute',
            left: 8,
            right: 40,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1
          }}
        >
          {stream.name}
        </Typography>
      </Box>
      <IconButton
        onClick={(e) => {
          e.stopPropagation()
          onRemove(stream.id)
        }}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          zIndex: 2,
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.8)'
          },
          width: 24,
          height: 24,
          padding: '4px'
        }}
        size="small"
      >
        <Close fontSize="small" />
      </IconButton>

      {!isPlaying ? (
        <Box
          sx={{
            height: 'calc(100% - 40px)',
            cursor: 'pointer',
            '&:hover': {
              '& .play-overlay': {
                opacity: 1
              }
            }
          }}
          onClick={handlePlay}
        >
          <CardMedia
            component="img"
            image={stream.logoUrl}
            alt={stream.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              backgroundColor: '#000'
            }}
          />
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
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ReactPlayer
              url={stream.streamUrl}
              width="100%"
              height="100%"
              playing={true}
              controls={true}
              onReady={handleReady}
              onError={handleError}
              config={{
                file: {
                  attributes: {
                    crossOrigin: 'anonymous'
                  },
                  forceHLS: true,
                  hlsVersion: '1.4.12',
                  hlsOptions: {
                    enableWorker: false,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    liveDurationInfinity: true,
                    debug: false,
                    xhrSetup: (xhr) => {
                      xhr.withCredentials = false
                    },
                    manifestLoadingTimeOut: 10000,
                    manifestLoadingMaxRetry: 3,
                    levelLoadingTimeOut: 10000,
                    levelLoadingMaxRetry: 3
                  }
                }
              }}
              playsinline
              stopOnUnmount
              pip={false}
            />
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
                <Typography sx={{ color: 'error.main', px: 2, py: 1, bgcolor: 'rgba(255,0,0,0.2)', borderRadius: 1 }}>
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
                        transform: 'rotate(0deg)',
                      },
                      '100%': {
                        transform: 'rotate(360deg)',
                      },
                    },
                  }}
                />
              )}
            </Box>
          )}
          <IconButton
            onClick={handleStop}
            sx={{
              position: 'absolute',
              left: 8,
              top: 8,
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'primary.main'
              }
            }}
            size="small"
          >
            <Stop />
          </IconButton>
        </Box>
      )}
    </Card>
  )
}
