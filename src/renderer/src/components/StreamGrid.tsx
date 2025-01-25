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
        const horizontalMargins = 11 * 4 // 11 gaps between 12 columns, 4px margin each
        const availableWidth = newWidth - horizontalMargins
        const columnWidth = availableWidth / 12
        const newRowHeight = Math.floor(columnWidth / ASPECT_RATIO)
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
        height: '100%',
        backgroundColor: 'background.default',
        overflow: 'hidden',
        position: 'relative',
        '& .react-grid-layout': {
          height: '100% !important'
        }
      }}
    >
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        width={dimensions.width}
        rowHeight={dimensions.rowHeight}
        margin={[4, 4]}
        useCSSTransforms={true}
        onLayoutChange={(layout) => handleLayoutChange(layout as GridItem[])}
        isDraggable
        draggableHandle=".drag-handle"
        isResizable
        compactType={null}
        preventCollision
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
