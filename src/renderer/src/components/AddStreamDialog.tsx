/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react'
import ReactPlayer from 'react-player'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box
} from '@mui/material'
import { useForm, SubmitHandler } from 'react-hook-form'
import { StreamFormData } from '../types/stream'

interface AddStreamDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (data: StreamFormData) => void
}

export const AddStreamDialog: React.FC<AddStreamDialogProps> = ({ open, onClose, onAdd }) => {
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [streamPreview, setStreamPreview] = useState<string>('')
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<StreamFormData>()

  // Watch for changes in the logo URL and stream URL fields
  useEffect((): (() => void) => {
    const subscription = watch((value, { name }): void => {
      if (name === 'logoUrl' && value.logoUrl) {
        // Only update if it's a valid image URL
        if (/^(https?:\/\/).+\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(value.logoUrl)) {
          setLogoPreview(value.logoUrl)
        } else {
          setLogoPreview('')
        }
      }
      if (name === 'streamUrl' && value.streamUrl) {
        // Accept any URL that ReactPlayer can handle
        if (ReactPlayer.canPlay(value.streamUrl)) {
          setStreamPreview(value.streamUrl)
        } else {
          setStreamPreview('')
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const onSubmit: SubmitHandler<StreamFormData> = (data): void => {
    onAdd(data)
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>Add New Stream</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Stream Name"
              fullWidth
              {...register('name', {
                required: 'Stream name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
              autoFocus
            />
            {logoPreview && (
              <Box
                sx={{
                  width: '100%',
                  height: 120,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#000',
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
                />
              </Box>
            )}
            <TextField
              label="Logo URL"
              fullWidth
              {...register('logoUrl', {
                required: 'Logo URL is required',
                pattern: {
                  value: /^(https?:\/\/)?.+\.(jpg|jpeg|png|gif|bmp|webp)$/i,
                  message: 'Please enter a valid image URL'
                }
              })}
              error={!!errors.logoUrl}
              helperText={errors.logoUrl?.message}
            />
            {streamPreview && (
              <Box
                sx={{
                  width: '100%',
                  height: 180,
                  backgroundColor: '#000',
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
              </Box>
            )}
            <TextField
              label="Stream URL"
              fullWidth
              {...register('streamUrl', {
                required: 'Stream URL is required',
                validate: {
                  playable: (url) => ReactPlayer.canPlay(url) || 'Please enter a valid stream URL'
                }
              })}
              error={!!errors.streamUrl}
              helperText={errors.streamUrl?.message}
            />
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
            type="submit"
            variant="contained"
            sx={{
              px: 3,
              borderRadius: 1,
              textTransform: 'none'
            }}
          >
            Add Stream
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
