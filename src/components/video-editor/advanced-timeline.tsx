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
  RotateCcw,
  RotateCw,
  Video
} from 'lucide-react';
import { TimelineBlock, TimelineTrack } from '@/types/video-editor';
import { cn } from '@/lib/utils';

interface AdvancedTimelineProps {
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

export function AdvancedTimeline({
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
}: AdvancedTimelineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ blockId: string; side: 'left' | 'right'; startX: number; startTime: number; startDuration: number } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  const timelineDuration = Math.max(duration, 30); // Minimum 30 seconds for better visibility
  const pixelsPerSecond = zoom * 50; // Much more granular

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging || resizing) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timelineWidth = rect.width;
    const newTime = (clickX / timelineWidth) * timelineDuration;
    
    onSeek(Math.max(0, Math.min(newTime, timelineDuration)));
  };

  const getBlockStyle = (block: TimelineBlock) => {
    const startPercent = (block.startTime / timelineDuration) * 100;
    const widthPercent = (block.duration / timelineDuration) * 100;
    
    return {
      left: `${Math.max(0, startPercent)}%`,
      width: `${Math.max(0.5, widthPercent)}%`,
    };
  };

  const getCurrentTimePosition = () => {
    return Math.max(0, Math.min(100, (currentTime / timelineDuration) * 100));
  };

  const handleBlockMouseDown = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX;
    const isNearLeftEdge = (e.clientX - rect.left) < 10;
    const isNearRightEdge = (rect.right - e.clientX) < 10;
    
    const block = tracks.flatMap(t => t.blocks).find(b => b.id === blockId);
    if (!block) return;

    if (isNearLeftEdge || isNearRightEdge) {
      // Start resizing
      setResizing({
        blockId,
        side: isNearLeftEdge ? 'left' : 'right',
        startX: clickX,
        startTime: block.startTime,
        startDuration: block.duration
      });
    } else {
      // Start dragging
      setIsDragging(true);
      setDraggedBlock(blockId);
      setDragStartX(clickX);
      setDragStartTime(block.startTime);
    }
    
    onBlockSelect(blockId);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const timelineWidth = rect.width;
    const deltaX = e.clientX - (resizing?.startX || dragStartX);
    const deltaTime = (deltaX / timelineWidth) * timelineDuration;

    if (resizing) {
      const block = tracks.flatMap(t => t.blocks).find(b => b.id === resizing.blockId);
      if (!block) return;

      const updatedTracks = tracks.map(track => ({
        ...track,
        blocks: track.blocks.map(b => {
          if (b.id === resizing.blockId) {
            if (resizing.side === 'left') {
              const newStartTime = Math.max(0, resizing.startTime + deltaTime);
              const newDuration = Math.max(0.1, resizing.startDuration - deltaTime);
              return { ...b, startTime: newStartTime, duration: newDuration };
            } else {
              const newDuration = Math.max(0.1, resizing.startDuration + deltaTime);
              return { ...b, duration: newDuration };
            }
          }
          return b;
        })
      }));
      onTrackUpdate(updatedTracks);
    } else if (isDragging && draggedBlock) {
      const newTime = Math.max(0, dragStartTime + deltaTime);
      
      const updatedTracks = tracks.map(track => ({
        ...track,
        blocks: track.blocks.map(block => 
          block.id === draggedBlock 
            ? { ...block, startTime: newTime }
            : block
        )
      }));
      onTrackUpdate(updatedTracks);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedBlock(null);
    setResizing(null);
  };

  useEffect(() => {
    if (isDragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, resizing, dragStartTime, dragStartX]);

  const renderTimeMarkers = () => {
    const markers = [];
    const stepSize = 1; // 1 second intervals
    
    for (let i = 0; i <= timelineDuration; i += stepSize) {
      const position = (i / timelineDuration) * 100;
      markers.push(
        <div
          key={i}
          className="absolute top-0 bottom-0 flex flex-col"
          style={{ left: `${position}%` }}
        >
          <div className="w-px h-2 bg-gray-400"></div>
          <span className="text-xs text-gray-400 mt-1 -translate-x-1/2">
            {formatTime(i)}
          </span>
        </div>
      );
    }
    
    return markers;
  };

  const renderVideoBlock = (block: TimelineBlock, trackType: string) => {
    const isSelected = selectedBlockId === block.id;
    
    return (
      <div
        key={block.id}
        className={cn(
          "absolute h-full rounded-sm cursor-pointer transition-all duration-200 select-none",
          "border-2 hover:border-blue-400",
          isSelected ? "border-blue-500 shadow-lg shadow-blue-500/30" : "border-gray-600",
          isDragging && draggedBlock === block.id ? "opacity-70 z-50" : "",
          trackType === 'video' ? "bg-gray-700" : "bg-green-700"
        )}
        style={getBlockStyle(block)}
        onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
      >
        {/* Video Thumbnails Strip with Embedded Audio */}
        {trackType === 'video' && block.thumbnail && (
          <div className="h-full w-full flex flex-col overflow-hidden rounded-sm">
            {/* Video thumbnails taking up top 70% */}
            <div className="flex h-3/4 overflow-hidden">
              {Array.from({ length: Math.max(1, Math.ceil(block.duration)) }).map((_, i) => (
                <img
                  key={i}
                  src={block.thumbnail}
                  alt=""
                  className="h-full w-auto object-cover flex-shrink-0"
                  style={{ minWidth: '30px' }}
                />
              ))}
            </div>
            
            {/* Embedded Audio Waveform at bottom 30% */}
            <div className="h-1/4 bg-blue-900/40 px-1 flex items-center">
              <div className="w-full h-4 bg-blue-400/30 rounded-sm relative overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-60 rounded-sm"></div>
                {/* Animated waveform bars */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {Array.from({ length: Math.floor(block.duration * 10) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-blue-300 mx-px rounded"
                      style={{ 
                        height: `${Math.random() * 70 + 30}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Standalone Audio Waveform */}
        {trackType === 'audio' && (
          <div className="h-full w-full flex items-center px-2 bg-green-800">
            <div className="w-full h-10 bg-green-400/30 rounded relative overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-green-400 to-green-600 opacity-70 rounded"></div>
              {/* Professional waveform visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                {Array.from({ length: Math.floor(block.duration * 15) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-green-300 mx-px rounded animate-pulse"
                    style={{ 
                      height: `${Math.random() * 80 + 20}%`,
                      animationDelay: `${i * 0.05}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Text Block */}
        {trackType === 'text' && (
          <div className="h-full flex items-center justify-center text-white text-xs px-2">
            <span className="truncate">{block.name}</span>
          </div>
        )}

        {/* Resize Handles */}
        {isSelected && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-500 opacity-80 hover:opacity-100"></div>
            <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-500 opacity-80 hover:opacity-100"></div>
          </>
        )}
        
        {/* Block Name Overlay */}
        <div className="absolute top-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
          {block.name}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full bg-slate-900 text-white", className)}>
      {/* Control Bar */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-600">
        <div className="flex items-center gap-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeek(Math.max(0, currentTime - 5))}
              className="h-8 w-8 p-0 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={() => onPlayPause(!isPlaying)}
              className="h-10 w-10 p-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeek(Math.min(duration, currentTime + 5))}
              className="h-8 w-8 p-0 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeek(0)}
              className="h-8 w-8 p-0 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Time Display */}
          <div className="text-sm font-mono text-slate-200 bg-slate-700 px-3 py-1 rounded-md shadow-inner">
            <span className="text-emerald-400">{formatTime(currentTime)}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-slate-300">{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">Zoom:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onZoomChange(Math.max(zoom / 1.2, 0.1))}
            className="h-8 w-8 p-0 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Slider
            value={[zoom * 100]}
            onValueChange={(value) => onZoomChange(value[0] / 100)}
            max={500}
            min={10}
            step={10}
            className="w-32"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onZoomChange(Math.min(zoom * 1.2, 5))}
            className="h-8 w-8 p-0 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-slate-300 hover:bg-slate-700 hover:text-white bg-slate-800"
          >
            <Scissors className="h-4 w-4 mr-1" />
            Split
          </Button>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="relative bg-slate-800">
        {/* Time Ruler */}
        <div className="relative h-8 bg-slate-700 border-b border-slate-600">
          <div className="relative h-full w-full overflow-hidden">
            {renderTimeMarkers()}
          </div>
        </div>

        {/* Timeline Tracks */}
        <div
          ref={timelineRef}
          className="relative bg-slate-800 cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Video Tracks with Embedded Audio */}
          {tracks.filter(track => track.type === 'video').map((track, index) => (
            <div key={track.id} className="relative h-20 bg-slate-700/70 border-b border-slate-600 hover:bg-slate-700 transition-colors">
              <div className="absolute left-2 top-1 text-xs text-slate-300 font-medium z-10 bg-slate-800/80 px-2 py-0.5 rounded-md">
                Video {index + 1}
              </div>
              {track.blocks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-dashed border-slate-500 rounded-md flex items-center justify-center">
                      <Video className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>Drop video here</span>
                  </div>
                </div>
              ) : (
                track.blocks.map(block => renderVideoBlock(block, 'video'))
              )}
            </div>
          ))}
          
          {/* Separate Audio Tracks */}
          {tracks.filter(track => track.type === 'audio').map((track, index) => (
            <div key={track.id} className="relative h-16 bg-emerald-900/20 border-b border-emerald-700/30 hover:bg-emerald-900/30 transition-colors">
              <div className="absolute left-2 top-1 text-xs text-emerald-300 font-medium z-10 bg-emerald-800/80 px-2 py-0.5 rounded-md">
                Audio {index + 1}
              </div>
              {track.blocks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-emerald-400/70 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-dashed border-emerald-500/50 rounded-md flex items-center justify-center">
                      <Volume2 className="h-4 w-4 text-emerald-500/50" />
                    </div>
                    <span>Drop audio here</span>
                  </div>
                </div>
              ) : (
                track.blocks.map(block => renderVideoBlock(block, 'audio'))
              )}
            </div>
          ))}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-50 pointer-events-none shadow-lg"
            style={{ left: `${getCurrentTimePosition()}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-emerald-400 transform rotate-45 shadow-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
}