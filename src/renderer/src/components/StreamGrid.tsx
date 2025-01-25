/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier
import React, { useEffect, useState, useRef } from 'react'
// eslint-disable-next-line prettier/prettier
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Box } from '@mui/material'
import { Stream, GridItem } from '../types/stream'
import { StreamCard } from './StreamCard'

interface StreamGridProps {
  streams: Stream[]
  layout: GridItem[]
  onRemoveStream: (id: string) => void
  onLayoutChange: (layout: GridItem[]) => void
}

export const StreamGrid: React.FC<StreamGridProps> = ({
  streams,
  layout,
  onRemoveStream,
  onLayoutChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1200, rowHeight: 100 })
  const resizeTimeoutRef = useRef<number>()
  const ASPECT_RATIO = 16 / 9 // Standard video aspect ratio

  useEffect((): (() => void) => {
    const updateDimensions = (): void => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const newWidth = Math.max(Math.floor(containerWidth), 480) // Ensure minimum width

        // Calculate row height to maintain aspect ratio
        // Calculate available height and width
        const containerHeight = window.innerHeight
        const horizontalMargins = 11 * 8 // 11 gaps between 12 columns, 8px margin each
        const verticalMargins = 11 * 4 // Maximum 12 rows, 8px margin each
        const availableWidth = newWidth - horizontalMargins
        const availableHeight = containerHeight - verticalMargins

        // Calculate row height that fits both width and height constraints
        const columnWidth = availableWidth / 12
        const maxRowsByWidth = Math.floor(columnWidth / ASPECT_RATIO)
        const maxRowsByHeight = Math.floor(availableHeight / 12)
        const newRowHeight = Math.min(maxRowsByWidth, maxRowsByHeight)
        setDimensions({ width: newWidth, rowHeight: newRowHeight })
      }
    }

    const debouncedUpdateDimensions = (): void => {
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = window.setTimeout(updateDimensions, 100)
    }

    updateDimensions()
    window.addEventListener('resize', debouncedUpdateDimensions)
    return (): void => {
      window.removeEventListener('resize', debouncedUpdateDimensions)
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [])

  const handleLayoutChange = (newLayout: GridItem[]): void => {
    onLayoutChange(newLayout)
  }

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
        margin={[8, 8]}
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
        {streams.map((stream) => (
          <div key={stream.id}>
            <StreamCard stream={stream} onRemove={onRemoveStream} />
          </div>
        ))}
      </GridLayout>
    </Box>
  )
}
