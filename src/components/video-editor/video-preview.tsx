"use client";

import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  videoUrl: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onSeek: (time: number) => void;
  className?: string;
}

export function VideoPreview({
  videoUrl,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
  onSeek,
  className
}: VideoPreviewProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (playerRef.current && !seeking && videoReady && duration > 0) {
      const seekPosition = currentTime / duration;
      playerRef.current.seekTo(seekPosition);
    }
  }, [currentTime, duration, seeking, videoReady]);

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    if (!seeking) {
      onTimeUpdate(state.playedSeconds);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    onSeek(newTime);
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

  const handleReady = () => {
    setVideoReady(true);
  };

  const handleError = (error: any) => {
    console.error('Video playback error:', error);
  };

  if (!videoUrl) {
    return (
      <Card className={cn("aspect-video w-full border-dashed flex items-center justify-center bg-muted/50", className)}>
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
          <div className="h-16 w-16 mb-4 rounded-lg bg-muted flex items-center justify-center">
            <Play className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium">Upload a video to start editing</p>
          <p className="text-sm mt-2">Drag and drop video files or click upload in the media library</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-0">
        <div 
          className="relative aspect-video bg-black rounded-t-lg overflow-hidden video-preview-container"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <div className="w-full h-full">
            <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              width="100%"
              height="100%"
              playing={isPlaying}
              volume={muted ? 0 : Math.max(0, Math.min(1, volume))}
              onProgress={handleProgress}
              onReady={handleReady}
              onError={handleError}
              controls={false}
              muted={muted}
            />
          </div>
          
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
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipForward}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2 ml-auto">
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
                      value={[muted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
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
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground font-mono">{formatTime(currentTime)}</span>
            <div className="flex-1">
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
            </div>
            <span className="text-sm text-muted-foreground font-mono">{formatTime(duration)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 