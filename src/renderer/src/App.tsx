import React, { useState, useEffect } from 'react'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions
} from '@mui/material'
import { GitHub } from '@mui/icons-material'
import StreamGridLogo from './assets/StreamGrid.svg'
import { StreamGrid } from './components/StreamGrid'
import { GridSelector } from './components/GridSelector'
import { GridManagementDialog } from './components/GridManagementDialog'
import { GlobalControlsWrapper } from './components/GlobalControlsWrapper'
import { useDebouncedStore } from './hooks/useDebouncedStore'
import { Stream } from './types/stream'
// Removed LoadingScreen and UpdateAlert components

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [aboutAnchorEl, setAboutAnchorEl] = useState<null | HTMLElement>(null)
  const [newGridDialogOpen, setNewGridDialogOpen] = useState(false)
  const [newGridName, setNewGridName] = useState('')
  const [gridManagementOpen, setGridManagementOpen] = useState(false)
  const [globalVideos, setGlobalVideos] = useState<HTMLVideoElement[]>([])
  const {
    streams,
    layout,
    updateLayout,
    createNewGrid,
    saveNow,
    hasUnsavedChanges,
    loadExampleData
  } = useDebouncedStore({
    layoutDebounceMs: 300,
    saveDebounceMs: 5000, // 5 seconds instead of 1 second
    streamUpdateDebounceMs: 500
  })

  useEffect(() => {
    // Set loading to false immediately as resources are already loaded
    setIsLoading(false)

    // Load example data if no streams exist
    if (streams.length === 0) {
      loadExampleData()
    }

    // Save on window close/refresh
    const handleBeforeUnload = async (e: BeforeUnloadEvent): Promise<void> => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        await saveNow()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, saveNow, streams.length, loadExampleData])

  // Auto-save is now handled by the debounced store
  // No need for manual auto-save implementation here

  // Removed loading screen - simplified startup

  const handleVideoControl = (action: string, videoIndex?: number, value?: number) => {
    console.log('Video control action:', action, videoIndex, value)
    // Handle global video controls here
  }




  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ backgroundColor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Box
              onClick={(e) => setAboutAnchorEl(e.currentTarget)}
              sx={{
                width: '32px',
                height: '32px',
                display: 'flex',
                userSelect: 'none',
                alignItems: 'center',
                cursor: 'pointer',
                '& img': {
                  width: '100%',
                  height: '100%'
                }
              }}
            >
              <img src={StreamGridLogo} alt="StreamGrid Logo" />
            </Box>
            <Typography
              variant="h6"
              component="div"
              onClick={(e) => setAboutAnchorEl(e.currentTarget)}
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              StreamGrid
            </Typography>
          </Box>

          <GridSelector
            onNewGrid={() => setNewGridDialogOpen(true)}
            onManageGrids={() => setGridManagementOpen(true)}
          />

          <Box sx={{ mx: 2 }} />

          <Menu
            anchorEl={aboutAnchorEl}
            open={Boolean(aboutAnchorEl)}
            onClose={() => setAboutAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left'
            }}
          >
            <MenuItem>
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 200 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  About StreamGrid
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Created by Bernard Moerdler - v1.2.4
                </Typography>

                <Link
                  href="https://github.com/LordKnish/StreamGrid"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 2,
                    color: 'primary.main',
                    textDecoration: 'none'
                  }}
                >
                  <GitHub fontSize="small" />
                  Visit GitHub
                </Link>
              </Box>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <StreamGrid
          streams={streams}
          layout={layout}
          onLayoutChange={async (newLayout) => {
            updateLayout(newLayout)
            // Save immediately after layout change (stream movement)
            await saveNow()
          }}
        />
      </Box>


      <Dialog
        open={newGridDialogOpen}
        onClose={() => {
          setNewGridDialogOpen(false)
          setNewGridName('')
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create New Grid</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Grid Name"
            fullWidth
            variant="outlined"
            value={newGridName}
            onChange={(e) => setNewGridName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newGridName.trim()) {
                createNewGrid(newGridName.trim())
                setNewGridDialogOpen(false)
                setNewGridName('')
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNewGridDialogOpen(false)
            setNewGridName('')
          }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (newGridName.trim()) {
                createNewGrid(newGridName.trim())
                setNewGridDialogOpen(false)
                setNewGridName('')
              }
            }}
            variant="contained"
            disabled={!newGridName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <GridManagementDialog
        open={gridManagementOpen}
        onClose={() => setGridManagementOpen(false)}
      />

      {/* Global Controls Wrapper - positioned outside video windows */}
      <GlobalControlsWrapper
        videos={globalVideos}
        onVideoControl={handleVideoControl}
      />
    </Box>
  )
}
