"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Scissors,
  Copy,
  Trash2,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Grid3X3,
  Clock,
  SkipBack,
  SkipForward,
  Square
} from 'lucide-react';
import { TimelineBlock, TimelineTrack } from '@/types/video-editor';
import { cn } from '@/lib/utils';

interface CustomTimelineProps {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  zoom: number;
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onSeek: (time: number) => void;
  onZoomChange: (zoom: number) => void;
  onTrackUpdate: (tracks: TimelineTrack[]) => void;
  onBlockSelect: (blockId: string | null) => void;
  selectedBlockId: string | null;
  className?: string;
}

export function CustomTimeline({
  tracks,
  currentTime,
  duration,
  isPlaying,
  zoom,
  onTimeUpdate,
  onPlayPause,
  onSeek,
  onZoomChange,
  onTrackUpdate,
  onBlockSelect,
  selectedBlockId,
  className
}: CustomTimelineProps) {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom * 1.2, 5));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom / 1.2, 0.1));
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 5);
    onSeek(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 5);
    onSeek(newTime);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 128; // Account for track headers
    const timelineWidth = rect.width - 128;
    const timelineDuration = Math.max(duration, 10);
    const newTime = Math.max(0, Math.min(timelineDuration, (x / timelineWidth) * timelineDuration));
    onSeek(newTime);
  };

  const handleBlockMouseDown = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    setDraggedBlock(blockId);
    setDragOffset({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedBlock || !timelineRef.current || !isDragging) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 128;
    const timelineWidth = rect.width - 128;
    const timelineDuration = Math.max(duration, 10);
    const newTime = Math.max(0, Math.min(timelineDuration, (x / timelineWidth) * timelineDuration));
    
    // Update the block's start time
    const updatedTracks = tracks.map(track => ({
      ...track,
      blocks: track.blocks.map(block => 
        block.id === draggedBlock 
          ? { ...block, startTime: snapToGrid ? Math.round(newTime) : newTime }
          : block
      )
    }));
    
    onTrackUpdate(updatedTracks);
  };

  const handleMouseUp = () => {
    setDraggedBlock(null);
    setIsDragging(false);
  };

  const getBlockStyle = (block: TimelineBlock) => {
    // Ensure minimum duration for timeline display
    const timelineDuration = Math.max(duration, 10); // Minimum 10 seconds
    const left = (block.startTime / timelineDuration) * 100;
    const width = (block.duration / timelineDuration) * 100;
    
    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const getCurrentTimePosition = () => {
    const timelineDuration = Math.max(duration, 10); // Minimum 10 seconds
    return (currentTime / timelineDuration) * 100;
  };

  const handleBlockDelete = (blockId: string) => {
    const updatedTracks = tracks.map(track => ({
      ...track,
      blocks: track.blocks.filter(block => block.id !== blockId)
    }));
    onTrackUpdate(updatedTracks);
    if (selectedBlockId === blockId) {
      onBlockSelect(null);
    }
  };

  const handleTrackVisibilityToggle = (trackId: string) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, visible: !track.visible } : track
    );
    onTrackUpdate(updatedTracks);
  };

  const handleTrackLockToggle = (trackId: string) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, locked: !track.locked } : track
    );
    onTrackUpdate(updatedTracks);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        {/* Timeline Controls */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPlayPause(!isPlaying)}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipBackward}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipForward}
              className="h-8 w-8 p-0"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className="w-24">
                <Slider
                  value={[zoom * 100]}
                  onValueChange={(value) => onZoomChange(value[0] / 100)}
                  min={10}
                  max={500}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant={snapToGrid ? "default" : "ghost"}
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Snap
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Timeline */}
        <div 
          ref={timelineRef}
          className="relative h-64 border rounded-lg overflow-hidden bg-muted/20 video-editor-timeline"
          onClick={handleTimelineClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Time Ruler */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-muted/50 border-b flex items-center px-2 text-xs">
            <div className="w-32 flex-shrink-0"></div>
            <div className="flex-1 flex justify-between relative">
              {Array.from({ length: Math.ceil(Math.max(duration, 10)) + 1 }, (_, i) => (
                <span 
                  key={i} 
                  className="text-muted-foreground font-mono"
                  style={{ left: `${(i / Math.max(duration, 10)) * 100}%` }}
                >
                  {formatTime(i)}
                </span>
              ))}
            </div>
          </div>
          
          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 timeline-playhead"
            style={{ left: `${getCurrentTimePosition()}%` }}
          />
          
          {/* Tracks */}
          <div className="mt-8 space-y-1">
            {tracks.map((track, trackIndex) => (
              <div key={track.id} className="relative h-16 border-b border-border/50">
                {/* Track Header */}
                <div className="absolute left-0 top-0 w-32 h-full bg-muted/30 border-r flex items-center px-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTrackVisibilityToggle(track.id)}
                      className="h-6 w-6 p-0"
                      disabled={track.locked}
                    >
                      {track.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTrackLockToggle(track.id)}
                      className="h-6 w-6 p-0"
                    >
                      {track.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </Button>
                    
                    <span className="text-xs font-medium truncate">{track.name}</span>
                  </div>
                </div>
                
                {/* Track Content */}
                <div className="ml-32 h-full relative">
                  {track.blocks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      <span>Drop {track.type} here</span>
                    </div>
                  ) : (
                    track.blocks.map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "absolute top-1 bottom-1 rounded border cursor-pointer transition-all duration-200 timeline-block",
                          selectedBlockId === block.id 
                            ? "border-primary bg-primary/20 shadow-lg" 
                            : "border-border bg-background hover:border-primary/50 hover:shadow-md",
                          isDragging && draggedBlock === block.id && "opacity-50"
                        )}
                        style={getBlockStyle(block)}
                        onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockSelect(block.id);
                        }}
                      >
                      <div className="h-full flex items-center justify-center text-xs p-1 relative group">
                        <div className="truncate text-center">
                          {block.thumbnail ? (
                            <img 
                              src={block.thumbnail} 
                              alt={block.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              {block.type === 'video' && <span>🎥</span>}
                              {block.type === 'audio' && <span>🎵</span>}
                              {block.type === 'text' && <span>📝</span>}
                              <span className="truncate">{block.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Block Actions */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockDelete(block.id);
                              }}
                              className="h-5 w-5 p-0 bg-black/50 text-white hover:bg-black/70"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Track Summary */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{tracks.length} tracks</span>
            <span>•</span>
            <span>{tracks.reduce((acc, track) => acc + track.blocks.length, 0)} clips</span>
            <span>•</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            {snapToGrid && (
              <Badge variant="outline" className="text-xs">
                <Grid3X3 className="h-3 w-3 mr-1" />
                Snap to Grid
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 