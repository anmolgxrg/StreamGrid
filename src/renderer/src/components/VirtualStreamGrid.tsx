import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import { Box } from '@mui/material'
import { Stream, GridItem } from '../types/stream'
import { StreamCard } from './StreamCard'
import { ChatCard } from './ChatCard'
import { ChatItem } from '../store/useStreamStore'
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor'

interface VirtualStreamGridProps {
  streams: Stream[]
  layout: GridItem[]
  chats: ChatItem[]
  onRemoveStream: (id: string) => void
  onLayoutChange: (layout: GridItem[]) => void
  onEditStream: (stream: Stream) => void
  onAddChat: (streamIdentifier: string, streamId: string, streamName: string) => void
  onRemoveChat: (id: string) => void
}

interface GridItemData {
  streams: Stream[]
  chats: ChatItem[]
  layout: GridItem[]
  columnCount: number
  onRemoveStream: (id: string) => void
  onEditStream: (stream: Stream) => void
  onAddChat: (streamIdentifier: string, streamId: string, streamName: string) => void
  onRemoveChat: (id: string) => void
}

const ASPECT_RATIO = 16 / 9
const MIN_ITEM_WIDTH = 200

// Cell renderer component
const GridCell = React.memo(({
  columnIndex,
  rowIndex,
  style,
  data
}: {
  columnIndex: number
  rowIndex: number
  style: React.CSSProperties
  data: GridItemData
}) => {
  const { streams, chats, layout, columnCount, onRemoveStream, onEditStream, onAddChat, onRemoveChat } = data

  // Calculate which item to render based on row and column
  const itemIndex = rowIndex * columnCount + columnIndex
  const allItems = [...streams, ...chats]

  if (itemIndex >= allItems.length) {
    return null
  }

  const item = allItems[itemIndex]
  const layoutItem = layout.find(l => l.i === ('id' in item ? item.id : ''))

  if (!layoutItem) {
    return null
  }

  // Check if this is a stream or chat
  const isStream = 'streamUrl' in item

  return (
    <div style={{
      ...style,
      padding: '4px',
      boxSizing: 'border-box'
    }}>
      {isStream ? (
        <StreamCard
          stream={item as Stream}
          onRemove={onRemoveStream}
          onEdit={onEditStream}
          onAddChat={onAddChat}
        />
      ) : (
        <ChatCard
          id={(item as ChatItem).id}
          streamType={(item as ChatItem).streamType}
          streamName={(item as ChatItem).streamName}
          streamIdentifier={(item as ChatItem).streamIdentifier}
          onRemove={onRemoveChat}
        />
      )}
    </div>
  )
})

GridCell.displayName = 'GridCell'

export const VirtualStreamGrid: React.FC<VirtualStreamGridProps> = ({
  streams,
  layout,
  chats,
  onRemoveStream,
  onEditStream,
  onAddChat,
  onRemoveChat
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({
    width: 1200,
    height: 800,
    columnWidth: 300,
    rowHeight: 168
  })

  const { generateReport } = usePerformanceMonitor('VirtualStreamGrid')

  // Calculate grid dimensions based on container size
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const containerHeight = containerRef.current.offsetHeight

      // Calculate optimal column width based on container width
      const columnCount = Math.floor(containerWidth / MIN_ITEM_WIDTH)
      const columnWidth = Math.floor(containerWidth / columnCount)
      const rowHeight = Math.floor(columnWidth / ASPECT_RATIO)

      setDimensions({
        width: containerWidth,
        height: containerHeight,
        columnWidth,
        rowHeight
      })

      // Log performance metrics
      const report = generateReport()
      if (report.metrics.componentCount > 50) {
        console.log('[VirtualGrid] Performance report:', report)
      }
    }
  }, [generateReport])

  // Debounced resize handler
  const resizeTimeoutRef = useRef<number>()
  const debouncedUpdateDimensions = useCallback(() => {
    if (resizeTimeoutRef.current) {
      window.clearTimeout(resizeTimeoutRef.current)
    }
    resizeTimeoutRef.current = window.setTimeout(updateDimensions, 100)
  }, [updateDimensions])

  useEffect((): (() => void) => {
    updateDimensions()
    window.addEventListener('resize', debouncedUpdateDimensions)

    return () => {
      window.removeEventListener('resize', debouncedUpdateDimensions)
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [updateDimensions, debouncedUpdateDimensions])

  // Calculate grid layout
  const columnCount = Math.floor(dimensions.width / dimensions.columnWidth)
  const rowCount = Math.ceil((streams.length + chats.length) / columnCount)

  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo<GridItemData>(() => ({
    streams,
    chats,
    layout,
    columnCount,
    onRemoveStream,
    onEditStream,
    onAddChat,
    onRemoveChat
  }), [streams, chats, layout, columnCount, onRemoveStream, onEditStream, onAddChat, onRemoveChat])

  // Note: Layout changes are handled by the parent component
  // Virtual grid doesn't support drag-and-drop directly

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100vh',
        backgroundColor: 'background.default',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Grid
        columnCount={columnCount}
        columnWidth={dimensions.columnWidth}
        height={dimensions.height}
        rowCount={rowCount}
        rowHeight={dimensions.rowHeight}
        width={dimensions.width}
        itemData={itemData}
        overscanRowCount={2}
        overscanColumnCount={1}
      >
        {GridCell}
      </Grid>
    </Box>
  )
}

// Hook to use virtual grid with intersection observer for even better performance
export const useVirtualGridWithIntersection = (
  containerRef: React.RefObject<HTMLElement>
): {
  visibleItems: Set<string>
  observeItem: (element: HTMLElement | null, itemId: string) => void
  unobserveItem: (element: HTMLElement | null) => void
} => {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect((): (() => void) => {
    if (!containerRef.current) return (): void => {}

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const itemId = entry.target.getAttribute('data-item-id')
          if (itemId) {
            if (entry.isIntersecting) {
              setVisibleItems(prev => new Set(prev).add(itemId))
            } else {
              setVisibleItems(prev => {
                const next = new Set(prev)
                next.delete(itemId)
                return next
              })
            }
          }
        })
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [containerRef])

  const observeItem = useCallback((element: HTMLElement | null, itemId: string) => {
    if (element && observerRef.current) {
      element.setAttribute('data-item-id', itemId)
      observerRef.current.observe(element)
    }
  }, [])

  const unobserveItem = useCallback((element: HTMLElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.unobserve(element)
    }
  }, [])

  return {
    visibleItems,
    observeItem,
    unobserveItem
  }
}
