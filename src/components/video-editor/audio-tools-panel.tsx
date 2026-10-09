"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Volume2, 
  VolumeX,
  Scissors,
  Settings,
  Sliders,
  Clock,
  Zap,
  RotateCcw,
  Music,
  Mic
} from 'lucide-react';

interface AudioToolsPanelProps {
  selectedBlockId: string | null;
  className?: string;
}

export function AudioToolsPanel({ selectedBlockId, className }: AudioToolsPanelProps) {
  const [volume, setVolume] = useState(100);
  const [speed, setSpeed] = useState(100);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [trim, setTrim] = useState({ start: 0, end: 5 });
  const [enableVocalRemover, setEnableVocalRemover] = useState(false);
  const [enableNoiseReduction, setEnableNoiseReduction] = useState(false);
  const [enableReverseAudio, setEnableReverseAudio] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Audio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Volume Control */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <Label className="text-sm font-medium">Volume</Label>
          </div>
          <div className="space-y-2">
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={200}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {volume}%
            </div>
          </div>
        </div>

        <Separator />

        {/* Trim Control */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            <Label className="text-sm font-medium">Trim</Label>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-lg font-mono text-primary">
              {formatTime(trim.end - trim.start)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Duration
            </div>
          </div>
        </div>

        <Separator />

        {/* Fade In/Out */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            <Label className="text-sm font-medium">Fade In/Out</Label>
          </div>
          
          {/* Fade In */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Fade In</Label>
            <Slider
              value={[fadeIn]}
              onValueChange={(value) => setFadeIn(value[0])}
              max={5}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {fadeIn.toFixed(1)}s
            </div>
          </div>
          
          {/* Fade Out */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Fade Out</Label>
            <Slider
              value={[fadeOut]}
              onValueChange={(value) => setFadeOut(value[0])}
              max={5}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {fadeOut.toFixed(1)}s
            </div>
          </div>
        </div>

        <Separator />

        {/* Speed Control */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <Label className="text-sm font-medium">Speed</Label>
          </div>
          <div className="space-y-2">
            <Slider
              value={[speed]}
              onValueChange={(value) => setSpeed(value[0])}
              max={300}
              min={25}
              step={5}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {speed}%
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSpeed(50)}
              className="flex-1 text-xs"
            >
              0.5x
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSpeed(100)}
              className="flex-1 text-xs"
            >
              1x
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSpeed(150)}
              className="flex-1 text-xs"
            >
              1.5x
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSpeed(200)}
              className="flex-1 text-xs"
            >
              2x
            </Button>
          </div>
        </div>

        <Separator />

        {/* Vocal Remover */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <Label className="text-sm font-medium">Vocal Remover</Label>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Enable</Label>
            <Switch
              checked={enableVocalRemover}
              onCheckedChange={setEnableVocalRemover}
            />
          </div>
        </div>

        <Separator />

        {/* Reduce Noise */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Label className="text-sm font-medium">Reduce noise</Label>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Enable</Label>
            <Switch
              checked={enableNoiseReduction}
              onCheckedChange={setEnableNoiseReduction}
            />
          </div>
        </div>

        <Separator />

        {/* Reverse Audio */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            <Label className="text-sm font-medium">Reverse audio</Label>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Enable</Label>
            <Switch
              checked={enableReverseAudio}
              onCheckedChange={setEnableReverseAudio}
            />
          </div>
        </div>

        <Separator />

        {/* Pitch Control */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Label className="text-sm font-medium">Pitch</Label>
          </div>
          <div className="space-y-2">
            <Slider
              value={[pitch]}
              onValueChange={(value) => setPitch(value[0])}
              max={12}
              min={-12}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {pitch > 0 ? '+' : ''}{pitch} semitones
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPitch(0)}
            className="w-full text-xs"
          >
            Reset
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-2">
          <Button 
            className="w-full" 
            disabled={!selectedBlockId}
          >
            Apply Changes
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            disabled={!selectedBlockId}
          >
            Reset All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}