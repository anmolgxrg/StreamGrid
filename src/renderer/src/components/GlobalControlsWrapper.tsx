import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, IconButton, Slider } from '@mui/material'
import { 
  PlayArrow as PlayIcon, 
  Pause as PauseIcon, 
  VolumeUp as VolumeIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material'

interface GlobalControlsWrapperProps {
  videos: HTMLVideoElement[]
  onVideoControl?: (action: string, videoIndex?: number, value?: number) => void
  style?: React.CSSProperties
}

export const GlobalControlsWrapper: React.FC<GlobalControlsWrapperProps> = ({
  videos,
  onVideoControl,
  style = {}
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(100)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show controls when videos are available
    setIsVisible(videos.length > 0)
  }, [videos.length])

  const handlePlayPause = () => {
    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)
    
    videos.forEach((video, index) => {
      if (newPlayingState) {
        video.play().catch(console.error)
      } else {
        video.pause()
      }
    })
    
    if (onVideoControl) {
      onVideoControl(newPlayingState ? 'play' : 'pause')
    }
  }

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const volumeValue = Array.isArray(newValue) ? newValue[0] : newValue
    setVolume(volumeValue)
    
    videos.forEach((video) => {
      video.volume = volumeValue / 100
    })
    
    if (onVideoControl) {
      onVideoControl('volume', undefined, volumeValue)
    }
  }

  const handleFullscreen = () => {
    if (onVideoControl) {
      onVideoControl('fullscreen')
    }
  }

  const handleSettings = () => {
    if (onVideoControl) {
      onVideoControl('settings')
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        padding: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minWidth: 400,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        ...style
      }}
    >
      {/* Play/Pause Button */}
      <IconButton
        onClick={handlePlayPause}
        sx={{
          color: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)'
          }
        }}
        size="large"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </IconButton>

      {/* Volume Control */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
        <VolumeIcon sx={{ color: 'white', fontSize: 20 }} />
        <Slider
          value={volume}
          onChange={handleVolumeChange}
          min={0}
          max={100}
          sx={{
            color: 'white',
            '& .MuiSlider-thumb': {
              backgroundColor: 'white'
            },
            '& .MuiSlider-track': {
              backgroundColor: 'white'
            },
            '& .MuiSlider-rail': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }
          }}
        />
        <Typography variant="caption" sx={{ color: 'white', minWidth: 30 }}>
          {volume}%
        </Typography>
      </Box>

      {/* Video Count */}
      <Typography variant="body2" sx={{ color: 'white', minWidth: 80 }}>
        {videos.length} Camera{videos.length !== 1 ? 's' : ''}
      </Typography>

      {/* Settings Button */}
      <IconButton
        onClick={handleSettings}
        sx={{
          color: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)'
          }
        }}
        size="small"
      >
        <SettingsIcon />
      </IconButton>

      {/* Fullscreen Button */}
      <IconButton
        onClick={handleFullscreen}
        sx={{
          color: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)'
          }
        }}
        size="small"
      >
        <FullscreenIcon />
      </IconButton>
    </Box>
  )
}

export default GlobalControlsWrapper
