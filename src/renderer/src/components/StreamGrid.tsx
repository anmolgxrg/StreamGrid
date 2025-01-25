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
  const [width, setWidth] = useState(1200)
  const resizeTimeoutRef = useRef<number>()

  useEffect((): (() => void) => {
    const updateWidth = (): void => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const newWidth = Math.floor(containerWidth)
        setWidth(Math.max(newWidth, 480)) // Ensure minimum width
      }
    }

    const debouncedUpdateWidth = (): void => {
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = window.setTimeout(updateWidth, 100)
    }

    updateWidth()
    window.addEventListener('resize', debouncedUpdateWidth)
    return (): void => {
      window.removeEventListener('resize', debouncedUpdateWidth)
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
        rowHeight={100}
        width={width}
        margin={[8, 8]}
        useCSSTransforms={true}
        onLayoutChange={(layout) => handleLayoutChange(layout as GridItem[])}
        isDraggable
        draggableHandle=".drag-handle"
        isResizable
        compactType={null}
        preventCollision
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
