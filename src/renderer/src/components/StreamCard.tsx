import jdenticon from 'jdenticon/standalone'
import React, {
  useState,
  useCallback,
  useRef,
  memo,
  lazy,
  Suspense,
  useEffect,
  useMemo
} from 'react'
import PropTypes from 'prop-types'
import { Card, IconButton, Typography, Box, CircularProgress } from '@mui/material'
import { PlayArrow, Stop, Close, Edit, Chat } from '@mui/icons-material'
import { Stream } from '../types/stream'
import { StreamErrorBoundary } from './StreamErrorBoundary'
import { useStreamStore } from '../store/useStreamStore'

// Lazy load ReactPlayer for better initial load time
const ReactPlayer = lazy(() => import('react-player'))

// Declare Twitch global
declare global {
  interface Window {
    Twitch: {
      Embed: new (elementId: string, options: any) => any
      Player: any
    }
  }
}

// Helper function to detect stream type
const extractYoutubeVideoId = (url: string): string | null => {
  try {
    const url_obj = new URL(url)
    if (url_obj.hostname.includes('youtube.com')) {
      // Handle youtube.com URLs
      if (url_obj.pathname === '/watch') {
        return url_obj.searchParams.get('v')
      } else if (url_obj.pathname.startsWith('/live/')) {
        return url_obj.pathname.split('/')[2]
      } else if (url_obj.pathname.startsWith('/embed/')) {
        return url_obj.pathname.split('/')[2]
      }
    } else if (url_obj.hostname === 'youtu.be') {
      // Handle youtu.be URLs
      return url_obj.pathname.slice(1)
    }
  } catch (error) {
    console.error('Error parsing URL:', error)
  }
  return null
}

const detectStreamType = (url: string): 'hls' | 'dash' | 'youtube' | 'twitch' | 'rtsp' | 'local' | 'other' => {
  // Check for local file first
  if (url.startsWith('file://')) {
    return 'local'
  }

  const hlsPatterns = [/\.m3u8(\?.*)?$/i]
  const dashPatterns = [/\.mpd(\?.*)?$/i, /manifest\.mpd/i]
  const youtubePatterns = [
    // Standard YouTube watch URLs
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/i,
    // Short YouTube URLs
    /^(https?:\/\/)?youtu\.be\/[a-zA-Z0-9_-]+/i,
    // YouTube live URLs
    /^(https?:\/\/)?(www\.)?youtube\.com\/@[^/]+\/live/i,
    /^(https?:\/\/)?(www\.)?youtube\.com\/live\/[a-zA-Z0-9_-]+/i,
    // YouTube embed URLs
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]+/i
  ]
  const twitchPatterns = [
    // Twitch channel URLs
    /^(https?:\/\/)?(www\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})/i
  ]
  const rtspPatterns = [
    // RTSP URLs
    /^rtsp:\/\//i,
    /^rtsps:\/\//i
  ]

  if (rtspPatterns.some((pattern) => pattern.test(url))) {
    return 'rtsp'
  }
  if (hlsPatterns.some((pattern) => pattern.test(url))) {
    return 'hls'
  }
  if (dashPatterns.some((pattern) => pattern.test(url))) {
    return 'dash'
  }
  if (youtubePatterns.some((pattern) => pattern.test(url))) {
    return 'youtube'
  }
  if (twitchPatterns.some((pattern) => pattern.test(url))) {
    return 'twitch'
  }
  return 'other'
}

const extractTwitchChannelName = (url: string): string | null => {
  try {
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})/i)
    return match ? match[1] : null
  } catch {
    return null
  }
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
  onAddChat?: (videoId: string, streamId: string, streamName: string) => void
}

