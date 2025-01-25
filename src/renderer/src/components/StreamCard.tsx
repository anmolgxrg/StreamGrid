import React, { useState, useCallback } from 'react'
import ReactPlayer from 'react-player'
import { Card, CardContent, CardMedia, IconButton, Typography, Box } from '@mui/material'
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

  const handlePlay = useCallback((): void => {
    console.log('Attempting to play stream:', stream.streamUrl)
    setIsPlaying(true)
    setIsLoading(true)
  }, [stream.streamUrl])

  const handleStop = useCallback((): void => {
    setIsPlaying(false)
    setError(null)
  }, [])

  const handleReady = useCallback(() => {
    console.log('Stream ready:', stream.streamUrl)
    setIsLoading(false)
    setError(null)
  }, [stream.streamUrl])

  const handleError = useCallback(() => {
    console.error('Failed to load stream:', stream.streamUrl)
    setError('Failed to load stream')
    setIsLoading(false)
  }, [stream.streamUrl])

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
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardMedia
            component="img"
            image={stream.logoUrl}
            alt={stream.name}
            sx={{
              flex: 1,
              objectFit: 'contain',
              backgroundColor: '#000',
              cursor: 'pointer',
              minHeight: 0
            }}
            onClick={handlePlay}
          />
          <CardContent
            sx={{
              p: 1,
              '&:last-child': { pb: 1 },
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white'
            }}
          >
            <Typography variant="subtitle2" noWrap align="center">
              {stream.name}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              <IconButton
                size="small"
                onClick={handlePlay}
                sx={{
                  color: 'white',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                <PlayArrow />
              </IconButton>
            </Box>
          </CardContent>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ReactPlayer
              url={stream.streamUrl}
              width="100%"
              height="100%"
              playing
              controls
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
