import React, { useState } from 'react'
import { Box, AppBar, Toolbar, Typography, Button, ButtonGroup, Menu, MenuItem } from '@mui/material'
import { Add, KeyboardArrowDown } from '@mui/icons-material'
import { v4 as uuidv4 } from 'uuid'
import { StreamGrid } from './components/StreamGrid'
import { AddStreamDialog } from './components/AddStreamDialog'
import { useStreamStore } from './store/useStreamStore'
import { Stream, StreamFormData } from './types/stream'

export const App: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const { streams, layout, addStream, removeStream, updateLayout, importStreams } = useStreamStore()

  const handleAddStream = (data: StreamFormData): void => {
    const newStream: Stream = {
      id: uuidv4(),
      ...data
    }
    addStream(newStream)
  }

  const handleImport = (): void => {
    setMenuAnchorEl(null)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: Event): Promise<void> => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e): void => {
          try {
            const content = JSON.parse(e.target?.result as string)
            if (content.streams && content.layout) {
              importStreams(content.streams, content.layout)
            }
          } catch (error) {
            console.error('Error importing file:', error)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExport = (): void => {
    setMenuAnchorEl(null)
    const data = useStreamStore.getState().exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'stream-config.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ backgroundColor: 'background.paper' }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              color: 'text.primary',
              fontWeight: 600
            }}
          >
            StreamGrid
          </Typography>
          <ButtonGroup variant="contained" sx={{ borderRadius: 1 }}>
            <Button
              startIcon={<Add />}
              onClick={() => setIsAddDialogOpen(true)}
              sx={{
                textTransform: 'none',
                px: 2
              }}
            >
              Add Stream
            </Button>
            <Button
              size="small"
              onClick={(e) => setMenuAnchorEl(e.currentTarget)}
              sx={{
                px: 0.5,
                minWidth: '36px',
                borderLeft: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <KeyboardArrowDown />
            </Button>
          </ButtonGroup>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={() => setMenuAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem onClick={handleImport}>Import JSON</MenuItem>
            <MenuItem onClick={handleExport}>Export JSON</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <StreamGrid
          streams={streams}
          layout={layout}
          onRemoveStream={removeStream}
          onLayoutChange={updateLayout}
        />
      </Box>

      <AddStreamDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddStream}
      />
    </Box>
  )
}
