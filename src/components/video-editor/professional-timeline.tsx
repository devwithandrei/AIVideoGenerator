"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack,
  SkipForward,
  Square,
  ZoomIn, 
  ZoomOut, 
  Scissors,
  Volume2,
  VolumeX,
  Trash2
} from 'lucide-react';
import { TimelineBlock, TimelineTrack } from '@/types/video-editor';
import { cn } from '@/lib/utils';

interface ProfessionalTimelineProps {
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

export function ProfessionalTimeline({
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
}: ProfessionalTimelineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ blockId: string; side: 'left' | 'right' } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const timelineDuration = Math.max(duration, 10);
  const pixelsPerSecond = zoom * 20; // More pixels for better granularity

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / (timelineDuration * pixelsPerSecond)) * timelineDuration;
    
    onSeek(Math.max(0, Math.min(newTime, timelineDuration)));
  };

  const getBlockStyle = (block: TimelineBlock) => {
    const left = Math.max(0, Math.min(100, (block.startTime / timelineDuration) * 100));
    const width = Math.max(0, Math.min(100, (block.duration / timelineDuration) * 100));
    
    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const getCurrentTimePosition = () => {
    return Math.max(0, Math.min(100, (currentTime / timelineDuration) * 100));
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

  const renderTimeRuler = () => {
    const timeMarks = [];
    const stepSize = 1; // 1 second intervals
    
    for (let i = 0; i <= timelineDuration; i += stepSize) {
      const position = (i / timelineDuration) * 100;
      timeMarks.push(
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l border-gray-600"
          style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
        >
          <span className="absolute -top-6 left-1 text-xs text-gray-400 font-mono">
            {formatTime(i)}
          </span>
        </div>
      );
    }
    
    return timeMarks;
  };

  return (
    <div className={cn("w-full bg-gray-900 text-white", className)}>
      {/* Professional Controls Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeek(Math.max(0, currentTime - 5))}
              className="h-8 w-8 p-0 text-white hover:bg-gray-700"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={() => onPlayPause(!isPlaying)}
              className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeek(Math.min(duration, currentTime + 5))}
              className="h-8 w-8 p-0 text-white hover:bg-gray-700"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeek(0)}
              className="h-8 w-8 p-0 text-white hover:bg-gray-700"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Time Display */}
          <div className="text-sm font-mono text-gray-300 bg-gray-700 px-3 py-1 rounded">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        {/* Zoom and Tools */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Zoom:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange(Math.max(zoom / 1.2, 0.1))}
              className="h-8 w-8 p-0 text-white hover:bg-gray-700"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <div className="w-32">
              <Slider
                value={[zoom * 100]}
                onValueChange={(value) => onZoomChange(value[0] / 100)}
                max={500}
                min={10}
                step={10}
                className="timeline-zoom-slider"
              />
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange(Math.min(zoom * 1.2, 5))}
              className="h-8 w-8 p-0 text-white hover:bg-gray-700"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-white hover:bg-gray-700"
          >
            <Scissors className="h-4 w-4 mr-1" />
            Split
          </Button>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="relative">
        {/* Time Ruler */}
        <div className="relative h-8 bg-gray-800 border-b border-gray-700 overflow-hidden">
          <div
            ref={timelineRef}
            className="relative h-full cursor-pointer"
            style={{ width: `${Math.max(100, timelineDuration * pixelsPerSecond)}px` }}
            onClick={handleTimelineClick}
          >
            {renderTimeRuler()}
            
            {/* Current Time Indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
              style={{ left: `${Math.max(0, Math.min(100, getCurrentTimePosition()))}%` }}
            >
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rotate-45"></div>
            </div>
          </div>
        </div>

        {/* Video and Audio Tracks */}
        <div className="bg-gray-850">
          {tracks.map((track, index) => (
            <div key={track.id} className="border-b border-gray-700">
              {/* Track Header */}
              <div className="flex">
                <div className="w-32 bg-gray-800 p-3 border-r border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {track.type === 'video' && <div className="w-3 h-3 bg-blue-500 rounded"></div>}
                    {track.type === 'audio' && <div className="w-3 h-3 bg-green-500 rounded"></div>}
                    <span className="text-sm font-medium text-white">{track.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      {track.visible ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {/* Track Content */}
                <div 
                  className="flex-1 relative bg-gray-900"
                  style={{ height: track.type === 'video' ? '80px' : '60px' }}
                >
                  <div
                    className="relative h-full overflow-hidden"
                    style={{ width: `${Math.max(100, timelineDuration * pixelsPerSecond)}px` }}
                  >
                    {track.blocks.map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "absolute top-1 bottom-1 rounded cursor-pointer transition-all duration-200",
                          "border-2 hover:border-blue-400",
                          selectedBlockId === block.id 
                            ? "border-blue-500 shadow-lg shadow-blue-500/30" 
                            : "border-gray-600",
                          track.type === 'video' ? "bg-blue-600" : "bg-green-600"
                        )}
                        style={getBlockStyle(block)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockSelect(block.id);
                        }}
                      >
                        {/* Block Content */}
                        <div className="h-full flex items-center justify-center relative overflow-hidden">
                          {track.type === 'video' && block.thumbnail ? (
                            <img 
                              src={block.thumbnail} 
                              alt={block.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center gap-1 text-white text-xs px-2">
                              <span className="truncate">{block.name}</span>
                            </div>
                          )}
                          
                          {/* Audio Waveform */}
                          {track.type === 'audio' && (
                            <div className="absolute bottom-0 left-0 right-0 h-6 bg-green-400/30">
                              <div className="h-full bg-gradient-to-r from-green-400 to-green-600 opacity-70"></div>
                            </div>
                          )}
                        </div>

                        {/* Block Actions */}
                        {selectedBlockId === block.id && (
                          <div className="absolute top-1 right-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockDelete(block.id);
                              }}
                              className="h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {/* Resize Handles */}
                        <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-400 opacity-0 hover:opacity-100 transition-opacity"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-400 opacity-0 hover:opacity-100 transition-opacity"></div>
                      </div>
                    ))}

                    {/* Drop Zone */}
                    {track.blocks.length === 0 && (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        Drop {track.type} here
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Summary */}
      <div className="p-3 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>{tracks.length} tracks</span>
          <span>•</span>
          <span>{tracks.reduce((acc, track) => acc + track.blocks.length, 0)} clips</span>
          <span>•</span>
          <span>Duration: {formatTime(duration)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
}