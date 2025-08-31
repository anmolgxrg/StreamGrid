import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import express from 'express'
import { Server } from 'http'
import { app as electronApp } from 'electron'

interface RtspStream {
  id: string
  process: ChildProcess
  port: number
  server: Server
  outputDir: string
}

class RtspService {
  private streams: Map<string, RtspStream> = new Map()
  private basePort = 8100

  constructor() {
    // Cleanup on app quit
    electronApp.on('before-quit', () => {
      this.cleanup()
    })
  }

  async startStream(streamId: string, rtspUrl: string): Promise<{ url: string; port: number }> {
    // Check if stream already exists
    if (this.streams.has(streamId)) {
      const existing = this.streams.get(streamId)!
      return {
        url: `http://localhost:${existing.port}/stream.m3u8`,
        port: existing.port
      }
    }

    // Find available port
    const port = this.findAvailablePort()

    // Create output directory
    const outputDir = path.join(electronApp.getPath('temp'), 'streamgrid-rtsp', streamId)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Clean up any existing files
    const files = fs.readdirSync(outputDir)
    files.forEach(file => {
      fs.unlinkSync(path.join(outputDir, file))
    })

    // Create Express server to serve HLS segments
    const app = express()
    app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET')
      res.header('Access-Control-Allow-Headers', 'Content-Type')
      next()
    })

    app.use(express.static(outputDir))

    const server = app.listen(port)

    // FFmpeg command for RTSP to HLS conversion
    const outputPath = path.join(outputDir, 'stream.m3u8')
    const ffmpegArgs = [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-c:a', 'aac',
      '-f', 'hls',
      '-hls_time', '2',
      '-hls_list_size', '3',
      '-hls_flags', 'delete_segments',
      '-hls_segment_filename', path.join(outputDir, 'segment%03d.ts'),
      outputPath
    ]

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs)

    // Handle FFmpeg output
    ffmpegProcess.stderr.on('data', (data) => {
      const message = data.toString()
      // Log errors but filter out normal FFmpeg output
      if (message.includes('error') || message.includes('Error')) {
        console.error(`FFmpeg error for stream ${streamId}:`, message)
      }
    })

    ffmpegProcess.on('error', (error) => {
      console.error(`Failed to start FFmpeg for stream ${streamId}:`, error)
      this.stopStream(streamId)
    })

    ffmpegProcess.on('exit', (code) => {
      console.log(`FFmpeg process for stream ${streamId} exited with code ${code}`)
      this.stopStream(streamId)
    })

    // Store stream info
    this.streams.set(streamId, {
      id: streamId,
      process: ffmpegProcess,
      port,
      server,
      outputDir
    })

    // Wait a moment for FFmpeg to start generating segments
    await new Promise(resolve => setTimeout(resolve, 2000))

    return {
      url: `http://localhost:${port}/stream.m3u8`,
      port
    }
  }

  stopStream(streamId: string): void {
    const stream = this.streams.get(streamId)
    if (!stream) return

    // Kill FFmpeg process
    if (stream.process && !stream.process.killed) {
      stream.process.kill('SIGTERM')
    }

    // Stop HTTP server
    stream.server.close()

    // Clean up files
    try {
      const files = fs.readdirSync(stream.outputDir)
      files.forEach(file => {
        fs.unlinkSync(path.join(stream.outputDir, file))
      })
      fs.rmdirSync(stream.outputDir)
    } catch (error) {
      console.error(`Error cleaning up stream ${streamId}:`, error)
    }

    this.streams.delete(streamId)
  }

  private findAvailablePort(): number {
    let port = this.basePort
    while (Array.from(this.streams.values()).some(s => s.port === port)) {
      port++
    }
    return port
  }

  cleanup(): void {
    this.streams.forEach((stream) => {
      this.stopStream(stream.id)
    })
  }

  async checkFfmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn('ffmpeg', ['-version'])

      process.on('error', () => {
        resolve(false)
      })

      process.on('exit', (code) => {
        resolve(code === 0)
      })
    })
  }
}

export const rtspService = new RtspService()
