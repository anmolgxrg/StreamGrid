import React, { useState, useCallback, useRef, memo, useEffect, useMemo } from 'react'
import jdenticon from 'jdenticon/standalone'
import { Card, IconButton, Typography, Box, CircularProgress } from '@mui/material'
import { PlayArrow, Stop, Close, Edit, Chat } from '@mui/icons-material'
import { Stream } from '../types/stream'
import { StreamErrorBoundary } from './StreamErrorBoundary'
import { useStreamStore } from '../store/useStreamStore'
import { usePlayerPool } from '../hooks/usePlayerPool'
import { useVirtualGridWithIntersection } from './VirtualStreamGrid'

// Memoized helper functions
const extractYoutubeVideoId = (url: string): string | null => {
  try {
    const url_obj = new URL(url)
    if (url_obj.hostname.includes('youtube.com')) {
      if (url_obj.pathname === '/watch') {
        return url_obj.searchParams.get('v')
      } else if (url_obj.pathname.startsWith('/live/')) {
        return url_obj.pathname.split('/')[2]
      } else if (url_obj.pathname.startsWith('/embed/')) {
        return url_obj.pathname.split('/')[2]
      }
    } else if (url_obj.hostname === 'youtu.be') {
      return url_obj.pathname.slice(1)
    }
  } catch (error) {
    console.error('Error parsing URL:', error)
  }
  return null
}

const detectStreamType = (url: string): 'hls' | 'dash' | 'youtube' | 'twitch' | 'local' | 'other' => {
  if (url.startsWith('file://')) {
    return 'local'
  }

  const hlsPatterns = [/\.m3u8(\?.*)?$/i]
  const dashPatterns = [/\.mpd(\?.*)?$/i, /manifest\.mpd/i]
  const youtubePatterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/i,
    /^(https?:\/\/)?youtu\.be\/[a-zA-Z0-9_-]+/i,
    /^(https?:\/\/)?(www\.)?youtube\.com\/@[^/]+\/live/i,
    /^(https?:\/\/)?(www\.)?youtube\.com\/live\/[a-zA-Z0-9_-]+/i,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]+/i
  ]
  const twitchPatterns = [
    /^(https?:\/\/)?(www\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})/i
  ]

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

interface StreamCardProps {
  stream: Stream
  onRemove: (id: string) => void
  onEdit: (stream: Stream) => void
  onAddChat?: (videoId: string, streamId: string, streamName: string) => void
  containerRef?: React.RefObject<HTMLElement>
}

// Memoized header component
const StreamCardHeader = memo(({
  stream,
  isPlaying,
  onStop,
  onEdit,
  onRemove,
  onAddChat,
  videoId,
  channelName,
  streamType
}: {
  stream: Stream
  isPlaying: boolean
  onStop: () => void
  onEdit: (stream: Stream) => void
  onRemove: (id: string) => void
  onAddChat?: (videoId: string, streamId: string, streamName: string) => void
  videoId: string | null
  channelName: string | null
  streamType: string
}) => (
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
            onClick={onStop}
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
))

StreamCardHeader.displayName = 'StreamCardHeader'

// Memoized thumbnail component
const StreamThumbnail = memo(({
  stream,
  logoUrl,
  generatedAvatarUrl,
  onPlay
}: {
  stream: Stream
  logoUrl: string
  generatedAvatarUrl: string | null
  onPlay: () => void
}) => (
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
    onClick={onPlay}
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
            img.setAttribute('crossOrigin', 'anonymous')
            img.src = logoUrl
          } else {
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
))

StreamThumbnail.displayName = 'StreamThumbnail'

