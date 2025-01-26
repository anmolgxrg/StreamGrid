/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
// eslint-disable-next-line prettier/prettier
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Box } from '@mui/material'
import { Stream, GridItem } from '../types/stream'
import { StreamCard } from './StreamCard'

// Move calculateMargins outside component to prevent recreation
const calculateMargins = (): {
  horizontal: number;
  vertical: number;
  edgeHorizontal: number;
  edgeVertical: number;
} => {
  const viewportWidth = window.innerWidth
  const horizontalMargin = Math.max(Math.floor(viewportWidth * 0.004), 2)
  const verticalMargin = Math.max(Math.floor(viewportWidth * 0.003), 2)
  const edgeHorizontal = horizontalMargin * 7.5
  const edgeVertical = verticalMargin * 5

  return {
    horizontal: horizontalMargin,
    vertical: verticalMargin,
    edgeHorizontal,
    edgeVertical
  }
}

const ASPECT_RATIO = 16 / 9 // Standard video aspect ratio

interface StreamGridProps {
  streams: Stream[]
  layout: GridItem[]
  onRemoveStream: (id: string) => void
  onLayoutChange: (layout: GridItem[]) => void
}

export const StreamGrid = React.memo(({ streams, layout, onRemoveStream, onLayoutChange }: StreamGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1200, rowHeight: 100 })
  const resizeTimeoutRef = useRef<number>()

  const updateDimensions = useCallback((): void => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const newWidth = Math.max(Math.floor(containerWidth), 480)

      const containerHeight = window.innerHeight
      const margins = calculateMargins()
      const horizontalMargins = margins.edgeHorizontal
      const verticalMargins = margins.edgeVertical
      const availableWidth = newWidth - horizontalMargins
      const availableHeight = containerHeight - verticalMargins

      const columnWidth = availableWidth / 12
      const maxRowsByWidth = Math.floor(columnWidth / ASPECT_RATIO)
      const maxRowsByHeight = Math.floor(availableHeight / 12)
      const newRowHeight = Math.min(maxRowsByWidth, maxRowsByHeight)
      setDimensions({ width: newWidth, rowHeight: newRowHeight })
    }
  }, [])

  const debouncedUpdateDimensions = useCallback((): void => {
    if (resizeTimeoutRef.current) {
      window.clearTimeout(resizeTimeoutRef.current)
    }
    resizeTimeoutRef.current = window.setTimeout(updateDimensions, 100)
  }, [updateDimensions])

  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', debouncedUpdateDimensions)
    return () => {
      window.removeEventListener('resize', debouncedUpdateDimensions)
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [updateDimensions, debouncedUpdateDimensions])

  const handleLayoutChange = useCallback((newLayout: GridItem[]): void => {
    onLayoutChange(newLayout)
  }, [onLayoutChange])

  const memoizedStreams = useMemo(() => (
    streams.map(stream => (
      <div key={stream.id}>
        <StreamCard stream={stream} onRemove={onRemoveStream} />
      </div>
    ))
  ), [streams, onRemoveStream])

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100vh',
        backgroundColor: 'background.default',
        overflow: 'hidden',
        position: 'relative',
        '& .react-grid-layout': {
          height: '100% !important'
        },
        '& .react-resizable-handle': {
          width: '20px',
          height: '20px',
          bottom: '-10px',
          right: '-10px',
          cursor: 'se-resize',
          '&::after': {
            width: '12px',
            height: '12px',
            right: '5px',
            bottom: '5px'
          }
        }
      }}
    >
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        width={dimensions.width}
        rowHeight={dimensions.rowHeight}
        margin={[calculateMargins().horizontal, calculateMargins().vertical]} // Use smaller margins between cards
        useCSSTransforms={true}
        onLayoutChange={(layout) => handleLayoutChange(layout as GridItem[])}
        isDraggable
        draggableHandle=".drag-handle"
        isResizable
        compactType={null}
        preventCollision={true}
        allowOverlap={true}
        maxRows={12}
      >
        {memoizedStreams}
      </GridLayout>
    </Box>
  )
})

StreamGrid.displayName = 'StreamGrid'
