# StreamGrid

<div align="center">
  <img src="src/renderer/src/assets/StreamGrid.svg" alt="StreamGrid Logo" width="200"/>
  <h3>Your Streams, Your Layout, Your Way</h3>
</div>

StreamGrid revolutionizes multi-stream viewing by giving you complete freedom over your layout. Want a massive main stream surrounded by smaller feeds? Or five equally-sized streams? Or any other arrangement you can imagine? StreamGrid makes it possible. Built with Electron, React, and TypeScript, it's the perfect solution for watching multiple streams exactly the way you want.

https://github.com/user-attachments/assets/1e098512-ed39-4094-ab13-84c144e60f7c

## ✨ Features

- **Ultimate Layout Flexibility**:
  - Create ANY layout you can imagine - from 2 streams to 5+ streams
  - Make streams any size you want - go big with your main stream while keeping others visible
  - Perfect for scenarios like:
    * One large main stream surrounded by smaller secondary streams
    * Equal-sized grid for monitoring multiple sources
    * Custom arrangements for esports tournaments or multi-angle viewing
- **Intuitive Controls**:
  - Drag & Drop: Instantly reorganize your layout
  - Resize Handles: Click and drag to adjust stream sizes in real-time
- **Stream Management**:
  - Add new streams with custom names and logos
  - Remove streams with a single click
  - Persistent layout saving with aggressive auto-save
  - Export and Import your stream setups to share with friends
- **Grid Management System** (New in v1.2.0):
  - Save multiple grid configurations
  - Switch between different saved layouts instantly
  - Rename and organize your grid presets
  - Perfect for different viewing scenarios (gaming, monitoring, events)
- **Responsive Design**: Automatically adjusts to window size while maintaining video aspect ratios
- **Stream Platform Support**:
  - **Local Files** (New in v1.2.0): Play video files directly from your computer
  - **YouTube**: Support for standard videos, live streams, and shorts
  - **Twitch**: Support for channel live streams
  - **HLS Support**: Compatible with HTTP Live Streaming (HLS) video sources
  - **MPEG-DASH Support**: Compatible with Dynamic Adaptive Streaming over HTTP (DASH) video sources
- **Chat Integration**:
  - YouTube chat for live streams and videos
  - Twitch chat for live streams
  - Draggable and resizable chat windows
- **Performance Optimized** (Enhanced in v1.2.0):
  - Virtual grid rendering for smooth performance with many streams
  - Intelligent player pooling to reduce memory usage
  - Optimized startup times and resource management
- **Cross-Platform**: Available for Windows, macOS, and Linux

## 🚀 Getting Started

### Option 1: Install from Releases

1. Visit the [Releases](https://github.com/LordKnish/StreamGrid/releases) section of the repository.
2. Download the latest executable for your platform:
   - **Windows**: `.exe`
   - **macOS**: `.dmg`
   - **Linux**: `.AppImage` or equivalent
3. Run the executable and start using StreamGrid immediately.

### Option 2: Compile Yourself

Prerequisites:

- Node.js 18.x or higher
- npm 9.x or higher

1. Clone the repository:
```bash
git clone https://github.com/LordKnish/streamgrid.git
cd streamgrid
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the application in development mode:
```bash
npm run dev
```

### Building

Build for your current platform:
```bash
npm run build
```

Platform-specific builds:
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 🛠 Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/) with [electron-vite](https://electron-vite.org/)
- **Frontend**:
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Material-UI](https://mui.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Video Playback & Streaming**:
  - [React Player](https://github.com/cookpete/react-player) - Multi-platform video support
  - [HLS.js](https://github.com/video-dev/hls.js/) - HLS streaming support
  - [dash.js](https://github.com/Dash-Industry-Forum/dash.js) - MPEG-DASH streaming support
  - YouTube Player API integration
  - Twitch Player API integration
- **Layout**: [React Grid Layout](https://github.com/react-grid-layout/react-grid-layout)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)

## 🏗 Project Structure

```
streamgrid/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts
│   └── renderer/       # React application
│       ├── src/
│       │   ├── assets/     # Static assets
│       │   ├── components/ # React components
│       │   ├── store/      # Zustand store
│       │   ├── types/      # TypeScript types
│       │   └── utils/      # Utility functions
│       └── index.html
├── electron.vite.config.ts # Electron-vite configuration
└── package.json
```

## 📋 Changelog

### Version 1.2.0 (Latest)
**Major Performance Update & Enhanced Features**

#### 🚀 Performance Optimizations
- **Removed artificial loading delays** - Faster application startup
- **Virtual grid rendering** - Implemented react-window for efficient handling of large grids
- **Player pool system** - Reuses video player instances to optimize memory usage
- **Debounced state updates** - Reduced I/O operations with intelligent 5-second intervals
- **Web worker integration** - Layout calculations now run in separate thread for UI responsiveness
- **Lazy loading** - Chat components load on-demand for faster initial render
- **Code splitting** - Optimized bundle sizes with manual chunking strategy
- **Performance monitoring** - Built-in hooks to track and analyze app performance

#### 💾 Enhanced Saving System
- **Aggressive auto-save** - Immediate saves on all critical operations:
  - Stream addition/removal
  - Stream property updates
  - Layout changes (resize/reposition)
  - Grid switching
  - Application quit
  - Browser refresh/close

#### 🎯 New Features
- **Local file support** - Play video files directly from your computer
- **Grid management system** - Save, load, and organize multiple grid configurations
- **Import grid configurations** - Share and import grid setups from JSON files
- **Auto-generated avatars** - Streams without logos get unique identicon avatars
- **Comprehensive error handling** - Improved error boundaries and user feedback

#### 🐛 Bug Fixes
- Fixed grid rename functionality
- Resolved Twitch streams not starting (added required parent parameter)
- Improved drag functionality and text selection handling
- Fixed duplicate logo URL issues

### Version 1.1.0
**Multi-Platform Streaming Support**

- Added DASH streaming protocol support
- Integrated YouTube live chat functionality
- Added Twitch stream and chat support
- Improved URL handling and stream type detection
- Enhanced drag-and-drop functionality
- Added GitHub version checking with update alerts

### Version 1.0.0
**Initial Release**

- Core multi-stream grid functionality
- Drag-and-drop stream repositioning
- Resizable stream windows
- Stream import/export capabilities
- Cross-platform support (Windows, macOS, Linux)
- HLS streaming support
- Persistent layout saving

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
