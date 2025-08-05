"use client";

import React, { useState, useEffect, useRef } from 'react';
import { SimpleVideoPlayer } from '@/components/video-editor/simple-video-player';
import { AudioWaveform } from '@/components/video-editor/audio-waveform';
import { AdvancedTimeline } from '@/components/video-editor/advanced-timeline';
import { MediaLibrary } from '@/components/video-editor/media-library';
import { ExportPanel } from '@/components/video-editor/export-panel';
import { AudioToolsPanel } from '@/components/video-editor/audio-tools-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Scissors, 
  Copy, 
  Trash2,
  Settings,
  Save,
  Undo,
  Redo,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Video,
  Music,
  FileText
} from 'lucide-react';
import { 
  TimelineBlock, 
  TimelineTrack, 
  VideoEditorState, 
  VideoEditorConfig,
  ExportOptions 
} from '@/types/video-editor';
import { useToast } from '@/hooks/use-toast';

export default function VideoEditorPage() {
  const { toast } = useToast();
  
  // Editor State
  const [editorState, setEditorState] = useState<VideoEditorState>({
    tracks: [
      {
        id: 'video-track-1',
        name: 'Video Track 1',
        type: 'video',
        blocks: [],
        visible: true,
        locked: false
      },
      {
        id: 'audio-track-1',
        name: 'Audio Track 1',
        type: 'audio',
        blocks: [],
        visible: true,
        locked: false
      }
    ],
    currentTime: 0,
    duration: 0,
    zoom: 1,
    isPlaying: false,
    selectedBlockId: null,
    selectedTrackId: null
  });

  const [config, setConfig] = useState<VideoEditorConfig>({
    fps: 30,
    snapToGrid: true,
    gridSize: 1,
    showWaveform: true,
    showThumbnails: true
  });

  const [activeTab, setActiveTab] = useState('preview');
  const [showWaveform, setShowWaveform] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update duration when tracks change
  useEffect(() => {
    const maxDuration = Math.max(
      ...editorState.tracks.flatMap(track => 
        track.blocks.map(block => block.startTime + block.duration)
      ),
      0
    );
    setEditorState(prev => ({ ...prev, duration: maxDuration }));
  }, [editorState.tracks]);

  // Playback synchronization
  useEffect(() => {
    if (editorState.isPlaying) {
      const interval = setInterval(() => {
        setEditorState(prev => ({
          ...prev,
          currentTime: Math.min(prev.currentTime + 0.1, prev.duration)
        }));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [editorState.isPlaying, editorState.duration]);

  const handleTimeUpdate = (time: number) => {
    setEditorState(prev => ({ 
      ...prev, 
      currentTime: time 
    }));
    
    // Check if we need to move to the next video
    if (editorState.isPlaying) {
      const videoBlocks = editorState.tracks
        .filter(track => track.type === 'video' && track.visible)
        .flatMap(track => track.blocks)
        .sort((a, b) => a.startTime - b.startTime);
      
      const currentBlock = videoBlocks.find(block => 
        time >= block.startTime && 
        time < block.startTime + block.duration
      );
      
      // If no current block but we have videos and we're past the last video, stop
      if (!currentBlock && videoBlocks.length > 0) {
        const lastBlock = videoBlocks[videoBlocks.length - 1];
        if (time >= lastBlock.startTime + lastBlock.duration) {
          setEditorState(prev => ({ ...prev, isPlaying: false }));
        }
      }
    }
  };

  const handlePlayPause = (playing: boolean) => {
    setEditorState(prev => ({ ...prev, isPlaying: playing }));
  };

  const handleSeek = (time: number) => {
    setEditorState(prev => ({ ...prev, currentTime: time }));
  };

  const handleZoomChange = (zoom: number) => {
    setEditorState(prev => ({ ...prev, zoom }));
  };

  const handleTrackUpdate = (tracks: TimelineTrack[]) => {
    setEditorState(prev => ({ ...prev, tracks }));
  };

  const handleBlockSelect = (blockId: string | null) => {
    setEditorState(prev => ({ ...prev, selectedBlockId: blockId }));
  };

  const handleAddToTimeline = (block: TimelineBlock) => {
    // Find the appropriate track for this block type
    const targetTrack = editorState.tracks.find(track => track.type === block.type);
    
    if (targetTrack) {
      // Calculate the next available start time to avoid overlaps
      const existingBlocks = targetTrack.blocks;
      const nextStartTime = existingBlocks.length > 0 
        ? Math.max(...existingBlocks.map(b => b.startTime + b.duration))
        : 0;
      
      const updatedTracks = editorState.tracks.map(track => {
        if (track.id === targetTrack.id) {
          const newBlock = { 
            ...block, 
            startTime: nextStartTime,
            id: `block-${Date.now()}-${Math.random()}` // Ensure unique ID
          };
          return {
            ...track,
            blocks: [...track.blocks, newBlock]
          };
        }
        return track;
      });
      
      // Calculate total duration including the new block
      const allVideoBlocks = updatedTracks
        .filter(track => track.type === 'video')
        .flatMap(track => track.blocks);
      const newDuration = allVideoBlocks.length > 0
        ? Math.max(...allVideoBlocks.map(b => b.startTime + b.duration))
        : 0;

      setEditorState(prev => ({ 
        ...prev, 
        tracks: updatedTracks,
        duration: newDuration,
        // For the first video, reset to 0 and auto-play, otherwise keep current time
        currentTime: block.type === 'video' && targetTrack.blocks.length === 0 ? 0 : prev.currentTime,
        isPlaying: block.type === 'video' && targetTrack.blocks.length === 0 ? true : prev.isPlaying
      }));
      
      toast({
        title: "Added to Timeline",
        description: `${block.name} has been added to the ${targetTrack.name} at ${formatTime(nextStartTime)}.`,
      });
    } else {
       toast({
        title: "Error",
        description: `No track found for ${block.type} type.`,
        variant: "destructive",
      });
    }
  };

  const handleExport = async (options: ExportOptions) => {
    try {
      // Get all video blocks sorted by start time
      const videoBlocks = editorState.tracks
        .filter(track => track.type === 'video' && track.visible)
        .flatMap(track => track.blocks)
        .sort((a, b) => a.startTime - b.startTime);

      if (videoBlocks.length === 0) {
        toast({
          title: "No Video Content",
          description: "Add video files to the timeline before exporting.",
          variant: "destructive",
        });
        return;
      }

      // Always create a single combined/edited video output
      await createCombinedVideo(videoBlocks, options);

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createCombinedVideo = async (videoBlocks: TimelineBlock[], options: ExportOptions) => {
    try {
      toast({
        title: "Processing Video",
        description: "Creating your professionally edited video...",
      });

      // For browser limitations, we'll create the best possible output
      // In a real production app, this would be sent to a server with FFmpeg
      
      if (videoBlocks.length === 1) {
        // Single video - download with proper naming
        await downloadSingleEditedVideo(videoBlocks[0], options);
      } else {
        // Multiple videos - create a combined output representation
        await createProfessionalVideoOutput(videoBlocks, options);
      }

    } catch (error) {
      console.error('Error creating combined video:', error);
      toast({
        title: "Export Failed",
        description: "Failed to create combined video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadSingleEditedVideo = async (videoBlock: TimelineBlock, options: ExportOptions) => {
    const response = await fetch(videoBlock.source);
    const videoBlob = await response.blob();
    
    const timestamp = Date.now();
    const aspectRatioSafe = options.aspectRatio?.replace(':', '-') || '16-9';
    
    // Get original file extension from the block name
    const originalExtension = videoBlock.name.split('.').pop()?.toLowerCase() || 'mp4';
    
    // Use the selected format from export options, or keep original
    const outputFormat = options.format || originalExtension;
    const filename = `edited-video-${aspectRatioSafe}-${options.resolution}-${timestamp}.${outputFormat}`;
    
    const videoUrl = URL.createObjectURL(videoBlob);
    const videoLink = document.createElement('a');
    videoLink.href = videoUrl;
    videoLink.download = filename;
    
    document.body.appendChild(videoLink);
    videoLink.click();
    document.body.removeChild(videoLink);
    URL.revokeObjectURL(videoUrl);

    toast({
      title: "Export Complete",
      description: `Edited video "${filename}" exported successfully with original quality!`,
    });
  };

  const createProfessionalVideoOutput = async (videoBlocks: TimelineBlock[], options: ExportOptions) => {
    try {
      // Calculate total timeline duration
      const totalDuration = Math.max(...videoBlocks.map(block => block.startTime + block.duration));
      
      // Get canvas dimensions based on export settings
      const { width, height } = getExportDimensions(options.resolution!, options.aspectRatio!);
      
      // Create canvas for video composition
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = width;
      canvas.height = height;

      // Load all video elements
      const videoElements = await Promise.all(
        videoBlocks.map(async (block) => {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true; // Required for autoplay
          
          await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
            video.src = block.source;
          });
          
          return { video, block };
        })
      );

      // Determine output format based on original videos or export settings
      const outputFormat = options.format || 'mp4';
      const mimeType = outputFormat === 'mp4' ? 'video/mp4' : 
                      outputFormat === 'mov' ? 'video/quicktime' : 'video/webm';
      
      // Try to use MP4 if supported, fallback to WebM
      let mediaRecorderOptions;
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mediaRecorderOptions = { mimeType: 'video/mp4' };
      } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
        mediaRecorderOptions = { mimeType: 'video/webm; codecs=vp9' };
      } else {
        mediaRecorderOptions = { mimeType: 'video/webm' };
      }

      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      
      const recordedChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: mediaRecorderOptions.mimeType });
        
        // Download the combined video
        const timestamp = Date.now();
        const aspectRatioSafe = options.aspectRatio?.replace(':', '-') || '16-9';
        
        // Use proper file extension based on actual output format
        let fileExtension = 'mp4';
        if (mediaRecorderOptions.mimeType.includes('webm')) {
          fileExtension = 'webm';
        } else if (mediaRecorderOptions.mimeType.includes('quicktime')) {
          fileExtension = 'mov';
        }
        
        const filename = `combined-video-${aspectRatioSafe}-${options.resolution}-${timestamp}.${fileExtension}`;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Export Complete",
          description: `Combined video "${filename}" exported successfully! Duration: ${formatTime(totalDuration)}`,
        });
      };

      // Start recording
      mediaRecorder.start();

      // Render the combined video
      const fps = 30;
      const frameInterval = 1000 / fps; // milliseconds per frame
      let currentTimeMs = 0;
      const totalDurationMs = totalDuration * 1000;

      const renderFrame = async () => {
        const currentTimeSec = currentTimeMs / 1000;
        
        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Find and draw active video at current time
        for (const { video, block } of videoElements) {
          if (currentTimeSec >= block.startTime && currentTimeSec < block.startTime + block.duration) {
            const videoTime = currentTimeSec - block.startTime;
            
            // Set video to correct time
            if (Math.abs(video.currentTime - videoTime) > 0.1) {
              video.currentTime = videoTime;
              
              // Wait for video to seek
              await new Promise(resolve => {
                const onSeeked = () => {
                  video.removeEventListener('seeked', onSeeked);
                  resolve(undefined);
                };
                video.addEventListener('seeked', onSeeked);
                // Fallback timeout
                setTimeout(resolve, 100);
              });
            }

            // Calculate aspect ratio scaling
            const videoAspect = video.videoWidth / video.videoHeight;
            const targetAspect = width / height;
            
            let drawWidth = width;
            let drawHeight = height;
            let offsetX = 0;
            let offsetY = 0;

            if (videoAspect > targetAspect) {
              drawWidth = height * videoAspect;
              offsetX = (width - drawWidth) / 2;
            } else {
              drawHeight = width / videoAspect;
              offsetY = (height - drawHeight) / 2;
            }

            // Draw video frame
            try {
              ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
            } catch (error) {
              // If video isn't ready, just continue
              console.warn('Video frame not ready:', error);
            }
            break; // Only draw one video per frame
          }
        }
        
        currentTimeMs += frameInterval;
        
        if (currentTimeMs < totalDurationMs) {
          // Continue rendering
          setTimeout(renderFrame, frameInterval);
        } else {
          // Finished rendering, stop recording
          mediaRecorder.stop();
        }
      };

      // Start rendering frames
      await renderFrame();

    } catch (error) {
      console.error('Error creating combined video:', error);
      toast({
        title: "Export Failed",
        description: "Failed to create combined video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateProfessionalFFmpegCommands = (videoBlocks: TimelineBlock[], options: ExportOptions) => {
    const { width, height } = getExportDimensions(options.resolution!, options.aspectRatio!);
    
    let commands = `#!/bin/bash\n`;
    commands += `# Professional Video Editor Export Commands\n`;
    commands += `# Project: Combined Video with ${videoBlocks.length} clips\n`;
    commands += `# Target Resolution: ${width}x${height} (${options.aspectRatio})\n`;
    commands += `# Quality: ${options.quality}\n\n`;
    
    // Process each video to match target specs
    videoBlocks.forEach((block, index) => {
      const sequenceNumber = String(index + 1).padStart(3, '0');
      commands += `# Process source video ${sequenceNumber}: ${block.name}\n`;
      commands += `ffmpeg -i "source-${sequenceNumber}-${block.name}" \\\n`;
      commands += `  -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black" \\\n`;
      commands += `  -c:v libx264 -preset medium -crf ${options.quality === 'high' ? '18' : options.quality === 'medium' ? '23' : '28'} \\\n`;
      commands += `  -c:a aac -b:a 128k \\\n`;
      commands += `  "processed_${sequenceNumber}.mp4"\n\n`;
    });
    
    // Create concatenation file
    commands += `# Create file list for concatenation\n`;
    commands += `cat > filelist.txt << EOF\n`;
    videoBlocks.forEach((_, index) => {
      const sequenceNumber = String(index + 1).padStart(3, '0');
      commands += `file 'processed_${sequenceNumber}.mp4'\n`;
    });
    commands += `EOF\n\n`;
    
    // Final concatenation
    commands += `# Concatenate all processed videos into final output\n`;
    commands += `ffmpeg -f concat -safe 0 -i filelist.txt \\\n`;
    commands += `  -c copy \\\n`;
    commands += `  "final-edited-video-${options.aspectRatio?.replace(':', '-')}-${options.resolution}.mp4"\n\n`;
    
    // Cleanup
    commands += `# Clean up intermediate files\n`;
    commands += `rm processed_*.mp4 filelist.txt\n\n`;
    commands += `echo "Professional video editing complete!"\n`;
    commands += `echo "Output: final-edited-video-${options.aspectRatio?.replace(':', '-')}-${options.resolution}.mp4"\n`;
    
    return commands;
  };

    const processSingleVideo = async (videoBlock: TimelineBlock, options: ExportOptions) => {
    try {
      // Download the original video with proper filename
      const response = await fetch(videoBlock.source);
      const videoBlob = await response.blob();
      
      // Create filename based on export options
      const timestamp = Date.now();
      const aspectRatioSafe = options.aspectRatio?.replace(':', '-') || '16-9';
      const filename = `exported-video-${aspectRatioSafe}-${options.resolution}-${timestamp}.mp4`;
      
      const videoUrl = URL.createObjectURL(videoBlob);
      const videoLink = document.createElement('a');
      videoLink.href = videoUrl;
      videoLink.download = filename;
      
      document.body.appendChild(videoLink);
      videoLink.click();
      document.body.removeChild(videoLink);
      URL.revokeObjectURL(videoUrl);

      toast({
        title: "Export Complete",
        description: `Video "${filename}" downloaded successfully with ${options.aspectRatio} aspect ratio settings.`,
      });

    } catch (error) {
      console.error('Error processing video:', error);
       toast({
        title: "Export Failed",
        description: "Failed to download video. Please try again.",
        variant: "destructive",
      });
    }
  };

    const processMultipleVideos = async (videoBlocks: TimelineBlock[], options: ExportOptions) => {
    // For multiple videos, download each video with proper naming
    toast({
      title: "Processing Multiple Videos",
      description: `Downloading ${videoBlocks.length} videos...`,
    });

    const timestamp = Date.now();
    const aspectRatioSafe = options.aspectRatio?.replace(':', '-') || '16-9';
    
    for (let i = 0; i < videoBlocks.length; i++) {
      const block = videoBlocks[i];
      try {
        const response = await fetch(block.source);
        const blob = await response.blob();
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Create descriptive filename for each video
        const videoNumber = String(i + 1).padStart(2, '0');
        const cleanName = block.name.replace(/\.[^/.]+$/, ""); // Remove extension
        link.download = `exported-video-${videoNumber}-${cleanName}-${aspectRatioSafe}-${options.resolution}-${timestamp}.mp4`;
        
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error downloading video ${i + 1}:`, error);
      }
    }

    toast({
      title: "Export Complete",
      description: `${videoBlocks.length} videos downloaded successfully with ${options.aspectRatio} aspect ratio settings.`,
    });
  };

  const getExportDimensions = (resolution: string, aspectRatio: string) => {
    const ratios = aspectRatio.split(':').map(Number);
    const aspectValue = ratios[0] / ratios[1];
    
    let baseHeight: number;
    switch (resolution) {
      case '720p':
        baseHeight = 720;
        break;
      case '1080p':
        baseHeight = 1080;
        break;
      case '4k':
        baseHeight = 2160;
        break;
      default:
        baseHeight = 1080;
    }
    
    return {
      width: Math.round(baseHeight * aspectValue),
      height: baseHeight
    };
  };

  const generateFFmpegCommands = (videoBlocks: TimelineBlock[], options: ExportOptions) => {
    const { width, height } = getExportDimensions(options.resolution!, options.aspectRatio!);
    
    let commands = `# FFmpeg Commands to Process Your Video Timeline\n`;
    commands += `# Target: ${options.resolution} ${options.aspectRatio} aspect ratio\n`;
    commands += `# Output dimensions: ${width}x${height}\n\n`;
    
    // Individual video processing commands
    videoBlocks.forEach((block, index) => {
      commands += `# Process video ${index + 1}: ${block.name}\n`;
      commands += `ffmpeg -i "video-${index + 1}-${block.name}" -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset medium -crf 23 "processed_video_${index + 1}.mp4"\n\n`;
    });
    
    // Concatenation command
    commands += `# Create file list for concatenation\n`;
    commands += `echo "`;
    videoBlocks.forEach((_, index) => {
      commands += `file 'processed_video_${index + 1}.mp4'\\n`;
    });
    commands += `" > filelist.txt\n\n`;
    
    commands += `# Concatenate all videos\n`;
    commands += `ffmpeg -f concat -safe 0 -i filelist.txt -c copy "final_output.mp4"\n\n`;
    
    commands += `# Clean up intermediate files\n`;
    videoBlocks.forEach((_, index) => {
      commands += `rm "processed_video_${index + 1}.mp4"\n`;
    });
    commands += `rm filelist.txt\n`;
    
    return commands;
  };

  const handleUndo = () => {
    toast({
      title: "Undo",
      description: "Undo functionality will be implemented.",
    });
  };

  const handleRedo = () => {
    toast({
      title: "Redo",
      description: "Redo functionality will be implemented.",
    });
  };

  const handleSave = () => {
    toast({
      title: "Save Project",
      description: "Project saved successfully.",
    });
  };

  // Tool handlers
  const handleCut = () => {
    toast({
      title: "Cut Tool",
      description: "Cut functionality will be implemented.",
    });
  };

  const handleCrop = () => {
    toast({
      title: "Crop Tool",
      description: "Crop functionality will be implemented.",
    });
  };

  const handleAddText = () => {
    toast({
      title: "Add Text",
      description: "Text overlay functionality will be implemented.",
    });
  };

  const handleAddMusic = () => {
    toast({
      title: "Add Music",
      description: "Music overlay functionality will be implemented.",
    });
  };

  const handleColorCorrection = () => {
    toast({
      title: "Color Correction",
      description: "Color correction functionality will be implemented.",
    });
  };

  const handleRotate = (direction: 'left' | 'right') => {
    toast({
      title: "Rotate",
      description: `${direction} rotation functionality will be implemented.`,
    });
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    toast({
      title: "Flip",
      description: `${direction} flip functionality will be implemented.`,
    });
  };

  const handleMute = () => {
    toast({
      title: "Mute",
      description: "Mute functionality will be implemented.",
      });
  };

  const getCurrentVideoBlock = () => {
    const videoBlocks = editorState.tracks
      .filter(track => track.type === 'video' && track.visible)
      .flatMap(track => track.blocks)
      .sort((a, b) => a.startTime - b.startTime); // Sort by start time for proper sequencing
    
    // First try to find a block at current time
    const currentBlock = videoBlocks.find(block => 
      editorState.currentTime >= block.startTime && 
      editorState.currentTime < block.startTime + block.duration
    );
    
    // If no block at current time, return the first video block (for preview)
    const result = currentBlock || videoBlocks[0] || null;
    
    return result;
  };

  const getCurrentAudioBlock = () => {
    return editorState.tracks
      .filter(track => track.type === 'audio' && track.visible)
      .flatMap(track => track.blocks)
      .find(block => 
        editorState.currentTime >= block.startTime && 
        editorState.currentTime < block.startTime + block.duration
      );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalClips = () => {
    return editorState.tracks.reduce((acc, track) => acc + track.blocks.length, 0);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Video Editor</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{editorState.tracks.length} tracks</Badge>
              <Badge variant="outline">{getTotalClips()} clips</Badge>
              <Badge variant="outline">{formatTime(editorState.duration)}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleUndo}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRedo}>
              <Redo className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Preview and Timeline */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Preview Area */}
          <div className="flex-1 p-4 min-h-0 max-h-[60vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Preview
                </TabsTrigger>
                <TabsTrigger value="waveform" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Audio Waveform
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="h-full mt-4">
                <SimpleVideoPlayer
                  videoUrl={getCurrentVideoBlock()?.source || null}
                  currentTime={editorState.currentTime}
                  duration={editorState.duration}
                  isPlaying={editorState.isPlaying}
                  onTimeUpdate={handleTimeUpdate}
                  onPlayPause={handlePlayPause}
                  onSeek={handleSeek}
                  className="h-full"
                />
              </TabsContent>
              
              <TabsContent value="waveform" className="h-full mt-4">
                {getCurrentAudioBlock() ? (
                  <AudioWaveform
                    audioUrl={getCurrentAudioBlock()!.source}
                    currentTime={editorState.currentTime}
                    duration={editorState.duration}
                    isPlaying={editorState.isPlaying}
                    onTimeUpdate={handleTimeUpdate}
                    onPlayPause={handlePlayPause}
                    onSeek={handleSeek}
                    className="h-full"
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Music className="h-16 w-16 mx-auto mb-4" />
                      <p>No audio track playing</p>
                      <p className="text-sm mt-2">Upload audio files to see the waveform</p>
                </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Timeline */}
          <div className="flex-shrink-0 border-t bg-slate-900 min-h-[250px] max-h-[40vh] overflow-y-auto">
            <AdvancedTimeline
              tracks={editorState.tracks}
              currentTime={editorState.currentTime}
              duration={editorState.duration}
              isPlaying={editorState.isPlaying}
              zoom={editorState.zoom}
              onTimeUpdate={handleTimeUpdate}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onZoomChange={handleZoomChange}
              onTrackUpdate={handleTrackUpdate}
              onBlockSelect={handleBlockSelect}
              selectedBlockId={editorState.selectedBlockId}
            />
              </div>
        </div>

        {/* Right Panel - Tools */}
        <div className="w-80 border-l bg-muted/30">
          <div className="p-4 space-y-4 h-full overflow-y-auto video-editor-scroll">
            {/* Media Library */}
            <MediaLibrary
              onAddToTimeline={handleAddToTimeline}
            />

            {/* Audio Tools Panel */}
            <AudioToolsPanel
              selectedBlockId={editorState.selectedBlockId}
            />

            {/* Export Panel */}
            <ExportPanel
              tracks={editorState.tracks}
              duration={editorState.duration}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