const StreamCard: React.FC<StreamCardProps> = memo(({ stream, onRemove, onEdit, onAddChat }) => {
  const { removeChatsForStream } = useStreamStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [rtspUrl, setRtspUrl] = useState<string | null>(null)
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Generate avatar data URL if no logo URL is provided
  const generatedAvatarUrl = useMemo(() => {
    if (!stream.logoUrl) {
      return `data:image/svg+xml,${encodeURIComponent(jdenticon.toSvg(stream.name, 200))}`
    }
    return null
  }, [stream.logoUrl, stream.name])

  // Clean up URL and determine player config
  const { videoId, channelName, playerConfig, cleanUrl, streamType } = useMemo(() => {
    const type = detectStreamType(stream.streamUrl)
    console.log(`Stream type detected for ${stream.name}:`, type)

    let vid: string | null = null
    let channel: string | null = null
    let url = stream.streamUrl
    let config = {}

    if (type === 'youtube') {
      vid = extractYoutubeVideoId(stream.streamUrl)
      // Construct clean YouTube URL
      url = vid ? `https://www.youtube.com/watch?v=${vid}` : stream.streamUrl
      config = {} // For YouTube, pass URL directly without config
    } else if (type === 'twitch') {
      channel = extractTwitchChannelName(stream.streamUrl)
      url = channel ? `https://www.twitch.tv/${channel}` : stream.streamUrl
      config = {} // For Twitch, pass URL directly without config
    } else if (type === 'dash') {
      config = { file: DASH_CONFIG }
    } else if (type === 'local') {
      // For local files, use minimal config
      config = { file: BASE_CONFIG }
    } else {
      config = { file: HLS_CONFIG }
    }

    return {
      videoId: vid,
      channelName: channel,
      playerConfig: config,
      cleanUrl: url,
      streamType: type
    }
  }, [stream.streamUrl, stream.name])

  // Update logoUrl when stream.logoUrl changes
  useEffect(() => {
    setLogoUrl(stream.logoUrl || generatedAvatarUrl || '')
  }, [stream.logoUrl, generatedAvatarUrl])

  const handlePlay = useCallback(async (): Promise<void> => {
    // Reset state before playing
    setIsPlaying(false)
    setError(null)
    setIsLoading(false)
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }

    // Handle RTSP streams
    if (streamType === 'rtsp') {
      setIsLoading(true)
      try {
        // Check if FFmpeg is available
        const ffmpegCheck = await window.api.rtspCheckFfmpeg()
        if (!ffmpegCheck.available) {
          setError('FFmpeg not found. Please install FFmpeg to play RTSP streams.')
          setIsLoading(false)
          return
        }

        // Start RTSP transcoding
        const result = await window.api.rtspStartStream(stream.id, stream.streamUrl)
        if (result.success && result.url) {
          setRtspUrl(result.url)
          setIsPlaying(true)
          setIsLoading(true)
        } else {
          setError(result.error || 'Failed to start RTSP stream')
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error starting RTSP stream:', err)
        setError('Failed to start RTSP stream')
        setIsLoading(false)
      }
    } else {
      // Start playing in next tick for non-RTSP streams
      setTimeout(() => {
        console.log('Attempting to play stream:', cleanUrl)
        setIsPlaying(true)
        setIsLoading(true)
      }, 0)
    }
  }, [cleanUrl, streamType, stream.id, stream.streamUrl])

  const handleStop = useCallback(async (): Promise<void> => {
    setIsPlaying(false)
    setError(null)
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }

    // Stop RTSP transcoding if it's an RTSP stream
    if (streamType === 'rtsp') {
      try {
        await window.api.rtspStopStream(stream.id)
      } catch (err) {
        console.error('Error stopping RTSP stream:', err)
      }
      setRtspUrl(null)
    }

    removeChatsForStream(stream.id)
  }, [stream.id, removeChatsForStream, streamType])

  const handleReady = useCallback(() => {
    console.log('Stream ready:', cleanUrl)
    setIsLoading(false)
    setError(null)
    // Clear any pending error timer when stream recovers
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
  }, [cleanUrl])

  const handleError = useCallback(() => {
    console.error('Stream connection issue:', cleanUrl)
    setIsLoading(true)

    // Clear any existing timer
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
    }

    // Set new timer for 15 seconds
    errorTimerRef.current = setTimeout(() => {
      console.error('Stream failed to recover:', cleanUrl)
      setError('Failed to load stream')
      setIsLoading(false)
      errorTimerRef.current = null
    }, 15000)
  }, [cleanUrl])

  // Cleanup timer and RTSP stream on unmount
  React.useEffect(() => {
    return (): void => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current)
      }
      // Stop RTSP stream if component unmounts while playing
      if (streamType === 'rtsp' && isPlaying) {
        window.api.rtspStopStream(stream.id).catch(err => {
          console.error('Error stopping RTSP stream on unmount:', err)
        })
      }
    }
  }, [streamType, isPlaying, stream.id])

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
        overflow: 'hidden',
        userSelect: 'none'
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
          className="drag-handle"
          sx={{
            color: 'white',
            minWidth: 0,
            mr: 1,
            cursor: 'move',
            flex: 1,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          {stream.name}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {isPlaying && (
            <>
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
              {(videoId || channelName) && onAddChat && (
                <IconButton
                  onClick={() => {
                    if (streamType === 'youtube' && videoId) {
                      onAddChat(videoId, stream.id, stream.name)
                    } else if (streamType === 'twitch' && channelName) {
                      onAddChat(channelName, stream.id, stream.name)
                    }
                  }}
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: 'primary.main'
                    },
                    padding: '4px',
                    ml: 0.5
                  }}
                  size="small"
                >
                  <Chat fontSize="small" />
                </IconButton>
              )}
            </>
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
                objectFit: 'contain',
                backgroundColor: !stream.logoUrl ? '#1a1a1a' : 'transparent'
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
                  // If CORS attempt also failed, use generated avatar
                  img.src = generatedAvatarUrl || ''
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
                {streamType === 'twitch' && channelName ? (
                  <iframe
                    src={`https://player.twitch.tv/?channel=${channelName}&parent=localhost&muted=true`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen={true}
                    scrolling="no"
                    allow="autoplay; fullscreen"
                    onLoad={handleReady}
                    onError={handleError}
                  />
                ) : (
                  <ReactPlayer
                    key={streamType === 'rtsp' ? rtspUrl : cleanUrl} // Use RTSP URL for RTSP streams
                    url={streamType === 'rtsp' ? rtspUrl || '' : cleanUrl}
                    width="100%"
                    height="100%"
                    playing={true}
                    controls={true}
                    onReady={handleReady}
                    onError={handleError}
                    config={streamType === 'rtsp' ? { file: HLS_CONFIG } : playerConfig}
                    playsinline
                    stopOnUnmount
                    pip={false}
                  />
                )}
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
  onEdit: PropTypes.func.isRequired,
  onAddChat: PropTypes.func
}

export { StreamCard }
