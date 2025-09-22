import React, { memo, useRef, useEffect, useState } from 'react'
import {
  Card,
  Typography,
  Box
} from '@mui/material'
import { Stream } from '../types/stream'

interface StreamCardProps {
  stream: Stream
  videoElement?: HTMLVideoElement
}

const StreamCard: React.FC<StreamCardProps> = memo(({ stream, videoElement }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  useEffect(() => {
    if (videoElement && videoRef.current) {
      console.log(`StreamCard ${stream.name}: Setting up video`, {
        src: videoElement.src,
        srcObject: videoElement.srcObject,
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight
      })
      
      // Get the video source (srcObject or src)
      const videoSrc = videoElement.srcObject || videoElement.src
      
      if (videoSrc) {
        // Set the video source to our video element
        if (videoRef.current.srcObject !== videoSrc) {
          videoRef.current.srcObject = videoSrc as MediaStream
          console.log(`StreamCard ${stream.name}: Set srcObject`)
        }
        
        // Set up event listeners
        const handleLoadedData = () => {
          console.log(`StreamCard ${stream.name}: Video loaded`)
          setIsVideoLoaded(true)
        }
        
        const handleError = (e: any) => {
          console.error(`StreamCard ${stream.name}: Video error`, e)
          setIsVideoLoaded(false)
        }
        
        videoRef.current.addEventListener('loadeddata', handleLoadedData)
        videoRef.current.addEventListener('error', handleError)
        
        // Try to play the video
        videoRef.current.play().catch((error) => {
          console.error(`StreamCard ${stream.name}: Play error`, error)
        })
        
        return () => {
          videoRef.current?.removeEventListener('loadeddata', handleLoadedData)
          videoRef.current?.removeEventListener('error', handleError)
        }
      } else {
        console.warn(`StreamCard ${stream.name}: No video source available`)
      }
    }
  }, [videoElement, stream.name])

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
          px: 1,
          zIndex: 2
        }}
      >
        <Typography
          variant="subtitle2"
          noWrap
          className="drag-handle"
          sx={{
            color: 'white',
            minWidth: 0,
            cursor: 'move',
            flex: 1,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          {stream.name}
        </Typography>
      </Box>

      {/* Video content area */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#1a1a1a',
          overflow: 'hidden'
        }}
      >
        {videoElement ? (
          <Box
            component="video"
            ref={videoRef}
            autoPlay
            muted
            playsInline
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Box
              component="img"
              src={stream.logoUrl}
              alt={stream.name}
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                objectFit: 'cover'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <Typography variant="body2" align="center" sx={{ px: 2 }}>
              {stream.name}
            </Typography>
            <Typography variant="caption" align="center" sx={{ px: 2, opacity: 0.7 }}>
              Connecting to camera feed...
            </Typography>
          </Box>
        )}
      </Box>

    </Card>
  )
})

StreamCard.displayName = 'StreamCard'

export { StreamCard }