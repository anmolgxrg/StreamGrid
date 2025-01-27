import { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class StreamErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Stream error:', error, errorInfo)
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            bgcolor: 'background.paper'
          }}
        >
          <Typography color="error" align="center" sx={{ p: 2 }}>
            Stream Error: Please try refreshing
          </Typography>
        </Box>
      )
    }

    return this.props.children
  }
}
