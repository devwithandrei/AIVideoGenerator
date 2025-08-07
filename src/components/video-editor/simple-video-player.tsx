"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleVideoPlayerProps {
  videoUrl: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onSeek: (time: number) => void;
  className?: string;
}

export function SimpleVideoPlayer({
  videoUrl,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
  onSeek,
  className
}: SimpleVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (videoRef.current && !seeking && videoReady && duration > 0) {
      const video = videoRef.current;
      const targetTime = currentTime;
      
      if (Math.abs(video.currentTime - targetTime) > 0.5) {
        video.currentTime = targetTime;
      }
    }
  }, [currentTime, duration, seeking, videoReady]);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (isPlaying) {
        video.play().catch(() => {
          // Handle play promise rejection silently
        });
      } else {
        video.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = muted ? 0 : volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted]);

  const handleProgress = () => {
    if (videoRef.current && !seeking) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedData = () => {
    setVideoReady(true);
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      if (videoDuration && !isNaN(videoDuration)) {
        // Duration is handled by parent component
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      setSeeking(true);
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      onSeek(newTime);
      setTimeout(() => setSeeking(false), 100);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (newVolume === 0) {
      setMuted(true);
    } else if (muted) {
      setMuted(false);
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const skipBackward = () => {
    const newTime = Math.max(0, currentTime - 5);
    onSeek(newTime);
  };

  const skipForward = () => {
    const newTime = Math.min(duration, currentTime + 5);
    onSeek(newTime);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!videoUrl) {
    return (
      <div className={cn("aspect-video w-full border-dashed border-2 border-slate-600 flex items-center justify-center bg-slate-800/50 rounded-lg", className)}>
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
          <div className="h-16 w-16 mb-4 rounded-lg bg-slate-700 flex items-center justify-center">
            <Play className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium">Upload a video to start editing</p>
          <p className="text-sm mt-2">Drag and drop video files or click upload in the media library</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="bg-black rounded-lg overflow-hidden">
        <div 
          className="relative aspect-video bg-black"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleProgress}
            onLoadedData={handleLoadedData}
            onError={(e) => console.error('Video error:', e)}
            playsInline
            preload="metadata"
          />
          
          {/* Video Controls Overlay */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-200">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPlayPause(!isPlaying)}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBackward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipForward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  <Slider
                    value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                    onValueChange={handleSeek}
                    max={100}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={[volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}