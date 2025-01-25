import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { Card, CardContent, CardMedia, IconButton, Typography, Box } from '@mui/material';
import { PlayArrow, Stop, Close } from '@mui/icons-material';
import { Stream } from '../types/stream';

interface StreamCardProps {
  stream: Stream;
  onRemove: (id: string) => void;
}

export const StreamCard: React.FC<StreamCardProps> = ({ stream, onRemove }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTogglePlay = (): void => {
    setIsPlaying(!isPlaying);
  };

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
        onClick={() => onRemove(stream.id)}
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
            onClick={handleTogglePlay}
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
                onClick={handleTogglePlay}
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
          />
          <IconButton
            onClick={handleTogglePlay}
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
  );
};
