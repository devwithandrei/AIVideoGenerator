"use client";

import React, { useState, useEffect, useRef } from 'react';
import { TimelineEditor } from '@xzdarcy/react-timeline-editor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  VolumeX
} from 'lucide-react';
import { TimelineBlock, TimelineTrack, VideoEditorState } from '@/types/video-editor';
import { cn } from '@/lib/utils';

interface TimelineEditorProps {
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

export function TimelineEditorComponent({
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
}: TimelineEditorProps) {
  const [timelineData, setTimelineData] = useState<any>({
    tracks: tracks.map(track => ({
      id: track.id,
      name: track.name,
      type: track.type,
      blocks: track.blocks.map(block => ({
        id: block.id,
        name: block.name,
        startTime: block.startTime,
        duration: block.duration,
        source: block.source,
        type: block.type,
        thumbnail: block.thumbnail,
        waveform: block.waveform,
        metadata: block.metadata
      }))
    }))
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineChange = (data: any) => {
    setTimelineData(data);
    
    // Convert back to our track format
    const updatedTracks: TimelineTrack[] = data.tracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      type: track.type,
      blocks: track.blocks.map((block: any) => ({
        id: block.id,
        name: block.name,
        startTime: block.startTime,
        duration: block.duration,
        source: block.source,
        type: block.type,
        thumbnail: block.thumbnail,
        waveform: block.waveform,
        metadata: block.metadata
      })),
      visible: true,
      locked: false
    }));
    
    onTrackUpdate(updatedTracks);
  };

  const handleBlockSelect = (blockId: string | null) => {
    onBlockSelect(blockId);
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

  const handleCut = () => {
    // Implement cut functionality
    console.log('Cut at current time:', currentTime);
  };

  const handleCopy = () => {
    // Implement copy functionality
    console.log('Copy selected block:', selectedBlockId);
  };

  const handleDelete = () => {
    // Implement delete functionality
    console.log('Delete selected block:', selectedBlockId);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        {/* Timeline Controls */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPlayPause(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipBackward}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipForward}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCut}
              disabled={!selectedBlockId}
            >
              <Scissors className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!selectedBlockId}
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={!selectedBlockId}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <div className="w-20">
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
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        {/* Timeline Editor */}
        <div className="h-64 border rounded-lg overflow-hidden">
          <TimelineEditor
            data={timelineData}
            onChange={handleTimelineChange}
            onBlockSelect={handleBlockSelect}
            selectedBlockId={selectedBlockId}
            currentTime={currentTime}
            duration={duration}
            zoom={zoom}
            style={{
              height: '100%',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))'
            }}
          />
        </div>
        
        {/* Time Ruler */}
        <div className="mt-2 h-6 bg-muted rounded flex items-center px-2">
          <div className="text-xs text-muted-foreground">
            {formatTime(0)} - {formatTime(duration)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 