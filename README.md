# StreamGrid

<div align="center">
  <img src="src/renderer/src/assets/StreamGrid.svg" alt="StreamGrid Logo" width="200"/>
  <h3>A Modern Stream Management Desktop Application</h3>
</div>

StreamGrid is an Electron-based desktop application built with React and TypeScript that allows users to manage and view multiple video streams simultaneously in a customizable grid layout. Perfect for monitoring multiple live streams, security cameras, or any video sources that support HLS streaming.

## ✨ Features

- **Customizable Grid Layout**: Drag-and-drop interface to arrange streams in a 12-column grid
- **Resizable Stream Windows**: Adjust the size of individual stream windows to focus on important content
- **Stream Management**:
  - Add new streams with custom names and logos
  - Remove streams with a single click
  - Persistent layout saving
- **Responsive Design**: Automatically adjusts to window size while maintaining video aspect ratios
- **HLS Support**: Compatible with HTTP Live Streaming (HLS) video sources
- **Cross-Platform**: Available for Windows, macOS, and Linux

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

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

## 🧰 Development Tools

- [VSCode](https://code.visualstudio.com/) - Recommended IDE
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - Code linting
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - Code formatting

## 📝 Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application
- `npm run lint` - Lint the codebase
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm start` - Preview the built application

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
