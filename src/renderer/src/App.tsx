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
  DialogActions,
  IconButton
} from '@mui/material'
import { GitHub } from '@mui/icons-material'
import { StreamGrid } from './components/StreamGrid'
import { GridSelector } from './components/GridSelector'
import { GridManagementDialog } from './components/GridManagementDialog'
import { LoginPage } from './components/LoginPage'
import { useDebouncedStore } from './hooks/useDebouncedStore'
import { useAuth } from './hooks/useAuth'
import { Stream } from './types/stream'
// Removed LoadingScreen and UpdateAlert components

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [aboutAnchorEl, setAboutAnchorEl] = useState<null | HTMLElement>(null)
  const [newGridDialogOpen, setNewGridDialogOpen] = useState(false)
  const [newGridName, setNewGridName] = useState('')
  const [gridManagementOpen, setGridManagementOpen] = useState(false)
  const [showTransitiveVideo, setShowTransitiveVideo] = useState(false)
  
  // Authentication
  const { user, loading: authLoading, signOut } = useAuth()
  
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

    // Only load data if user is authenticated
    if (user && streams.length === 0) {
      loadExampleData()
    }

    // Automatically start loading TransitiveCapability videos
    setShowTransitiveVideo(true)

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
  }, [hasUnsavedChanges, saveNow, streams.length, loadExampleData, user])

  // Auto-save is now handled by the debounced store
  // No need for manual auto-save implementation here

  // Removed loading screen - simplified startup

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F8F8F8'
      }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    )
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <LoginPage onLoginSuccess={() => {}} />
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ backgroundColor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          </Box>

          <GridSelector
            onNewGrid={() => setNewGridDialogOpen(true)}
            onManageGrids={() => setGridManagementOpen(true)}
          />

          <Button
            onClick={async () => {
              await signOut()
            }}
            sx={{ 
              color: 'text.primary',
              textTransform: 'none',
              marginLeft: 2
            }}
          >
            Sign Out
          </Button>

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
          showTransitiveVideo={showTransitiveVideo}
          onTransitiveVideoClose={() => setShowTransitiveVideo(false)}
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
    </Box>
  )
}
