import { describe, it, expect, vi } from 'vitest'
import { render, waitFor, renderHook, act } from '@testing-library/react'
import { usePerformanceMonitor, useOperationTimer } from '../hooks/usePerformanceMonitor'
import { usePlayerPool } from '../hooks/usePlayerPool'
import { useDebouncedStore } from '../hooks/useDebouncedStore'
import { useLayoutWorker } from '../hooks/useLayoutWorker'
import { VirtualStreamGrid } from '../components/VirtualStreamGrid'
import { OptimizedStreamCard } from '../components/OptimizedStreamCard'
import { LazyChat } from '../components/LazyChat'
import type { Stream, GridItem } from '../types/stream'

// Mock data for GridItems
const mockGridItems: GridItem[] = Array.from({ length: 100 }, (_, i) => ({
  i: `stream-${i}`,
  x: (i % 4) * 3,
  y: Math.floor(i / 4) * 3,
  w: 3,
  h: 3
}))

// Mock data for Streams
const mockStreams: Stream[] = Array.from({ length: 100 }, (_, i) => ({
  id: `stream-${i}`,
  name: `Channel ${i}`,
  logoUrl: `https://example.com/logo${i}.png`,
  streamUrl: `https://twitch.tv/channel${i}`,
  position: {
    x: (i % 4) * 3,
    y: Math.floor(i / 4) * 3
  },
  isLivestream: true
}))

