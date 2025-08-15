'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { convertToMP4Simple } from '@/lib/video-converter';

interface NewspaperSearchCanvasProps {
  name: string;
  theme: 'light' | 'dark';
  aspect: 'landscape' | 'vertical';
  duration: '5s' | '10s' | '15s' | '20s' | '25s' | '30s' | 'auto';
  newspaperImage: string | null;
  isGenerating: boolean;
  onVideoGenerated: (blob: Blob) => void;
  onProgress: (progress: number) => void;
}

export const NewspaperSearchCanvas: React.FC<NewspaperSearchCanvasProps> = ({
  name,
  theme,
  aspect,
  duration,
  newspaperImage,
  isGenerating,
  onVideoGenerated,
  onProgress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [hasStartedRecording, setHasStartedRecording] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Calculate dimensions
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
      case 'auto': return 8;
      default: return 8;
    }
  };
  
  const durationSeconds = getDurationSeconds();
  const totalFrames = fps * durationSeconds;

  const [currentFrame, setCurrentFrame] = useState(0);

  // Colors
  const backgroundColor = theme === 'light' ? '#ffffff' : '#000000';
  const textColor = theme === 'light' ? '#000000' : '#ffffff';
  const highlightColor = '#ff6b35';
  const searchColor = '#00ff00';
  const searchGlowColor = '#00ff88';

  // Load newspaper image
  useEffect(() => {
    if (newspaperImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImageElement(img);
        setImageLoaded(true);
      };
      img.onerror = () => {
        console.error('Failed to load newspaper image');
        setImageLoaded(false);
      };
      img.src = newspaperImage;
    } else {
      setImageElement(null);
      setImageLoaded(false);
    }
  }, [newspaperImage]);

  const drawFrame = useCallback((frame: number) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { 
        alpha: false, 
        desynchronized: false,
        willReadFrequently: false,
        colorSpace: 'srgb'
      });
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.filter = 'none';
      
      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Calculate animation progress
      const progress = frame / totalFrames;

      // Animation phases
      const phase1 = progress < 0.2; // Initial zoom (0-20%)
      const phase2 = progress >= 0.2 && progress < 0.4; // Pan across (20-40%)
      const phase3 = progress >= 0.4 && progress < 0.6; // Search rectangle (40-60%)
      const phase4 = progress >= 0.6 && progress < 0.8; // Magnifying glass (60-80%)
      const phase5 = progress >= 0.8; // Name highlight (80-100%)

      // Calculate zoom and pan
      const initialZoom = 0.3;
      const finalZoom = 1.2;
      const zoom = initialZoom + (progress * (finalZoom - initialZoom));

      // Calculate pan position
      const panX = phase2 ? (progress - 0.2) * 0.4 * width : 0;
      const panY = phase2 ? Math.sin((progress - 0.2) * 10) * 50 : 0;

      // Search rectangle animation
      const searchRectOpacity = phase3 ? (progress - 0.4) * 5 : phase4 ? 1 : 0;
      const searchRectScale = phase3 ? (progress - 0.4) * 5 : 1;

      // Magnifying glass animation
      const magnifierOpacity = phase4 ? (progress - 0.6) * 5 : phase5 ? 1 : 0;
      const magnifierScale = phase4 ? (progress - 0.6) * 5 : 1;

      // Name highlight animation
      const nameOpacity = phase5 ? (progress - 0.8) * 5 : 0;
      const nameScale = phase5 ? 1 + ((progress - 0.8) * 0.2) : 1;

      // Draw newspaper image background
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(panX, panY);
      ctx.translate(-width / 2, -height / 2);

      if (imageElement && imageLoaded) {
        // Calculate aspect ratio to fit image properly
        const imgAspect = imageElement.width / imageElement.height;
        const canvasAspect = width / height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider than canvas
          drawHeight = height;
          drawWidth = height * imgAspect;
          drawX = (width - drawWidth) / 2;
          drawY = 0;
        } else {
          // Image is taller than canvas
          drawWidth = width;
          drawHeight = width / imgAspect;
          drawX = 0;
          drawY = (height - drawHeight) / 2;
        }
        
        ctx.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);
      } else {
        // Fallback: draw a mock newspaper
        ctx.fillStyle = textColor;
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = backgroundColor;
        ctx.font = '24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('THE DAILY NEWS', width / 2, height / 2 - 50);
        
        ctx.font = '18px Georgia, serif';
        ctx.fillText('Lorem ipsum dolor sit amet, consectetur adipiscing elit.', width / 2, height / 2);
        ctx.fillText('Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', width / 2, height / 2 + 30);
      }
      
      ctx.restore();

      // Draw search rectangle
      if (searchRectOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = searchRectOpacity;
        ctx.strokeStyle = searchColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        const rectX = width * 0.3;
        const rectY = height * 0.4;
        const rectWidth = 200 * searchRectScale;
        const rectHeight = 60 * searchRectScale;
        
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        ctx.restore();
      }

      // Draw magnifying glass
      if (magnifierOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = magnifierOpacity;
        ctx.strokeStyle = searchColor;
        ctx.lineWidth = 4;
        
        const magnifierX = width * 0.6;
        const magnifierY = height * 0.3;
        const magnifierSize = 80 * magnifierScale;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(magnifierX, magnifierY, magnifierSize / 2, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw handle
        ctx.beginPath();
        ctx.moveTo(magnifierX + magnifierSize / 2, magnifierY + magnifierSize / 2);
        ctx.lineTo(magnifierX + magnifierSize / 2 + 20, magnifierY + magnifierSize / 2 + 20);
        ctx.stroke();
        
        ctx.restore();
      }

      // Draw name highlight
      if (nameOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = nameOpacity;
        
        const nameX = width / 2;
        const nameY = height / 2;
        const nameWidth = name.length * 40;
        const nameHeight = 100;
        
        // Highlight background
        ctx.fillStyle = highlightColor;
        ctx.fillRect(
          nameX - nameWidth / 2 - 50,
          nameY - nameHeight / 2 - 25,
          nameWidth + 100,
          nameHeight + 50
        );
        
        // Name text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.toUpperCase(), nameX, nameY);
        
        ctx.restore();
      }
    } catch (error) {
      console.error('Error in drawFrame:', error);
    }
  }, [name, theme, aspect, width, height, totalFrames, backgroundColor, textColor, highlightColor, searchColor, imageElement, imageLoaded]);

  const startRecording = useCallback(() => {
    console.log('startRecording called for search animation');
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    console.log('Starting search video generation with MediaRecorder...');
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
      console.log('MediaRecorder started for search animation.');

      let frame = 0;
      const animate = () => {
        if (frame >= totalFrames) {
          console.log('Search animation complete, stopping MediaRecorder.');
          mediaRecorder.stop();
          return;
        }

        drawFrame(frame);
        setCurrentFrame(frame);
        onProgress((frame / totalFrames) * 100);

        frame++;
        animationRef.current = requestAnimationFrame(animate);
      };

      console.log('Starting search animation loop for recording...');
      animationRef.current = requestAnimationFrame(animate);

    } catch (error) {
      console.error('Error in startRecording setup for search:', error);
      setHasStartedRecording(false);
    }
  }, [drawFrame, totalFrames, onVideoGenerated, onProgress, width, height, fps]);

  // Auto-start recording when isGenerating becomes true
  useEffect(() => {
    if (isGenerating && !hasStartedRecording && imageLoaded) {
      console.log('Auto-starting search video generation...');
      drawFrame(0);
      setTimeout(() => {
        try {
          startRecording();
        } catch (error) {
          console.error('Failed to start search video generation:', error);
          setHasStartedRecording(false);
        }
      }, 200);
    }
  }, [isGenerating, hasStartedRecording, drawFrame, imageLoaded, startRecording]);

  // Draw initial frame when image loads
  useEffect(() => {
    if (canvasRef.current && imageLoaded) {
      drawFrame(0);
    }
  }, [drawFrame, imageLoaded]);

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
          ref={canvasRef}
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
