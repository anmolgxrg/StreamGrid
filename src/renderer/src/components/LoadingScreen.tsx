import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import StreamGridLogo from '../assets/StreamGrid.svg'

export const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        zIndex: 9999
      }}
    >
      <Box
        sx={{
          width: '64px',
          height: '64px',
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              opacity: 1
            },
            '50%': {
              transform: 'scale(1.1)',
              opacity: 0.8
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 1
            }
          }
        }}
      >
        <img src={StreamGridLogo} alt="StreamGrid Logo" style={{ width: '100%', height: '100%' }} />
      </Box>
      <CircularProgress size={32} />
      <Typography variant="body1" color="text.secondary">
        Loading StreamGrid...
      </Typography>
    </Box>
  )
}
