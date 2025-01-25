import React, { useState } from 'react'
import ReactPlayer from 'react-player'
import { Card, CardContent, CardMedia, IconButton, Typography, Box } from '@mui/material'
import { PlayArrow, Stop, Close, OpenWith, DragHandle } from '@mui/icons-material'
import { Stream } from '../types/stream'

interface StreamCardProps {
  stream: Stream
  onRemove: (id: string) => void
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, onRemove }) => {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = (): void => {
    setIsPlaying(true)
  }

  const handleStop = (): void => {
    setIsPlaying(false)
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
        cursor: 'default'
      }}
    >
      <Box
        className="resize-handle"
        sx={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          opacity: 0,
          transition: 'opacity 0.2s',
          cursor: 'se-resize',
          zIndex: 2,
          '&:hover': {
            opacity: 1
          }
        }}
      >
        <OpenWith sx={{ fontSize: 16, transform: 'rotate(45deg)' }} />
      </Box>
      <Box
        className="drag-handle"
        sx={{
          position: 'absolute',
          left: 8,
          top: 8,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          opacity: 0.6,
          transition: 'opacity 0.2s',
          cursor: 'grab',
          zIndex: 2,
          '&:hover': {
            opacity: 1
          },
          '&:active': {
            cursor: 'grabbing'
          }
        }}
      >
        <DragHandle fontSize="small" />
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
          <ReactPlayer
            url={stream.streamUrl}
            width="100%"
            height="100%"
            playing={isPlaying}
            controls
            style={{ backgroundColor: '#000' }}
            config={{
              file: {
                attributes: {
                  crossOrigin: "anonymous"
                }
              }
            }}
          />
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
