// Layout calculation worker for offloading heavy computations
import type { GridItem } from '../types/stream'

interface LayoutCalculationRequest {
  type: 'calculateOptimalLayout' | 'validateLayout' | 'compactLayout'
  data: {
    items: GridItem[]
    containerWidth: number
    containerHeight: number
    columns?: number
    rowHeight?: number
  }
}

interface LayoutCalculationResponse {
  type: string
  result: GridItem[] | boolean
  error?: string
}

// Calculate optimal layout for items
function calculateOptimalLayout(
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

    // Ensure we don't exceed max rows
    if (row >= maxRows) {
      // Stack items in available space
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

// Validate layout for overlaps
function validateLayout(items: GridItem[]): boolean {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i]
      const item2 = items[j]

      // Check for overlap
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

// Compact layout to remove gaps
function compactLayout(items: GridItem[]): GridItem[] {
  // Sort items by position
  const sorted = [...items].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })

  const compacted: GridItem[] = []
  const occupied = new Map<string, boolean>()

  for (const item of sorted) {
    let newY = 0

    // Find the lowest available position
    let placed = false
    while (!placed && newY < 100) { // Add max iterations to prevent infinite loop
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
        // Mark cells as occupied
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

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<LayoutCalculationRequest>) => {
  const { type, data } = event.data

  try {
    let result: GridItem[] | boolean

    switch (type) {
      case 'calculateOptimalLayout':
        result = calculateOptimalLayout(
          data.items,
          data.containerWidth,
          data.containerHeight,
          data.columns
        )
        break

      case 'validateLayout':
        result = validateLayout(data.items)
        break

      case 'compactLayout':
        result = compactLayout(data.items)
        break

      default:
        throw new Error(`Unknown calculation type: ${type}`)
    }

    const response: LayoutCalculationResponse = {
      type,
      result
    }

    self.postMessage(response)
  } catch (error) {
    const response: LayoutCalculationResponse = {
      type,
      result: type === 'validateLayout' ? false : [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }

    self.postMessage(response)
  }
})

// Export types for use in main thread
export type { LayoutCalculationRequest, LayoutCalculationResponse }
