"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Scissors, 
  Crop, 
  Type, 
  Music, 
  Palette, 
  Settings,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ToolsPanelProps {
  selectedBlockId: string | null;
  onCut: () => void;
  onCrop: () => void;
  onAddText: () => void;
  onAddMusic: () => void;
  onColorCorrection: () => void;
  onRotate: (direction: 'left' | 'right') => void;
  onFlip: (direction: 'horizontal' | 'vertical') => void;
  onMute: () => void;
  className?: string;
}

export function ToolsPanel({
  selectedBlockId,
  onCut,
  onCrop,
  onAddText,
  onAddMusic,
  onColorCorrection,
  onRotate,
  onFlip,
  onMute,
  className
}: ToolsPanelProps) {
  const isBlockSelected = !!selectedBlockId;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Editing Tools
          {isBlockSelected && <Badge variant="secondary">Block Selected</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Tools */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Basic Tools</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCut}
              disabled={!isBlockSelected}
              className="justify-start"
            >
              <Scissors className="mr-2 h-4 w-4" />
              Cut
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onCrop}
              disabled={!isBlockSelected}
              className="justify-start"
            >
              <Crop className="mr-2 h-4 w-4" />
              Crop
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onAddText}
              className="justify-start"
            >
              <Type className="mr-2 h-4 w-4" />
              Add Text
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onAddMusic}
              className="justify-start"
            >
              <Music className="mr-2 h-4 w-4" />
              Add Music
            </Button>
          </div>
        </div>

        <Separator />

        {/* Transform Tools */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Transform</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRotate('left')}
              disabled={!isBlockSelected}
              className="justify-start"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Rotate Left
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRotate('right')}
              disabled={!isBlockSelected}
              className="justify-start"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Rotate Right
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFlip('horizontal')}
              disabled={!isBlockSelected}
              className="justify-start"
            >
              <FlipHorizontal className="mr-2 h-4 w-4" />
              Flip H
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFlip('vertical')}
              disabled={!isBlockSelected}
              className="justify-start"
            >
              <FlipVertical className="mr-2 h-4 w-4" />
              Flip V
            </Button>
          </div>
        </div>

        <Separator />

        {/* Audio Tools */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Audio</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onMute}
              disabled={!isBlockSelected}
              className="justify-start"
            >
              <VolumeX className="mr-2 h-4 w-4" />
              Mute
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onColorCorrection}
              disabled={!isBlockSelected}
              className="justify-start"
            >
              <Palette className="mr-2 h-4 w-4" />
              Color Correction
            </Button>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Actions</h4>
          <div className="space-y-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start"
            >
              <Settings className="mr-2 h-4 w-4" />
              Project Settings
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start"
            >
              <Settings className="mr-2 h-4 w-4" />
              Export Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 