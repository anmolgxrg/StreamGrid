import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'

interface IndividualVideoWindowProps {
  video: HTMLVideoElement
  index: number
  title: string
  onClose?: () => void
  style?: React.CSSProperties
}

export const IndividualVideoWindow: React.FC<IndividualVideoWindowProps> = ({
  video,
  index,
  title,
  onClose,
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (containerRef.current && video) {
      // Clone the video element to avoid moving it from its original location
      const clonedVideo = video.cloneNode(true) as HTMLVideoElement
      clonedVideo.style.width = '100%'
      clonedVideo.style.height = '100%'
      clonedVideo.style.objectFit = 'cover'
      clonedVideo.style.borderRadius = '8px'
      
      // Clear the container and add the cloned video
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(clonedVideo)
      
      // Set up video event listeners
      const handleLoadedData = () => setIsLoaded(true)
      const handleError = () => console.error(`Video ${index} failed to load`)
      
      clonedVideo.addEventListener('loadeddata', handleLoadedData)
      clonedVideo.addEventListener('error', handleError)
      
      // Try to play the video
      clonedVideo.play().catch(console.error)
      
      return () => {
        clonedVideo.removeEventListener('loadeddata', handleLoadedData)
        clonedVideo.removeEventListener('error', handleError)
      }
    }
  }, [video, index])

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
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {/* Video Title Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          padding: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: 'white',
            fontWeight: 600,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          {title}
        </Typography>
        {onClose && (
          <Box
            onClick={onClose}
            sx={{
              color: 'white',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 1,
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            ✕
          </Box>
        )}
      </Box>

      {/* Loading State */}
      {!isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center',
            zIndex: 5
          }}
        >
          <Typography variant="body2">Loading {title}...</Typography>
        </Box>
      )}

      {/* Video Container */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          '& video': {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }
        }}
      />
    </Box>
  )
}

export default IndividualVideoWindow
