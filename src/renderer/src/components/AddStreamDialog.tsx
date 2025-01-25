import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material'
import { KeyboardArrowDown } from '@mui/icons-material'
import { useForm, SubmitHandler } from 'react-hook-form'
import { StreamFormData } from '../types/stream'

interface AddStreamDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (data: StreamFormData) => void
  onImport?: () => void
  onExport?: () => void
}

export const AddStreamDialog: React.FC<AddStreamDialogProps> = ({
  open,
  onClose,
  onAdd,
  onImport,
  onExport
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<StreamFormData>()

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
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        Add New Stream
        <IconButton
          size="small"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{ ml: 'auto' }}
        >
          <KeyboardArrowDown />
        </IconButton>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null)
              onImport?.()
            }}
          >
            Import JSON
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null)
              onExport?.()
            }}
          >
            Export JSON
          </MenuItem>
        </Menu>
      </DialogTitle>
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
            <TextField
              label="Stream URL (M3U8)"
              fullWidth
              {...register('streamUrl', {
                required: 'Stream URL is required',
                pattern: {
                  value: /^(https?:\/\/).+\.m3u8$/i,
                  message: 'Please enter a valid M3U8 stream URL'
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
