import React, { lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'

// Lazy load the ChatCard component
const ChatCard = lazy(() => import('./ChatCard').then(module => ({ default: module.ChatCard })))

interface LazyChatProps {
  id: string
  streamType: string
  streamName: string
  streamIdentifier: string
  onRemove: (id: string) => void
}

// Loading placeholder component
const ChatLoadingPlaceholder: React.FC = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'background.paper',
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider'
    }}
  >
    <CircularProgress size={24} />
  </Box>
)

// Lazy chat wrapper with error boundary
export const LazyChat: React.FC<LazyChatProps> = React.memo(({
  id,
  streamType,
  streamName,
  streamIdentifier,
  onRemove
}) => {
  return (
    <Suspense fallback={<ChatLoadingPlaceholder />}>
      <ChatCard
        id={id}
        streamType={streamType}
        streamName={streamName}
        streamIdentifier={streamIdentifier}
        onRemove={onRemove}
      />
    </Suspense>
  )
})

LazyChat.displayName = 'LazyChat'

// Hook to preload chat component
export const usePreloadChat = (): void => {
  React.useEffect((): (() => void) => {
    // Preload the chat component after a delay
    const timer = setTimeout(() => {
      import('./ChatCard')
    }, 2000)

    return (): void => clearTimeout(timer)
  }, [])
}
