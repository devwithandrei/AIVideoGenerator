'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { convertToMP4Simple } from '@/lib/video-converter';

interface NewspaperSpinCanvasProps {
  name: string;
  theme: 'light' | 'dark';
  aspect: 'landscape' | 'vertical';
  duration: '5s' | '10s' | '15s' | '20s' | '25s' | '30s' | 'auto';
  isGenerating: boolean;
  onVideoGenerated: (blob: Blob) => void;
  onProgress: (progress: number) => void;
}

const loremIpsumText = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
`;

export const NewspaperSpinCanvas: React.FC<NewspaperSpinCanvasProps> = ({
  name,
  theme,
  aspect,
  duration,
  isGenerating,
  onVideoGenerated,
  onProgress,
}) => {
  console.log('NewspaperSpinCanvas render:', { name, theme, aspect, isGenerating });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [hasStartedRecording, setHasStartedRecording] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Calculate dimensions with higher resolution for better quality
  const isVertical = aspect === 'vertical';
  const width = isVertical ? 1080 : 1920;
  const height = isVertical ? 1920 : 1080;
  const fps = 60;
  
  // Calculate duration based on selection
  const getDurationSeconds = () => {
    switch (duration) {
      case '5s': return 5;
      case '10s': return 10;
      case '15s': return 15;
      case '20s': return 20;
      case '25s': return 25;
      case '30s': return 30;
      case 'auto': return 5;
      default: return 5;
    }
  };
  
  const durationSeconds = getDurationSeconds();
  const totalFrames = fps * durationSeconds;

  // Animation state
  const [currentFrame, setCurrentFrame] = useState(0);

  // Colors based on theme
  const backgroundColor = theme === 'light' ? '#ffffff' : '#000000';
  const textColor = theme === 'light' ? '#000000' : '#ffffff';
  const highlightColor = '#ff6b35';

  const drawFrame = useCallback((frame: number) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('Canvas not found in drawFrame');
        return;
      }

      // Ensure canvas is properly sized
      canvas.width = width;
      canvas.height = height;

      // Draw on display canvas with maximum quality settings
      const ctx = canvas.getContext('2d', { 
        alpha: false, 
        desynchronized: false,
        willReadFrequently: false,
        colorSpace: 'srgb'
      });
      if (!ctx) {
        console.error('Could not get canvas context in drawFrame');
        return;
      }

      // Enable maximum quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.filter = 'none';
      
      // Clear canvas with background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Calculate animation progress (0 to 1)
      const progress = frame / totalFrames;

      // Enhanced spin animation (0 to 1.2 seconds)
      const spinProgress = Math.min(progress * 4.2, 1);
      const spinRotation = spinProgress * 720; // 720 degrees with easing

      // Enhanced zoom animation
      const scale = 1 + (progress * 0.15);

      // Enhanced headline fade-in (starts at 0.7 seconds)
      const headlineOpacity = Math.max(0, Math.min(1, (progress - 0.7) * 3.33));

      // Calculate newspaper position and rotation
      const newspaperX = width / 2;
      const newspaperY = height / 2;
      const newspaperWidth = width * 0.8;
      const newspaperHeight = height * 0.8;

      // Calculate headline position
      const headlineX = width / 2;
      const headlineY = height / 2;
      const headlineWidth = name.length * 40;
      const headlineHeight = 80;

      // Draw newspaper background
      ctx.save();
      ctx.translate(newspaperX, newspaperY);
      ctx.rotate((spinRotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(-newspaperX, -newspaperY);

      // Newspaper background
      ctx.fillStyle = textColor;
      ctx.fillRect(
        newspaperX - newspaperWidth / 2,
        newspaperY - newspaperHeight / 2,
        newspaperWidth,
        newspaperHeight
      );

      // Newspaper content
      ctx.fillStyle = backgroundColor;
      ctx.font = '14px Georgia, serif';
      ctx.textAlign = 'justify';
      ctx.lineHeight = 1.6;

      const textLines = loremIpsumText.split('\n\n');
      let yOffset = newspaperY - newspaperHeight / 2 + 40;

      textLines.forEach((line, index) => {
        if (index === 0) {
          ctx.font = '24px Georgia, serif';
          ctx.fillText('THE DAILY NEWS', newspaperX - newspaperWidth / 2 + 20, yOffset);
          yOffset += 40;
          ctx.font = '14px Georgia, serif';
        }

        const words = line.split(' ');
        let currentLine = '';
        let lineY = yOffset;

        words.forEach((word) => {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > newspaperWidth - 40 && currentLine !== '') {
            ctx.fillText(currentLine, newspaperX - newspaperWidth / 2 + 20, lineY);
            currentLine = word + ' ';
            lineY += 20;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) {
          ctx.fillText(currentLine, newspaperX - newspaperWidth / 2 + 20, lineY);
        }
        
        yOffset = lineY + 20;
      });

      ctx.restore();

      // Draw headline with highlight
      if (headlineOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = headlineOpacity;
        
        // Headline background
        ctx.fillStyle = highlightColor;
        ctx.fillRect(
          headlineX - headlineWidth / 2 - 50,
          headlineY - headlineHeight / 2 - 25,
          headlineWidth + 100,
          headlineHeight + 50
        );

        // Headline text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.toUpperCase(), headlineX, headlineY);
        
        ctx.restore();
      }
    } catch (error) {
      console.error('Error in drawFrame:', error);
    }
  }, [name, theme, aspect, width, height, totalFrames, backgroundColor, textColor, highlightColor, isVertical]);

  const startRecording = useCallback(() => {
    console.log('startRecording called');
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    console.log('Starting video generation with MediaRecorder...');
    setHasStartedRecording(true);
    setCurrentFrame(0);

    try {
      // Create a MediaRecorder to capture the animation
      const stream = canvas.captureStream(fps);
      
      // Check available MIME types
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];
      
      let selectedMimeType = null;
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No supported video MIME type found for MediaRecorder');
      }
      
      console.log('Using MIME type:', selectedMimeType);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log('Data available, chunk size:', event.data.size, 'total chunks:', chunks.length);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const recordedBlob = new Blob(chunks, { type: selectedMimeType });
          console.log('MediaRecorder stopped. Recorded blob size:', recordedBlob.size, 'bytes');
          
          if (recordedBlob.size === 0) {
            console.error('Recorded blob is empty. Falling back to static image.');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.toBlob((blob) => {
                if (blob) {
                  const videoBlob = new Blob([blob], { type: 'video/mp4' });
                  onVideoGenerated(videoBlob);
                }
              }, 'image/png', 1.0);
            }
            setHasStartedRecording(false);
            return;
          }

          // Convert to MP4 using our utility
          const mp4Blob = await convertToMP4Simple(recordedBlob);
          console.log('Converted to MP4, final blob size:', mp4Blob.size, 'bytes');
          
          onVideoGenerated(mp4Blob);
        } catch (error) {
          console.error('Error processing recorded video:', error);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.toBlob((blob) => {
              if (blob) {
                const videoBlob = new Blob([blob], { type: 'video/mp4' });
                onVideoGenerated(videoBlob);
              }
            }, 'image/png', 1.0);
          }
        } finally {
          setHasStartedRecording(false);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', (event as MediaRecorderErrorEvent).error);
        setHasStartedRecording(false);
      };

      mediaRecorder.start();
      console.log('MediaRecorder started.');

      let frame = 0;
      const animate = () => {
        if (frame >= totalFrames) {
          console.log('Animation complete, stopping MediaRecorder.');
          mediaRecorder.stop();
          return;
        }

        drawFrame(frame);
        setCurrentFrame(frame);
        onProgress((frame / totalFrames) * 100);

        frame++;
        animationRef.current = requestAnimationFrame(animate);
      };

      console.log('Starting animation loop for recording...');
      animationRef.current = requestAnimationFrame(animate);

    } catch (error) {
      console.error('Error in startRecording setup:', error);
      setHasStartedRecording(false);
    }
  }, [drawFrame, totalFrames, onVideoGenerated, onProgress, width, height, fps]);

  // Use the video converter utility
  const convertToMP4Function = convertToMP4Simple;

  // Auto-start recording when isGenerating becomes true
  useEffect(() => {
    if (isGenerating && !hasStartedRecording && canvasReady) {
      console.log('Auto-starting video generation...');
      
      const checkCanvasAndStart = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          console.log('Canvas not ready yet, retrying in 100ms...');
          setTimeout(checkCanvasAndStart, 100);
          return;
        }
        
        console.log('Canvas is ready, starting video generation...');
        drawFrame(0);
        setTimeout(() => {
          try {
            startRecording();
          } catch (error) {
            console.error('Failed to start video generation:', error);
            setHasStartedRecording(false);
          }
        }, 200);
      };
      
      checkCanvasAndStart();
    } else if (isGenerating && !canvasReady) {
      console.log('Waiting for canvas to be ready before starting video generation...');
    }
  }, [isGenerating, hasStartedRecording, drawFrame, startRecording, canvasReady]);

  // Track canvas readiness
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !canvasReady) {
      console.log('Canvas element found and ready');
      setCanvasReady(true);
    }
  }, [canvasReady]);

  // Draw initial preview when component mounts and canvas is ready
  useEffect(() => {
    if (!canvasReady) {
      console.log('Canvas not ready yet, waiting...');
      return;
    }
    
    const drawInitialFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log('Canvas not ready for initial frame, retrying...');
        setTimeout(drawInitialFrame, 100);
        return;
      }
      console.log('Drawing initial preview frame');
      drawFrame(0);
    };
    
    drawInitialFrame();
  }, [drawFrame, canvasReady]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <canvas
          ref={(element) => {
            canvasRef.current = element;
            if (element && !canvasReady) {
              console.log('Canvas ref set successfully');
              setCanvasReady(true);
            }
          }}
          width={width}
          height={height}
          className="w-full h-full object-contain"
          style={{
            display: 'block',
            imageRendering: 'high-quality',
          }}
        />
      </div>
      {hasStartedRecording && (
        <div className="text-center">
          <div className="text-sm text-gray-600">
            Recording Progress: {Math.round((currentFrame / totalFrames) * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};
