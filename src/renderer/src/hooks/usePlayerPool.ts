import { useRef, useCallback, useEffect } from 'react'

interface PlayerInstance {
  id: string
  iframe: HTMLIFrameElement | null
  inUse: boolean
  streamId: string | null
  lastUsed: number
}

interface PlayerPoolOptions {
  maxPoolSize?: number
  preloadCount?: number
  cleanupInterval?: number
  maxIdleTime?: number
}

const DEFAULT_OPTIONS: Required<PlayerPoolOptions> = {
  maxPoolSize: 20,
  preloadCount: 5,
  cleanupInterval: 30000, // 30 seconds
  maxIdleTime: 60000 // 1 minute
}

interface PlayerPoolReturn {
  acquirePlayer: (streamId: string, streamUrl: string) => HTMLIFrameElement | null
  releasePlayer: (streamId: string) => void
  getPoolStats: () => {
    total: number
    inUse: number
    available: number
    maxSize: number
  }
  clearPool: () => void
}

export const usePlayerPool = (options: PlayerPoolOptions = {}): PlayerPoolReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const poolRef = useRef<Map<string, PlayerInstance>>(new Map())
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Initialize hidden container for preloaded players
  useEffect((): (() => void) => {
    if (!containerRef.current) {
      const container = document.createElement('div')
      container.id = 'player-pool-container'
      container.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
      document.body.appendChild(container)
      containerRef.current = container
    }

    return () => {
      if (containerRef.current) {
        document.body.removeChild(containerRef.current)
        containerRef.current = null
      }
    }
  }, [])

  // Preload players
  useEffect((): void => {
    const preloadPlayers = (): void => {
      const currentPoolSize = poolRef.current.size
      const availableCount = Array.from(poolRef.current.values()).filter(p => !p.inUse).length

      if (availableCount < config.preloadCount && currentPoolSize < config.maxPoolSize) {
        const playersToCreate = Math.min(
          config.preloadCount - availableCount,
          config.maxPoolSize - currentPoolSize
        )

        for (let i = 0; i < playersToCreate; i++) {
          createPlayer()
        }
      }
    }

    preloadPlayers()
  }, [config.preloadCount, config.maxPoolSize])

  // Cleanup idle players
  useEffect((): (() => void) => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const players = Array.from(poolRef.current.entries())

      players.forEach(([id, player]) => {
        if (!player.inUse && now - player.lastUsed > config.maxIdleTime) {
          destroyPlayer(id)
        }
      })
    }, config.cleanupInterval)

    return () => clearInterval(cleanupInterval)
  }, [config.cleanupInterval, config.maxIdleTime])

  const createPlayer = useCallback((): string => {
    const id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const iframe = document.createElement('iframe')

    iframe.id = id
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `
    iframe.setAttribute('allowfullscreen', 'true')
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture')

    // Add to hidden container initially
    if (containerRef.current) {
      containerRef.current.appendChild(iframe)
    }

    const player: PlayerInstance = {
      id,
      iframe,
      inUse: false,
      streamId: null,
      lastUsed: Date.now()
    }

    poolRef.current.set(id, player)
    console.log(`[PlayerPool] Created player ${id}. Pool size: ${poolRef.current.size}`)

    return id
  }, [])

  const destroyPlayer = useCallback((playerId: string): void => {
    const player = poolRef.current.get(playerId)
    if (player) {
      if (player.iframe && player.iframe.parentNode) {
        player.iframe.parentNode.removeChild(player.iframe)
      }
      poolRef.current.delete(playerId)
      console.log(`[PlayerPool] Destroyed player ${playerId}. Pool size: ${poolRef.current.size}`)
    }
  }, [])

  const acquirePlayer = useCallback((streamId: string, streamUrl: string): HTMLIFrameElement | null => {
    // First, check if this stream already has a player
    const existingPlayer = Array.from(poolRef.current.values()).find(
      p => p.streamId === streamId
    )

    if (existingPlayer && existingPlayer.iframe) {
      console.log(`[PlayerPool] Reusing existing player for stream ${streamId}`)
      existingPlayer.inUse = true
      existingPlayer.lastUsed = Date.now()
      return existingPlayer.iframe
    }

    // Find an available player
    let player = Array.from(poolRef.current.values()).find(p => !p.inUse)

    // If no available player and pool not at max, create new one
    if (!player && poolRef.current.size < config.maxPoolSize) {
      const newPlayerId = createPlayer()
      player = poolRef.current.get(newPlayerId)
    }

    if (player && player.iframe) {
      player.inUse = true
      player.streamId = streamId
      player.lastUsed = Date.now()

      // Update iframe src
      player.iframe.src = streamUrl

      console.log(`[PlayerPool] Acquired player ${player.id} for stream ${streamId}`)
      return player.iframe
    }

    console.warn(`[PlayerPool] No available players for stream ${streamId}`)
    return null
  }, [config.maxPoolSize, createPlayer])

  const releasePlayer = useCallback((streamId: string): void => {
    const player = Array.from(poolRef.current.values()).find(
      p => p.streamId === streamId
    )

    if (player) {
      player.inUse = false
      player.streamId = null
      player.lastUsed = Date.now()

      // Clear iframe src to free resources
      if (player.iframe) {
        player.iframe.src = 'about:blank'

        // Move back to hidden container
        if (containerRef.current && player.iframe.parentNode !== containerRef.current) {
          containerRef.current.appendChild(player.iframe)
        }
      }

      console.log(`[PlayerPool] Released player ${player.id}`)
    }
  }, [])

  const getPoolStats = useCallback((): {
    total: number
    inUse: number
    available: number
    maxSize: number
  } => {
    const players = Array.from(poolRef.current.values())
    return {
      total: players.length,
      inUse: players.filter(p => p.inUse).length,
      available: players.filter(p => !p.inUse).length,
      maxSize: config.maxPoolSize
    }
  }, [config.maxPoolSize])

  const clearPool = useCallback((): void => {
    poolRef.current.forEach((_player, id) => {
      destroyPlayer(id)
    })
    poolRef.current.clear()
    console.log('[PlayerPool] Cleared all players')
  }, [destroyPlayer])

  return {
    acquirePlayer,
    releasePlayer,
    getPoolStats,
    clearPool
  }
}

// Global player pool instance
let globalPlayerPool: PlayerPoolReturn | null = null

export const getGlobalPlayerPool = (): PlayerPoolReturn => {
  if (!globalPlayerPool) {
    console.log('[PlayerPool] Initializing global player pool')
    // This is a workaround since we can't use hooks outside components
    // In a real implementation, this would be initialized in a top-level component
    const pool: PlayerPoolReturn = {
      acquirePlayer(): HTMLIFrameElement | null {
        // Implementation similar to the hook version
        console.warn('[PlayerPool] Global pool not properly initialized')
        return null
      },

      releasePlayer(): void {
        // Implementation similar to the hook version
        console.warn('[PlayerPool] Global pool not properly initialized')
      },

      getPoolStats(): {
        total: number
        inUse: number
        available: number
        maxSize: number
      } {
        return {
          total: 0,
          inUse: 0,
          available: 0,
          maxSize: DEFAULT_OPTIONS.maxPoolSize
        }
      },

      clearPool(): void {
        // Implementation similar to the hook version
        console.warn('[PlayerPool] Global pool not properly initialized')
      }
    }

    globalPlayerPool = pool
  }

  return globalPlayerPool
}
