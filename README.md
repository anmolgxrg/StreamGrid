# StreamGrid

<div align="center">
  <img src="src/renderer/src/assets/StreamGrid.svg" alt="StreamGrid Logo" width="200"/>
  <h3>Your Streams, Your Layout, Your Way</h3>
</div>

StreamGrid revolutionizes multi-stream viewing by giving you complete freedom over your layout. Want a massive main stream surrounded by smaller feeds? Or five equally-sized streams? Or any other arrangement you can imagine? StreamGrid makes it possible. Built with Electron, React, and TypeScript, it's the perfect solution for watching multiple streams exactly the way you want.

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
  - Persistent layout saving
  - Export and Import your stream setups to share with friends
- **Responsive Design**: Automatically adjusts to window size while maintaining video aspect ratios
- **HLS Support**: Compatible with HTTP Live Streaming (HLS) video sources
- **Cross-Platform**: Available for Windows, macOS, and Linux

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
  
### Option 1: Install from Releases

1. Visit the [Releases](https://github.com/yourusername/streamgrid/releases) section of the repository.
2. Download the latest executable for your platform:
   - **Windows**: `.exe`
   - **macOS**: `.dmg`
   - **Linux**: `.AppImage` or equivalent
3. Run the executable and start using StreamGrid immediately.

### Option 2: Compile Yourself

1. Clone the repository:
```bash
git clone https://github.com/yourusername/streamgrid.git
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
- **Video Playback**:
  - [HLS.js](https://github.com/video-dev/hls.js/)
  - [React Player](https://github.com/cookpete/react-player)
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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