export const OptimizedStreamCard: React.FC<StreamCardProps> = memo(({
  stream,
  onRemove,
  onEdit,
  onAddChat,
  containerRef
}) => {
  const { removeChatsForStream } = useStreamStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Use player pool
  const { acquirePlayer, releasePlayer } = usePlayerPool()

  // Use intersection observer for visibility detection
  const { observeItem, unobserveItem } = containerRef
    ? useVirtualGridWithIntersection(containerRef)
    : { observeItem: (): void => {}, unobserveItem: (): void => {} }

  // Generate avatar data URL if no logo URL is provided
  const generatedAvatarUrl = useMemo(() => {
    if (!stream.logoUrl) {
      return `data:image/svg+xml,${encodeURIComponent(jdenticon.toSvg(stream.name, 200))}`
    }
    return null
  }, [stream.logoUrl, stream.name])

  // Clean up URL and determine player config
  const { videoId, channelName, cleanUrl, streamType } = useMemo(() => {
    const type = detectStreamType(stream.streamUrl)
    let vid: string | null = null
    let channel: string | null = null
    let url = stream.streamUrl

    if (type === 'youtube') {
      vid = extractYoutubeVideoId(stream.streamUrl)
      url = vid ? `https://www.youtube.com/watch?v=${vid}` : stream.streamUrl
    } else if (type === 'twitch') {
      channel = extractTwitchChannelName(stream.streamUrl)
      url = channel ? `https://www.twitch.tv/${channel}` : stream.streamUrl
    }

    return {
      videoId: vid,
      channelName: channel,
      cleanUrl: url,
      streamType: type
    }
  }, [stream.streamUrl])

  // Update logoUrl when stream.logoUrl changes
  useEffect(() => {
    setLogoUrl(stream.logoUrl || generatedAvatarUrl || '')
  }, [stream.logoUrl, generatedAvatarUrl])

  // Define callbacks first to avoid hoisting issues
  const handleReady = useCallback(() => {
    console.log('Stream ready:', cleanUrl)
    setIsLoading(false)
    setError(null)
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
  }, [cleanUrl])

  const handleError = useCallback(() => {
    console.error('Stream connection issue:', cleanUrl)
    setIsLoading(true)

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
    }

    errorTimerRef.current = setTimeout(() => {
      console.error('Stream failed to recover:', cleanUrl)
      setError('Failed to load stream')
      setIsLoading(false)
      errorTimerRef.current = null
    }, 15000)
  }, [cleanUrl])

  // Set up intersection observer
  useEffect((): (() => void) => {
    if (cardRef.current && containerRef) {
      observeItem(cardRef.current, stream.id)
    }
    return (): void => {
      if (cardRef.current) {
        unobserveItem(cardRef.current)
      }
    }
  }, [stream.id, observeItem, unobserveItem, containerRef])

  const handlePlay = useCallback((): void => {
    setIsPlaying(false)
    setError(null)
    setIsLoading(false)
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }

    setTimeout(() => {
      console.log('Attempting to play stream:', cleanUrl)
      setIsPlaying(true)
      setIsLoading(true)

      // Acquire player from pool
      if (streamType === 'twitch' && channelName) {
        const iframe = acquirePlayer(stream.id, `https://player.twitch.tv/?channel=${channelName}&parent=localhost&parent=${window.location.hostname}`)
        if (iframe && playerContainerRef.current) {
          playerContainerRef.current.appendChild(iframe)
          iframe.onload = handleReady
          iframe.onerror = handleError
        }
      }
    }, 0)
  }, [cleanUrl, stream.id, streamType, channelName, acquirePlayer, handleReady, handleError])

  const handleStop = useCallback((): void => {
    setIsPlaying(false)
    setError(null)
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
    removeChatsForStream(stream.id)

    // Release player back to pool
    releasePlayer(stream.id)
  }, [stream.id, removeChatsForStream, releasePlayer])

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current)
      }
      if (isPlaying) {
        releasePlayer(stream.id)
      }
    }
  }, [isPlaying, stream.id, releasePlayer])

  return (
    <Card
      ref={cardRef}
      data-stream-card
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
      <StreamCardHeader
        stream={stream}
        isPlaying={isPlaying}
        onStop={handleStop}
        onEdit={onEdit}
        onRemove={onRemove}
        onAddChat={onAddChat}
        videoId={videoId}
        channelName={channelName}
        streamType={streamType}
      />

      {!isPlaying ? (
        <StreamThumbnail
          stream={stream}
          logoUrl={logoUrl}
          generatedAvatarUrl={generatedAvatarUrl}
          onPlay={handlePlay}
        />
      ) : (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <Box
            ref={playerContainerRef}
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
              {streamType !== 'twitch' && (
                <Box sx={{ color: 'white' }}>
                  Player pool optimization available for Twitch streams
                </Box>
              )}
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
                <CircularProgress size={32} />
              )}
            </Box>
          )}
        </Box>
      )}
    </Card>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for deep memoization
  return (
    prevProps.stream.id === nextProps.stream.id &&
    prevProps.stream.name === nextProps.stream.name &&
    prevProps.stream.streamUrl === nextProps.stream.streamUrl &&
    prevProps.stream.logoUrl === nextProps.stream.logoUrl &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onAddChat === nextProps.onAddChat
  )
})

OptimizedStreamCard.displayName = 'OptimizedStreamCard'
