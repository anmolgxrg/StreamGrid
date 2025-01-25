# StreamGrid

A modern Electron application for watching multiple streams simultaneously in a customizable grid layout.

## Features

- Watch multiple streams at once in a grid layout
- Drag and drop streams to customize your layout
- Add new streams with name, logo, and M3U8 stream link
- Import/Export stream configurations
- Dark theme with modern UI
- Persistent storage of stream configurations
- Automatic layout saving

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

### Running the Application

For development:
```bash
npm start
```

### Building

To create a production build:
```bash
npm run build
```

The built application will be available in the `release` directory.

## Usage

1. Launch the application
2. Click the '+' button to add a new stream
3. Enter the stream details:
   - Stream Name
   - Logo URL (URL to an image that represents the stream)
   - M3U8 Stream Link
4. Drag stream cards to arrange them in your preferred layout
5. Click the play button on a stream card to start watching
6. Use the import/export buttons to save and share your stream configurations

## Stream Configuration Format

When exporting/importing streams, the configuration is saved in JSON format:

```json
{
  "streams": [
    {
      "id": "unique-id",
      "name": "Stream Name",
      "logoUrl": "https://example.com/logo.png",
      "streamUrl": "https://example.com/stream.m3u8"
    }
  ],
  "layout": [
    {
      "i": "unique-id",
      "x": 0,
      "y": 0,
      "w": 2,
      "h": 2
    }
  ]
}
```

## License

MIT
