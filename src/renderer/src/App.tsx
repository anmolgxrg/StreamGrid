import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { Add, FileUpload, FileDownload } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { StreamGrid } from './components/StreamGrid';
import { AddStreamDialog } from './components/AddStreamDialog';
import { useStreamStore } from './store/useStreamStore';
import { Stream, StreamFormData } from './types/stream';

export const App: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { streams, layout, addStream, removeStream, updateLayout, importStreams } = useStreamStore();

  const handleAddStream = (data: StreamFormData): void => {
    const newStream: Stream = {
      id: uuidv4(),
      ...data
    };
    addStream(newStream);
  };

  const handleImport = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
      input.onchange = async (e: Event): Promise<void> => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e): void => {
          try {
            const content = JSON.parse(e.target?.result as string);
            if (content.streams && content.layout) {
              importStreams(content.streams, content.layout);
            }
          } catch (error) {
            console.error('Error importing file:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExport = (): void => {
    const data = useStreamStore.getState().exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stream-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
          <IconButton
            onClick={handleImport}
            sx={{
              mr: 1,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <FileUpload />
          </IconButton>
          <IconButton
            onClick={handleExport}
            sx={{
              mr: 2,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <FileDownload />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddDialogOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
              px: 2
            }}
          >
            Add Stream
          </Button>
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
  );
};
