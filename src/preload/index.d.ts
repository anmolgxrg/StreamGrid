import { ElectronAPI } from '@electron-toolkit/preload'
import type { SavedGrid, GridManifest } from '../shared/types/grid'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      version: string
      getGitHubVersion: () => Promise<string | null>
      openExternal: (url: string) => Promise<void>
      // Grid management APIs
      saveGrid: (grid: SavedGrid) => Promise<void>
      loadGrid: (gridId: string) => Promise<SavedGrid | null>
      deleteGrid: (gridId: string) => Promise<void>
      renameGrid: (gridId: string, newName: string) => Promise<void>
      getGridManifest: () => Promise<GridManifest>
      getAllGrids: () => Promise<Array<{ id: string; name: string; lastModified: string; streamCount: number }>>
    }
  }
}
