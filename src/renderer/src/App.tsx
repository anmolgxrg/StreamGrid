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
import { Add, GitHub } from '@mui/icons-material'
import StreamGridLogo from './assets/StreamGrid.svg'
import { v4 as uuidv4 } from 'uuid'
import { StreamGrid } from './components/StreamGrid'
import { AddStreamDialog } from './components/AddStreamDialog'
import { GridSelector } from './components/GridSelector'
import { GridManagementDialog } from './components/GridManagementDialog'
import { useStreamStore } from './store/useStreamStore'
import { Stream, StreamFormData } from './types/stream'
import { LoadingScreen } from './components/LoadingScreen'
import { UpdateAlert } from './components/UpdateAlert'

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [aboutAnchorEl, setAboutAnchorEl] = useState<null | HTMLElement>(null)
  const [newGridDialogOpen, setNewGridDialogOpen] = useState(false)
  const [newGridName, setNewGridName] = useState('')
  const [gridManagementOpen, setGridManagementOpen] = useState(false)
  const {
    streams,
    layout,
    chats,
    addStream,
    removeStream,
    updateLayout,
    updateStream,
    addChat,
    removeChat,
    removeChatsForStream,
    createNewGrid,
    saveCurrentGrid,
    hasUnsavedChanges
  } = useStreamStore()
  const [editingStream, setEditingStream] = useState<Stream | undefined>(undefined)

  useEffect((): (() => void) => {
    // Simulate loading time to ensure all resources are properly loaded
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Auto-save functionality
  useEffect((): (() => void) | undefined => {
    if (hasUnsavedChanges) {
      const saveTimer = setTimeout(async () => {
        try {
          await saveCurrentGrid()
          console.log('Auto-saved grid')
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }, 1000) // Save 1 second after last change

      return () => clearTimeout(saveTimer)
    }
  }, [streams, layout, chats, hasUnsavedChanges, saveCurrentGrid])

  if (isLoading) {
    return <LoadingScreen />
  }

  const handleAddStream = (data: StreamFormData): void => {
    const newStream: Stream = {
      id: uuidv4(),
      ...data,
      isLivestream:
        data.streamUrl.includes('twitch.tv') ||
        data.streamUrl.includes('youtube.com/live') ||
        data.streamUrl.includes('youtube.com/@') ||
        data.streamUrl.includes('youtu.be/live')
    }
    addStream(newStream)
  }

  const handleRemoveStream = (id: string): void => {
    removeChatsForStream(id)
    removeStream(id)
  }

  const handleEditStream = (stream: Stream): void => {
    setEditingStream(stream)
    setIsAddDialogOpen(true)
  }

  const handleUpdateStream = (id: string, data: StreamFormData): void => {
    updateStream(id, data)
  }


  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <UpdateAlert />
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

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddDialogOpen(true)}
            sx={{
              textTransform: 'none',
              px: 2,
              borderRadius: 1
            }}
          >
            Add Stream
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
                  Created by Bernard Moerdler {window.api.version}
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
          chats={chats}
          onRemoveStream={handleRemoveStream}
          onLayoutChange={updateLayout}
          onEditStream={handleEditStream}
          onAddChat={addChat}
          onRemoveChat={removeChat}
        />
      </Box>

      <AddStreamDialog
        open={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false)
          setEditingStream(undefined)
        }}
        onAdd={handleAddStream}
        onEdit={handleUpdateStream}
        editStream={editingStream}
      />

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
