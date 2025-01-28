/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useCallback, KeyboardEvent } from 'react'
import ReactPlayer from 'react-player'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  Paper
} from '@mui/material'
import { Stream, StreamFormData } from '../types/stream'

interface AddStreamDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (data: StreamFormData) => void
  onEdit?: (id: string, data: StreamFormData) => void
  editStream?: Stream
}

export const AddStreamDialog: React.FC<AddStreamDialogProps> = ({ open, onClose, onAdd, onEdit, editStream }): JSX.Element => {
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [streamPreview, setStreamPreview] = useState<string>('')
  const [formData, setFormData] = useState<StreamFormData>({
    name: '',
    logoUrl: '',
    streamUrl: ''
  })

  const isValidImageUrl = useCallback((url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  const validateAndLoadImage = useCallback((url: string): Promise<boolean> => {
    return new Promise<boolean>((resolve: (value: boolean) => void) => {
      const img = new Image();
      img.onload = (): void => resolve(true);
      img.onerror = (): void => {
        // If loading fails, try with CORS
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onerror = (): void => resolve(false);
      };
      // Try loading without CORS first
      img.src = url;
    });
  }, []);

  const trySetLogoPreview = useCallback(async (url: string): Promise<void> => {
    if (isValidImageUrl(url)) {
      const isValidImage = await validateAndLoadImage(url);
      if (isValidImage) {
        setLogoPreview(url);
      }
    }
  }, [isValidImageUrl, validateAndLoadImage]);

  const isValid = useCallback((): boolean => {
    return (
      formData.name.length >= 2 &&
      isValidImageUrl(formData.logoUrl) &&
      ReactPlayer.canPlay(formData.streamUrl)
    )
  }, [formData, isValidImageUrl])

  const handleSubmit = useCallback((): void => {
    if (editStream && onEdit) {
      onEdit(editStream.id, formData)
    } else {
      onAdd(formData)
    }
    onClose()
  }, [editStream, onEdit, onAdd, formData, onClose])

  // Handle URL auto-detection on paste
  const handlePaste = useCallback((e: React.ClipboardEvent): void => {
    const pastedText = e.clipboardData?.getData('text')
    if (!pastedText) return

    // Check if it's an image URL
    if (isValidImageUrl(pastedText)) {
      setFormData(prev => ({ ...prev, logoUrl: pastedText }))
      trySetLogoPreview(pastedText)
      return
    }

    // Check if it's a playable stream URL
    if (ReactPlayer.canPlay(pastedText)) {
      setFormData(prev => ({ ...prev, streamUrl: pastedText }))
      setStreamPreview(pastedText)
    }
  }, [isValidImageUrl, trySetLogoPreview])

  const handleKeyDown = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && isValid()) {
      handleSubmit()
    }
  }, [isValid, handleSubmit])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (editStream) {
        setFormData({
          name: editStream.name,
          logoUrl: editStream.logoUrl,
          streamUrl: editStream.streamUrl
        })
        if (editStream.logoUrl) {
          trySetLogoPreview(editStream.logoUrl)
        }
        setStreamPreview(editStream.streamUrl)
      } else {
        setFormData({ name: '', logoUrl: '', streamUrl: '' })
        setLogoPreview('')
        setStreamPreview('')
      }
    }
  }, [open, editStream, trySetLogoPreview])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle>
        {editStream ? 'Edit Stream' : 'Add Stream'}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Press ⌘/Ctrl + Enter to save
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formData.name.length > 0 && formData.name.length < 2}
            helperText={formData.name.length > 0 && formData.name.length < 2 ? 'Min 2 characters' : ' '}
            autoFocus
            onKeyDown={handleKeyDown}
          />

          <Box>
            <TextField
              label="Logo URL"
              fullWidth
              value={formData.logoUrl}
              onChange={(e) => {
                const url = e.target.value
                setFormData(prev => ({ ...prev, logoUrl: url }))
                trySetLogoPreview(url)
              }}
              error={formData.logoUrl.length > 0 && !isValidImageUrl(formData.logoUrl)}
              helperText={formData.logoUrl.length > 0 && !isValidImageUrl(formData.logoUrl) ? 'Invalid image URL' : ' '}
              onPaste={handlePaste}
            />
            {logoPreview && (
              <Paper
                elevation={1}
                sx={{
                  mt: 1,
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'black',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  crossOrigin="anonymous"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
                    e.currentTarget.src = '';
                    setLogoPreview('');
                  }}
                />
              </Paper>
            )}
          </Box>

          <Box>
            <TextField
              label="Stream URL"
              fullWidth
              value={formData.streamUrl}
              onChange={(e) => {
                const url = e.target.value
                setFormData(prev => ({ ...prev, streamUrl: url }))
                if (ReactPlayer.canPlay(url)) {
                  setStreamPreview(url)
                }
              }}
              error={formData.streamUrl.length > 0 && !ReactPlayer.canPlay(formData.streamUrl)}
              helperText={formData.streamUrl.length > 0 && !ReactPlayer.canPlay(formData.streamUrl) ? 'Invalid stream URL' : ' '}
              onPaste={handlePaste}
            />
            {streamPreview && (
              <Paper
                elevation={1}
                sx={{
                  mt: 1,
                  height: '120px',
                  bgcolor: 'black',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <ReactPlayer
                  url={streamPreview}
                  width="100%"
                  height="100%"
                  controls
                  playing={false}
                  config={{
                    file: {
                      attributes: {
                        crossOrigin: 'anonymous'
                      }
                    }
                  }}
                />
              </Paper>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid()}
          sx={{
            px: 3,
            borderRadius: 1,
            textTransform: 'none'
          }}
        >
          {editStream ? 'Save Changes' : 'Add Stream'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
