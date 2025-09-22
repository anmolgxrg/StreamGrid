import React, { useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { TransitiveCapability } from '@transitive-sdk/utils-web';

interface TransitiveVideoProps {
    onVideosReady?: (videoElements: HTMLVideoElement[]) => void;
    onClose?: () => void;
}

export const TransitiveVideo: React.FC<TransitiveVideoProps> = ({ onVideosReady }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsContainerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        console.log('TransitiveVideo: Component mounted, setting up observers');
        
        // Function to check for video elements and extract controls
        const checkVideosAndControls = () => {
            if (containerRef.current) {
                const videos = containerRef.current.querySelectorAll('video');
                if (videos.length > 0) {
                    console.log(`TransitiveVideo: Found ${videos.length} video elements`);
                    onVideosReady?.(Array.from(videos) as HTMLVideoElement[]);
                    setIsLoaded(true);
                }
                
                // Look for controls in the original TransitiveCapability instance
                const controls = containerRef.current.querySelector('.remote-teleop-joystick');
                if (controls && controlsContainerRef.current) {
                    console.log('TransitiveVideo: Found controls, moving to visible container');
                    
                    // Clone the controls to the visible container
                    const clonedControls = controls.cloneNode(true) as HTMLElement;
                    controlsContainerRef.current.innerHTML = '';
                    controlsContainerRef.current.appendChild(clonedControls);
                    
                    // Make sure the controls are interactive
                    clonedControls.style.pointerEvents = 'all';
                    clonedControls.style.width = '100%';
                    clonedControls.style.height = '100%';
                }
            }
        };
        
        // Set up mutation observer to watch for elements
        if (containerRef.current) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node as Element;
                                console.log(`TransitiveVideo: Added element: ${element.tagName}`);
                                
                                // Check for videos and controls whenever new elements are added
                                setTimeout(checkVideosAndControls, 100);
                            }
                        });
                    }
                });
            });

            observer.observe(containerRef.current, {
                childList: true,
                subtree: true
            });

            // Periodic check for videos and controls
            const interval = setInterval(checkVideosAndControls, 1000);

            // Initial check
            setTimeout(checkVideosAndControls, 1000);
            setTimeout(checkVideosAndControls, 3000);

            return () => {
                observer.disconnect();
                clearInterval(interval);
            };
        }
    }, [onVideosReady, isLoaded]);

    return (
        <>
            {/* Single TransitiveCapability instance with both video and controls */}
            <Box
                ref={containerRef}
                sx={{
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                    overflow: 'hidden'
                }}
            >
                <TransitiveCapability
                    jwt="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZseXdoZWVsIiwiZGV2aWNlIjoiZF84ZGQzMTQzN2E2IiwiY2FwYWJpbGl0eSI6IkB0cmFuc2l0aXZlLXJvYm90aWNzL3JlbW90ZS10ZWxlb3AiLCJ1c2VySWQiOiJ1c2VyMTIzIiwidmFsaWRpdHkiOjg2NDAwLCJpYXQiOjE3NTg0NDMwNTh9.AXZ45gAwMZTowEXulOAbHGTiKaCprxIe40SxT4cunSs"
                    control_rosVersion="1"
                    alwayson="true"
                    control_topic="/joy"
                    control_type="sensor_msgs/Joy"
                    count="6"
                    quantizer="25"
                    rosversion="1"
                    rosversion_1="1"
                    rosversion_2="1"
                    rosversion_3="1"
                    rosversion_4="1"
                    rosversion_5="1"
                    source="/cam1"
                    source_1="/cam2"
                    source_2="/cam3"
                    source_3="/cam4"
                    source_4="/cam5"
                    source_5="/cam6"
                    timeout="1800"
                    type="rostopic"
                    type_1="rostopic"
                    type_2="rostopic"
                    type_3="rostopic"
                    type_4="rostopic"
                    type_5="rostopic"
                />
            </Box>
            
            {/* Visible controls container that displays controls from the original instance */}
            <Box
                ref={controlsContainerRef}
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1001,
                    width: '400px',
                    height: '150px',
                    pointerEvents: 'all',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '2px solid #00ff00',
                    borderRadius: '8px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Box
                    sx={{
                        color: 'white',
                        fontSize: '12px'
                    }}
                >
                    Waiting for controls from original stream...
                </Box>
            </Box>
        </>
    );
};