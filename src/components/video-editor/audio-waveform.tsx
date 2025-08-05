"use client";

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onSeek: (time: number) => void;
  className?: string;
}

export function AudioWaveform({
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
  onSeek,
  className
}: AudioWaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!waveformRef.current || wavesurferRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4f46e5',
      progressColor: '#7c3aed',
      cursorColor: '#ffffff',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 1,
      height: 60,
      barGap: 1,
      responsive: true,
    });

    wavesurfer.load(audioUrl);
    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      console.log('WaveSurfer is ready');
    });

    wavesurfer.on('audioprocess', (currentTime) => {
      onTimeUpdate(currentTime);
    });

    wavesurfer.on('seek', (progress) => {
      const time = progress * duration;
      onSeek(time);
    });

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, duration, onTimeUpdate, onSeek]);

  useEffect(() => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.play();
      } else {
        wavesurferRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (wavesurferRef.current && duration > 0) {
      const progress = currentTime / duration;
      wavesurferRef.current.seekTo(progress);
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(muted ? 0 : volume);
    }
  }, [volume, muted]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPlayPause(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <div className="w-20">
              <input
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : volume * 100}
                onChange={(e) => handleVolumeChange([parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="ml-auto text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        <div ref={waveformRef} className="w-full" />
      </CardContent>
    </Card>
  );
} 