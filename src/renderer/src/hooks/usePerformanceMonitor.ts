import { useEffect, useRef, useCallback } from 'react'
import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals'

interface PerformanceMetrics {
  renderTime: number
  componentCount: number
  memoryUsage?: number
  fps?: number
}

interface WebVitalsData {
  cls?: number
  fcp?: number
  lcp?: number
  ttfb?: number
  inp?: number
}

interface PerformanceReport {
  timestamp: number
  metrics: PerformanceMetrics
  webVitals?: WebVitalsData
}

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export const usePerformanceMonitor = (componentName: string): {
  generateReport: () => PerformanceReport
  exportPerformanceData: () => void
  trackMemoryUsage: () => number | undefined
} => {
  const renderStartTime = useRef<number>(performance.now())
  const frameCount = useRef<number>(0)
  const lastFrameTime = useRef<number>(performance.now())
  const metricsRef = useRef<PerformanceReport[]>([])

  // Track render time
  useEffect((): void => {
    const renderEndTime = performance.now()
    const renderTime = renderEndTime - renderStartTime.current

    // Update render start time for next render
    renderStartTime.current = renderEndTime

    // Log slow renders
    if (renderTime > 16.67) { // More than one frame (60fps)
      console.warn(`[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms`)
    }
  })

  // Track FPS
  useEffect((): (() => void) => {
    let animationFrameId: number

    const calculateFPS = (): void => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastFrameTime.current

      if (deltaTime >= 1000) { // Update FPS every second
        const fps = (frameCount.current / deltaTime) * 1000
        frameCount.current = 0
        lastFrameTime.current = currentTime

        if (fps < 30) {
          console.warn(`[Performance] Low FPS detected in ${componentName}: ${fps.toFixed(2)}`)
        }
      }

      frameCount.current++
      animationFrameId = requestAnimationFrame(calculateFPS)
    }

    animationFrameId = requestAnimationFrame(calculateFPS)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [componentName])

  // Collect Web Vitals
  useEffect((): (() => void) => {
    const vitals: WebVitalsData = {}

    const handleMetric = (name: keyof WebVitalsData) => (metric: Metric): void => {
      vitals[name] = metric.value
      console.log(`[Performance] ${componentName} ${name.toUpperCase()}: ${metric.value}`)
    }

    onCLS(handleMetric('cls'))
    onFCP(handleMetric('fcp'))
    onLCP(handleMetric('lcp'))
    onTTFB(handleMetric('ttfb'))
    onINP(handleMetric('inp'))

    // Log vitals after a delay
    const timer = setTimeout(() => {
      if (Object.keys(vitals).length > 0) {
        console.log(`[Performance] ${componentName} Web Vitals Summary:`, vitals)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [componentName])

  // Memory usage tracking
  const trackMemoryUsage = useCallback((): number | undefined => {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: PerformanceMemory }).memory
      const usedMemoryMB = memory.usedJSHeapSize / 1048576
      const limitMemoryMB = memory.jsHeapSizeLimit / 1048576

      if (usedMemoryMB > limitMemoryMB * 0.9) {
        console.error(`[Performance] Critical memory usage in ${componentName}: ${usedMemoryMB.toFixed(2)}MB / ${limitMemoryMB.toFixed(2)}MB`)
      } else if (usedMemoryMB > limitMemoryMB * 0.7) {
        console.warn(`[Performance] High memory usage in ${componentName}: ${usedMemoryMB.toFixed(2)}MB / ${limitMemoryMB.toFixed(2)}MB`)
      }

      return usedMemoryMB
    }
    return undefined
  }, [componentName])

  // Performance report generator
  const generateReport = useCallback((): PerformanceReport => {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: {
        renderTime: performance.now() - renderStartTime.current,
        componentCount: document.querySelectorAll('[data-stream-card]').length,
        memoryUsage: trackMemoryUsage(),
        fps: frameCount.current
      }
    }

    metricsRef.current.push(report)

    // Keep only last 100 reports
    if (metricsRef.current.length > 100) {
      metricsRef.current = metricsRef.current.slice(-100)
    }

    return report
  }, [trackMemoryUsage])

  // Export performance data
  const exportPerformanceData = useCallback((): void => {
    const data = {
      component: componentName,
      reports: metricsRef.current,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-${componentName}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [componentName])

  return {
    generateReport,
    exportPerformanceData,
    trackMemoryUsage
  }
}

// Hook for tracking specific operations
export const useOperationTimer = (operationName: string): {
  startTimer: () => void
  endTimer: () => number
} => {
  const startTimeRef = useRef<number>(0)

  const startTimer = useCallback((): void => {
    startTimeRef.current = performance.now()
  }, [])

  const endTimer = useCallback((): number => {
    if (startTimeRef.current === 0) {
      console.warn(`[Performance] Timer not started for operation: ${operationName}`)
      return 0
    }

    const duration = performance.now() - startTimeRef.current
    console.log(`[Performance] ${operationName} took ${duration.toFixed(2)}ms`)

    startTimeRef.current = 0
    return duration
  }, [operationName])

  return { startTimer, endTimer }
}
