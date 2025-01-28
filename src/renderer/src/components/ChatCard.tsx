import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { Card, IconButton, Box, Typography } from '@mui/material'
import { Close } from '@mui/icons-material'

interface ChatCardProps {
  id: string
  videoId: string
  streamName: string
  onRemove: (id: string) => void
}

const ChatCard: React.FC<ChatCardProps> = memo(({ id, videoId, streamName, onRemove }) => {
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
          sx={{
            color: 'white',
            minWidth: 0,
            mr: 1
          }}
        >
          {streamName} - Live Chat
        </Typography>
        <Box
          className="drag-handle"
          sx={{
            flex: 1,
            height: '100%',
            cursor: 'move',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        />
        <IconButton
          onClick={() => onRemove(id)}
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

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          bgcolor: '#000',
          position: 'relative'
        }}
      >
        <iframe
          src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}&dark_theme=1`}
          width="100%"
          height="100%"
          frameBorder="0"
          style={{
            border: 'none',
            backgroundColor: '#000'
          }}
        />
      </Box>
    </Card>
  )
})

ChatCard.displayName = 'ChatCard'

ChatCard.propTypes = {
  id: PropTypes.string.isRequired,
  videoId: PropTypes.string.isRequired,
  streamName: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired
}

export { ChatCard }
