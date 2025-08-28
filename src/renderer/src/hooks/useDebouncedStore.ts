import { useCallback, useRef, useEffect, useState } from 'react'
import { debounce } from 'lodash'
import { useStreamStore } from '../store/useStreamStore'
import { Stream, GridItem } from '../types/stream'
import { SavedGrid } from '../types/grid'

interface DebouncedStoreOptions {
  layoutDebounceMs?: number
  saveDebounceMs?: number
  streamUpdateDebounceMs?: number
}

const DEFAULT_OPTIONS: Required<DebouncedStoreOptions> = {
  layoutDebounceMs: 300,
  saveDebounceMs: 5000, // 5 seconds instead of 1 second
  streamUpdateDebounceMs: 500
}

type DebouncedStore = Omit<ReturnType<typeof useStreamStore>, 'updateLayout' | 'updateStream' | 'batchUpdate' | 'saveCurrentGrid'> & {
  updateLayout: (newLayout: GridItem[]) => void
  updateStream: (id: string, updates: Partial<Stream>) => void
  batchUpdate: (updates: { streams?: Stream[]; layout?: GridItem[] }) => void
  saveNow: (name?: string) => Promise<SavedGrid>
  cancelPendingUpdates: () => void
  hasPendingUpdates: () => boolean
}

export const useDebouncedStore = (options: DebouncedStoreOptions = {}): DebouncedStore => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const store = useStreamStore()

  // Refs to store pending updates
  const pendingLayoutRef = useRef<GridItem[] | null>(null)
  const pendingStreamUpdatesRef = useRef<Map<string, Partial<Stream>>>(new Map())
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect((): (() => void) => {
    return (): void => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  // Debounced layout update
  const debouncedUpdateLayout = useRef(
    debounce((newLayout: GridItem[]) => {
      store.updateLayout(newLayout)
      pendingLayoutRef.current = null
    }, config.layoutDebounceMs)
  ).current

  // Debounced stream update
  const debouncedUpdateStream = useRef(
    debounce(() => {
      const updates = pendingStreamUpdatesRef.current
      if (updates.size > 0) {
        // Apply all pending stream updates
        updates.forEach((updateData, streamId) => {
          store.updateStream(streamId, updateData)
        })
        pendingStreamUpdatesRef.current.clear()
      }
    }, config.streamUpdateDebounceMs)
  ).current

  // Debounced save
  const debouncedSave = useRef(
    debounce(async () => {
      if (store.hasUnsavedChanges && !store.isSaving) {
        try {
          await store.saveCurrentGrid()
          console.log('[DebouncedStore] Auto-saved grid')
        } catch (error) {
          console.error('[DebouncedStore] Auto-save failed:', error)
        }
      }
    }, config.saveDebounceMs)
  ).current

  // Watch for changes and trigger debounced save
  useEffect(() => {
    if (store.hasUnsavedChanges) {
      debouncedSave()
    }
  }, [store.hasUnsavedChanges, debouncedSave])

  // Wrapped methods with debouncing
  const updateLayout = useCallback((newLayout: GridItem[]) => {
    pendingLayoutRef.current = newLayout
    debouncedUpdateLayout(newLayout)
  }, [debouncedUpdateLayout])

  const updateStream = useCallback((id: string, updates: Partial<Stream>) => {
    // Merge with any pending updates for this stream
    const currentUpdates = pendingStreamUpdatesRef.current.get(id) || {}
    pendingStreamUpdatesRef.current.set(id, { ...currentUpdates, ...updates })
    debouncedUpdateStream()
  }, [debouncedUpdateStream])

  // Batch update with debouncing
  const batchUpdate = useCallback((updates: {
    streams?: Stream[]
    layout?: GridItem[]
  }) => {
    if (updates.layout) {
      updateLayout(updates.layout)
    }
    if (updates.streams) {
      // For batch stream updates, apply immediately
      store.batchUpdate(updates)
    }
  }, [store, updateLayout])

  // Force immediate save (bypasses debouncing)
  const saveNow = useCallback(async (name?: string) => {
    // Cancel any pending debounced save
    debouncedSave.cancel()

    // Apply any pending updates immediately
    if (pendingLayoutRef.current) {
      store.updateLayout(pendingLayoutRef.current)
      pendingLayoutRef.current = null
    }

    if (pendingStreamUpdatesRef.current.size > 0) {
      pendingStreamUpdatesRef.current.forEach((updateData, streamId) => {
        store.updateStream(streamId, updateData)
      })
      pendingStreamUpdatesRef.current.clear()
    }

    // Save
    return store.saveCurrentGrid(name)
  }, [store, debouncedSave])

  // Cancel all pending operations
  const cancelPendingUpdates = useCallback(() => {
    debouncedUpdateLayout.cancel()
    debouncedUpdateStream.cancel()
    debouncedSave.cancel()
    pendingLayoutRef.current = null
    pendingStreamUpdatesRef.current.clear()
  }, [debouncedUpdateLayout, debouncedUpdateStream, debouncedSave])

  return {
    // All original store properties and methods
    ...store,
    // Override with debounced versions
    updateLayout,
    updateStream,
    batchUpdate,
    // Replace saveCurrentGrid with saveNow
    saveCurrentGrid: saveNow,
    // Additional methods
    saveNow,
    cancelPendingUpdates,
    // Status
    hasPendingUpdates: (): boolean =>
      pendingLayoutRef.current !== null ||
      pendingStreamUpdatesRef.current.size > 0
  } as DebouncedStore
}

// Hook to get debounce status
interface DebounceStatus {
  pendingLayoutUpdate: boolean
  pendingStreamUpdates: number
  pendingSave: boolean
}

export const useDebounceStatus = (): DebounceStatus => {
  const [status] = useState<DebounceStatus>({
    pendingLayoutUpdate: false,
    pendingStreamUpdates: 0,
    pendingSave: false
  })

  // This would need to be connected to the debounced store instance
  // For now, it returns a static status
  return status
}
