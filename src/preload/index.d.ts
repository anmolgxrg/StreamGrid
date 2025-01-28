import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      version: string
      getGitHubVersion: () => Promise<string | null>
      openExternal: (url: string) => Promise<void>
    }
  }
}