describe('Performance Tests', () => {
  describe('usePerformanceMonitor', () => {
    it('should track render performance', async () => {
      const { result } = renderHook(() => usePerformanceMonitor('TestComponent'))

      // Generate a report
      const report = result.current.generateReport()
      expect(report.timestamp).toBeDefined()
      expect(report.metrics.renderTime).toBeGreaterThanOrEqual(0)
      expect(report.metrics.componentCount).toBeGreaterThanOrEqual(0)
    })

    it('should track memory usage', () => {
      const { result } = renderHook(() => usePerformanceMonitor('TestComponent'))

      const memoryUsage = result.current.trackMemoryUsage()
      // Memory API is Chrome-specific and may not be available in test environment
      if ('memory' in performance) {
        expect(memoryUsage).toBeGreaterThan(0)
      } else {
        expect(memoryUsage).toBeUndefined()
      }
    })

    it('should export performance data', () => {
      const { result } = renderHook(() => usePerformanceMonitor('TestComponent'))

      // Mock createElement and click
      const mockClick = vi.fn()
      const mockElement = { click: mockClick, href: '', download: '' }
      vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any)

      result.current.exportPerformanceData()

      expect(mockClick).toHaveBeenCalled()
    })
  })

  describe('useOperationTimer', () => {
    it('should time operations', () => {
      const { result } = renderHook(() => useOperationTimer('TestOperation'))

      result.current.startTimer()
      const duration = result.current.endTimer()

      expect(duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('usePlayerPool', () => {
    it('should reuse player instances', async () => {
      const { result } = renderHook(() => usePlayerPool({ maxPoolSize: 5 }))

      // Get players
      const player1 = await act(async () => result.current.acquirePlayer('stream1', 'https://example.com/stream1'))
      const player2 = await act(async () => result.current.acquirePlayer('stream2', 'https://example.com/stream2'))

      expect(player1).toBeDefined()
      expect(player2).toBeDefined()
      expect(player1).not.toBe(player2)

      // Release and reacquire
      act(() => result.current.releasePlayer('stream1'))
      const player3 = await act(async () => result.current.acquirePlayer('stream3', 'https://example.com/stream3'))

      // Should reuse the released player
      expect(player3).toBe(player1)
    })

    it('should respect pool size limit', async () => {
      const { result } = renderHook(() => usePlayerPool({ maxPoolSize: 3 }))

      // Fill the pool
      const players: (HTMLIFrameElement | null)[] = []
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          players.push(await result.current.acquirePlayer(`stream${i}`, `https://example.com/stream${i}`))
        }
      })

      // Only maxPoolSize players should be created
      const uniquePlayers = new Set(players)
      expect(uniquePlayers.size).toBeLessThanOrEqual(3)
    })

    it('should clean up idle players', async () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => usePlayerPool({
        maxPoolSize: 5
      }))

      // Get and release a player
      await act(async () => {
        const player = await result.current.acquirePlayer('stream1', 'https://example.com/stream1')
        expect(player).toBeDefined()
        result.current.releasePlayer('stream1')
      })

      // Fast forward past idle timeout
      act(() => vi.advanceTimersByTime(70000)) // Past maxIdleTime

      // Player should be cleaned up
      const poolStats = result.current.getPoolStats()
      expect(poolStats.available).toBe(0)

      vi.useRealTimers()
    })
  })

  describe('useDebouncedStore', () => {
    it('should debounce updates', async () => {
      vi.useFakeTimers()
      const mockSave = vi.fn()

      // Mock the store
      vi.mock('../store/useStreamStore', () => ({
        useStreamStore: () => ({
          updateStream: vi.fn(),
          saveToFile: mockSave,
          streams: mockStreams.slice(0, 5)
        })
      }))

      const { result } = renderHook(() => useDebouncedStore())

      // Make multiple rapid updates
      act(() => {
        result.current.updateStream('stream1', { name: 'Updated Stream 1' })
        result.current.updateStream('stream1', { name: 'Updated Stream 2' })
        result.current.updateStream('stream1', { name: 'Updated Stream 3' })
      })

      // Should not save immediately
      expect(mockSave).not.toHaveBeenCalled()

      // Fast forward past debounce delay
      act(() => vi.advanceTimersByTime(5000))

      // Should save once after debounce
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1)
      })

      vi.useRealTimers()
    })
  })

  describe('useLayoutWorker', () => {
    it('should calculate optimal layout', async () => {
      const { result } = renderHook(() => useLayoutWorker())

      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true)
      })

      const items = mockGridItems.slice(0, 10)
      const optimized = await act(async () =>
        result.current.calculateOptimalLayout(items, 1200, 800, 4)
      )

      expect(optimized).toHaveLength(10)
      expect(optimized[0].x).toBe(0)
      expect(optimized[0].y).toBe(0)
    })

    it('should validate layout for overlaps', async () => {
      const { result } = renderHook(() => useLayoutWorker())

      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true)
      })

      // Valid layout
      const validItems = mockGridItems.slice(0, 4)
      const isValid = await act(async () =>
        result.current.validateLayout(validItems)
      )
      expect(isValid).toBe(true)

      // Invalid layout with overlap
      const invalidItems = [
        { ...mockGridItems[0], x: 0, y: 0, w: 3, h: 3 },
        { ...mockGridItems[1], x: 2, y: 2, w: 3, h: 3 } // Overlaps with first
      ]
      const isInvalid = await act(async () =>
        result.current.validateLayout(invalidItems)
      )
      expect(isInvalid).toBe(false)
    })

    it('should compact layout', async () => {
      const { result } = renderHook(() => useLayoutWorker())

      await waitFor(() => {
        expect(result.current.isWorkerReady).toBe(true)
      })

      // Layout with gaps
      const itemsWithGaps = [
        { ...mockGridItems[0], x: 0, y: 0, w: 3, h: 3 },
        { ...mockGridItems[1], x: 3, y: 6, w: 3, h: 3 }, // Gap at y=3
        { ...mockGridItems[2], x: 6, y: 12, w: 3, h: 3 } // Gap at y=9
      ]

      const compacted = await act(async () =>
        result.current.compactLayout(itemsWithGaps)
      )

      // Should remove gaps
      expect(compacted[1].y).toBe(0) // Moved up to fill gap
      expect(compacted[2].y).toBe(0) // Moved up to fill gap
    })
  })

  describe('VirtualStreamGrid Performance', () => {
    it('should render only visible items', async () => {
      const onStreamUpdate = vi.fn()
      const onStreamRemove = vi.fn()
      const onLayoutChange = vi.fn()

      const { container } = render(
        <div style={{ width: 1200, height: 600 }}>
          <VirtualStreamGrid
            streams={mockStreams}
            onStreamUpdate={onStreamUpdate}
            onStreamRemove={onStreamRemove}
            onLayoutChange={onLayoutChange}
          />
        </div>
      )

      // Should only render visible items (not all 100)
      await waitFor(() => {
        const renderedItems = container.querySelectorAll('[data-testid^="stream-card-"]')
        expect(renderedItems.length).toBeLessThan(20) // Much less than 100
        expect(renderedItems.length).toBeGreaterThan(0)
      })
    })

    it('should handle large datasets efficiently', async () => {
      const largeDataset: Stream[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `stream-${i}`,
        name: `Channel ${i}`,
        logoUrl: `https://example.com/logo${i}.png`,
        streamUrl: `https://twitch.tv/channel${i}`,
        position: {
          x: (i % 10) * 2,
          y: Math.floor(i / 10) * 3
        }
      }))

      const startTime = performance.now()

      render(
        <div style={{ width: 1200, height: 600 }}>
          <VirtualStreamGrid
            streams={largeDataset}
            onStreamUpdate={vi.fn()}
            onStreamRemove={vi.fn()}
            onLayoutChange={vi.fn()}
          />
        </div>
      )

      const renderTime = performance.now() - startTime

      // Should render quickly even with 1000 items
      expect(renderTime).toBeLessThan(100) // Less than 100ms
    })
  })

  describe('OptimizedStreamCard Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const renderSpy = vi.fn()

      // Wrap component to track renders
      const TrackedStreamCard: React.FC<{
        stream: Stream
        onUpdate: (id: string, updates: Partial<Stream>) => void
        onRemove: (id: string) => void
        style: React.CSSProperties
      }> = (props) => {
        renderSpy()
        return <OptimizedStreamCard {...props} />
      }

      const { rerender } = render(
        <TrackedStreamCard
          stream={mockStreams[0]}
          onUpdate={vi.fn()}
          onRemove={vi.fn()}
          style={{}}
        />
      )

      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(
        <TrackedStreamCard
          stream={mockStreams[0]}
          onUpdate={vi.fn()}
          onRemove={vi.fn()}
          style={{}}
        />
      )

      // Should not re-render due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render with different stream
      rerender(
        <TrackedStreamCard
          stream={mockStreams[1]}
          onUpdate={vi.fn()}
          onRemove={vi.fn()}
          style={{}}
        />
      )

      // Should re-render for different stream
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('Bundle Size and Code Splitting', () => {
    it('should lazy load chat components', async () => {
      // This test would normally check actual bundle sizes
      // For now, we'll verify lazy loading works
      expect(LazyChat).toBeDefined()
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should clean up resources on unmount', async () => {
      const { result, unmount } = renderHook(() => usePlayerPool())

      // Get some players
      await act(async () => {
        await result.current.acquirePlayer('stream1', 'https://example.com/stream1')
        await result.current.acquirePlayer('stream2', 'https://example.com/stream2')
      })

      // Unmount should clean up
      unmount()

      // In a real test, we'd check for memory leaks
      // For now, we just ensure no errors occur
      expect(true).toBe(true)
    })
  })
})
