import React, { memo, useState } from 'react'
import {
  Card,
  Typography,
  Box
} from '@mui/material'
import { Stream } from '../types/stream'
import { TransitiveVideo } from './TransitiveVideo'
import VideoWindowManager from './VideoWindowManager'

interface StreamCardProps {
  stream: Stream
  onVideosChange?: (videos: HTMLVideoElement[]) => void
}

const StreamCard: React.FC<StreamCardProps> = memo(({ stream, onVideosChange }) => {
  const [videos, setVideos] = useState<HTMLVideoElement[]>([])
  const [showVideoManager, setShowVideoManager] = useState(false)

  const handleVideosReady = (videoElements: HTMLVideoElement[]) => {
    setVideos(videoElements)
    setShowVideoManager(true)
    // Pass videos to parent component
    if (onVideosChange) {
      onVideosChange(videoElements)
    }
  }

  const handleCloseVideoManager = () => {
    setShowVideoManager(false)
    setVideos([])
    // Clear videos from parent component
    if (onVideosChange) {
      onVideosChange([])
    }
  }

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
          backgroundColor: '#000',
          overflow: 'hidden'
        }}
      >
        {stream.isTransitiveVideo || stream.name.toLowerCase().includes('transitive') || stream.name.toLowerCase().includes('robot') ? (
          showVideoManager && videos.length > 0 ? (
            <VideoWindowManager
              videos={videos}
              sources={stream.videoSources || ['/cam1', '/cam2', '/cam3', '/cam4', '/cam5', '/cam6']}
              onClose={handleCloseVideoManager}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <TransitiveVideo
              jwt={stream.jwt || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZseXdoZWVsIiwiZGV2aWNlIjoiZF84ZGQzMTQzN2E2IiwiY2FwYWJpbGl0eSI6IkB0cmFuc2l0aXZlLXJvYm90aWNzL3JlbW90ZS10ZWxlb3AiLCJ2YWxpZGl0eSI6ODY0MDAsImlhdCI6MTc1ODQyNTgxM30.SAuMm6YGIe6yx-nvA2M_ETZpPQe5LpPDyTghzXS3gHM"}
              count={stream.videoCount || 6}
              sources={stream.videoSources || ['/cam1', '/cam2', '/cam3', '/cam4', '/cam5', '/cam6']}
              onVideosReady={handleVideosReady}
              style={{ width: '100%', height: '100%' }}
            />
          )
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1a1a1a',
              color: 'white',
              flexDirection: 'column',
              gap: 2,
              height: '100%'
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
              Layout Demo - Drag & Resize
            </Typography>
          </Box>
        )}
      </Box>

    </Card>
  )
})

StreamCard.displayName = 'StreamCard'

export { StreamCard }