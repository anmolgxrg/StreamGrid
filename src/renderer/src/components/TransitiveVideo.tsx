import React, { useEffect, useRef, useState } from 'react'
import { TransitiveCapability } from '@transitive-sdk/utils-web'
import { Box } from '@mui/material'

interface TransitiveVideoProps {
  jwt: string
  count?: number
  sources?: string[]
  className?: string
  style?: React.CSSProperties
  onVideosReady?: (videos: HTMLVideoElement[]) => void
}

export const TransitiveVideo: React.FC<TransitiveVideoProps> = ({
  jwt,
  count = 6,
  sources = ['/cam1', '/cam2', '/cam3', '/cam4', '/cam5', '/cam6'],
  className = '',
  style = {},
  onVideosReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [videos, setVideos] = useState<HTMLVideoElement[]>([])
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    // Add dynamic class based on video count for responsive layout
    if (containerRef.current) {
      const container = containerRef.current
      container.className = `webrtc-video-device ${className}`.trim()
      
      // Add count-specific class for responsive layout
      if (count === 1) container.classList.add('single-video')
      else if (count === 2) container.classList.add('two-videos')
      else if (count === 3) container.classList.add('three-videos')
      else if (count === 4) container.classList.add('four-videos')
      else if (count === 5) container.classList.add('five-videos')
    }
  }, [count, className])

  useEffect(() => {
    // Set up mutation observer to watch for video elements
    if (containerRef.current && !observerRef.current) {
      observerRef.current = new MutationObserver((mutations) => {
        const videoElements = containerRef.current?.querySelectorAll('video') || []
        if (videoElements.length > 0) {
          const videoArray = Array.from(videoElements) as HTMLVideoElement[]
          setVideos(videoArray)
          if (onVideosReady) {
            onVideosReady(videoArray)
          }
        }
      })

      observerRef.current.observe(containerRef.current, {
        childList: true,
        subtree: true
      })
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [onVideosReady])

  // Create props for TransitiveCapability
  const createTransitiveProps = () => {
    const props: Record<string, string> = {
      jwt,
      control_rosVersion: "1",
      control_topic: "/joy",
      control_type: "sensor_msgs/Joy",
      count: count.toString(),
      quantizer: "25",
      rosversion: "1",
      timeout: "1800",
      type: "rostopic"
    }

    // Add source and type props for each camera
    for (let i = 0; i < count; i++) {
      if (i === 0) {
        props.source = sources[i] || `/cam${i + 1}`
        props.type = "rostopic"
      } else {
        props[`source_${i}`] = sources[i] || `/cam${i + 1}`
        props[`type_${i}`] = "rostopic"
        props[`rosversion_${i}`] = "1"
      }
    }

    return props
  }

  const transitiveProps = createTransitiveProps()

  return (
    <Box
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        ...style
      }}
    >
      <TransitiveCapability {...transitiveProps} />
    </Box>
  )
}

export default TransitiveVideo
