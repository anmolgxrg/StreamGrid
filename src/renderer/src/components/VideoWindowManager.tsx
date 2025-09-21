import React, { useState, useEffect, useRef } from 'react'
import { Box, Button, Typography, IconButton } from '@mui/material'
import { Close as CloseIcon, Fullscreen as FullscreenIcon } from '@mui/icons-material'
import IndividualVideoWindow from './IndividualVideoWindow'

interface VideoWindowManagerProps {
  videos: HTMLVideoElement[]
  sources: string[]
  onClose?: () => void
  style?: React.CSSProperties
}

export const VideoWindowManager: React.FC<VideoWindowManagerProps> = ({
  videos,
  sources,
  onClose,
  style = {}
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  if (videos.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h6">No videos available</Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: 2,
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Header with controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          padding: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontWeight: 600,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          Robot Cameras ({videos.length})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={handleFullscreen}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)'
              }
            }}
            size="small"
          >
            <FullscreenIcon fontSize="small" />
          </IconButton>
          
          {onClose && (
            <IconButton
              onClick={handleClose}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)'
                }
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Video Grid Layout */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          paddingTop: 6, // Space for header
          display: 'grid',
          gridTemplateColumns: videos.length <= 2 ? '1fr' : videos.length <= 4 ? '1fr 1fr' : '1fr 1fr 1fr',
          gridTemplateRows: videos.length <= 1 ? '1fr' : videos.length <= 4 ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: 1,
          padding: 1,
          boxSizing: 'border-box'
        }}
      >
        {videos.map((video, index) => (
          <IndividualVideoWindow
            key={`video-${index}`}
            video={video}
            index={index}
            title={`Camera ${index + 1}${sources[index] ? ` (${sources[index]})` : ''}`}
            style={{
              minHeight: '200px',
              minWidth: '200px'
            }}
          />
        ))}
      </Box>
    </Box>
  )
}

export default VideoWindowManager
