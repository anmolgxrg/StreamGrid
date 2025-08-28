import { useEffect, useRef, useCallback, useState } from 'react'
import * as Comlink from 'comlink'
import type { GridItem } from '../types/stream'

// Worker API interface
interface LayoutWorkerAPI {
  calculateOptimalLayout: (
    items: GridItem[],
    containerWidth: number,
    containerHeight: number,
    columns?: number
  ) => Promise<GridItem[]>
  validateLayout: (items: GridItem[]) => Promise<boolean>
  compactLayout: (items: GridItem[]) => Promise<GridItem[]>
}

// Create worker instance
const createLayoutWorker = (): Worker => {
  return new Worker(
    new URL('../workers/layoutWorker.ts', import.meta.url),
    { type: 'module' }
  )
}

export const useLayoutWorker = (): {
  calculateOptimalLayout: (
    items: GridItem[],
    containerWidth: number,
    containerHeight: number,
    columns?: number
  ) => Promise<GridItem[]>
  validateLayout: (items: GridItem[]) => Promise<boolean>
  compactLayout: (items: GridItem[]) => Promise<GridItem[]>
  isWorkerReady: boolean
  workerError: string | null
} => {
  const workerRef = useRef<Worker | null>(null)
  const workerApiRef = useRef<LayoutWorkerAPI | null>(null)
  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const [workerError, setWorkerError] = useState<string | null>(null)

  // Initialize worker
  useEffect(() => {
    try {
      const worker = createLayoutWorker()
      workerRef.current = worker

      // Wrap worker with Comlink
      workerApiRef.current = Comlink.wrap<LayoutWorkerAPI>(worker)
      setIsWorkerReady(true)

      console.log('[LayoutWorker] Worker initialized')
    } catch (error) {
      console.error('[LayoutWorker] Failed to initialize worker:', error)
      setWorkerError(error instanceof Error ? error.message : 'Failed to initialize worker')
    }

    return (): void => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
        workerApiRef.current = null
        setIsWorkerReady(false)
      }
    }
  }, [])

  // Calculate optimal layout
  const calculateOptimalLayout = useCallback(async (
    items: GridItem[],
    containerWidth: number,
    containerHeight: number,
    columns: number = 12
  ): Promise<GridItem[]> => {
    if (!workerApiRef.current) {
      console.warn('[LayoutWorker] Worker not ready, falling back to sync calculation')
      return calculateOptimalLayoutSync(items, containerWidth, containerHeight, columns)
    }

    try {
      const result = await workerApiRef.current.calculateOptimalLayout(
        items,
        containerWidth,
        containerHeight,
        columns
      )
      return result
    } catch (error) {
      console.error('[LayoutWorker] Error calculating layout:', error)
      return calculateOptimalLayoutSync(items, containerWidth, containerHeight, columns)
    }
  }, [])

  // Validate layout for overlaps
  const validateLayout = useCallback(async (items: GridItem[]): Promise<boolean> => {
    if (!workerApiRef.current) {
      console.warn('[LayoutWorker] Worker not ready, falling back to sync validation')
      return validateLayoutSync(items)
    }

    try {
      const result = await workerApiRef.current.validateLayout(items)
      return result
    } catch (error) {
      console.error('[LayoutWorker] Error validating layout:', error)
      return validateLayoutSync(items)
    }
  }, [])

  // Compact layout to remove gaps
  const compactLayout = useCallback(async (items: GridItem[]): Promise<GridItem[]> => {
    if (!workerApiRef.current) {
      console.warn('[LayoutWorker] Worker not ready, falling back to sync compaction')
      return compactLayoutSync(items)
    }

    try {
      const result = await workerApiRef.current.compactLayout(items)
      return result
    } catch (error) {
      console.error('[LayoutWorker] Error compacting layout:', error)
      return compactLayoutSync(items)
    }
  }, [])

  return {
    calculateOptimalLayout,
    validateLayout,
    compactLayout,
    isWorkerReady,
    workerError
  }
}

// Fallback synchronous implementations
function calculateOptimalLayoutSync(
  items: GridItem[],
  containerWidth: number,
  containerHeight: number,
  columns: number = 12
): GridItem[] {
  const cellWidth = containerWidth / columns
  const aspectRatio = 16 / 9
  const optimalHeight = Math.floor(cellWidth / aspectRatio)
  const maxRows = Math.floor(containerHeight / optimalHeight)

  return items.map((item, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)

    if (row >= maxRows) {
      return {
        ...item,
        x: (index % (columns * maxRows)) % columns * Math.floor(12 / columns),
        y: Math.floor((index % (columns * maxRows)) / columns) * 3,
        w: Math.floor(12 / columns),
        h: 3
      }
    }

    return {
      ...item,
      x: col * Math.floor(12 / columns),
      y: row * 3,
      w: Math.floor(12 / columns),
      h: 3
    }
  })
}

function validateLayoutSync(items: GridItem[]): boolean {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i]
      const item2 = items[j]

      if (
        item1.x < item2.x + item2.w &&
        item1.x + item1.w > item2.x &&
        item1.y < item2.y + item2.h &&
        item1.y + item1.h > item2.y
      ) {
        return false
      }
    }
  }
  return true
}

function compactLayoutSync(items: GridItem[]): GridItem[] {
  const sorted = [...items].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })

  const compacted: GridItem[] = []
  const occupied = new Map<string, boolean>()

  for (const item of sorted) {
    let newY = 0
    let placed = false

    while (!placed && newY < 100) {
      let canPlace = true

      for (let x = item.x; x < item.x + item.w; x++) {
        for (let y = newY; y < newY + item.h; y++) {
          if (occupied.get(`${x},${y}`)) {
            canPlace = false
            break
          }
        }
        if (!canPlace) break
      }

      if (canPlace) {
        for (let x = item.x; x < item.x + item.w; x++) {
          for (let y = newY; y < newY + item.h; y++) {
            occupied.set(`${x},${y}`, true)
          }
        }

        compacted.push({
          ...item,
          y: newY
        })
        placed = true
      } else {
        newY++
      }
    }
  }

  return compacted
}
