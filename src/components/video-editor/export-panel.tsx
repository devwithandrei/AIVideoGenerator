"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Settings, 
  Video, 
  Music, 
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ExportOptions } from '@/types/video-editor';
import { useToast } from '@/hooks/use-toast';

interface ExportPanelProps {
  tracks: any[];
  duration: number;
  onExport: (options: ExportOptions) => Promise<void>;
  className?: string;
}

export function ExportPanel({ tracks, duration, onExport, className }: ExportPanelProps) {
  const { toast } = useToast();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'mp4',
    quality: 'medium',
    resolution: '1080p',
    includeAudio: true
  });
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExport = async () => {
    const videoTracks = tracks.filter(track => track.type === 'video' && track.blocks.length > 0);
    const totalVideoBlocks = videoTracks.reduce((acc, track) => acc + track.blocks.length, 0);
    
    if (totalVideoBlocks === 0) {
      toast({
        title: "No Video Content",
        description: "Add video files to the timeline before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 8;
        });
      }, 150);

      await onExport({ ...exportOptions, aspectRatio });
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Don't show duplicate toast - the main handler will show appropriate message
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1500); // Keep progress visible for a moment
    }
  };

  const getEstimatedSize = () => {
    const baseSize = duration * 2; // MB per minute
    let multiplier = 1;
    
    switch (exportOptions.quality) {
      case 'low':
        multiplier = 0.5;
        break;
      case 'high':
        multiplier = 2;
        break;
      default:
        multiplier = 1;
    }
    
    switch (exportOptions.resolution) {
      case '720p':
        multiplier *= 0.7;
        break;
      case '4k':
        multiplier *= 2.5;
        break;
      default:
        multiplier *= 1;
    }
    
    return Math.round(baseSize * multiplier);
  };

  const getExportTime = () => {
    const baseTime = duration * 0.5; // seconds per second of video
    let multiplier = 1;
    
    switch (exportOptions.quality) {
      case 'low':
        multiplier = 0.3;
        break;
      case 'high':
        multiplier = 2;
        break;
      default:
        multiplier = 1;
    }
    
    return Math.round(baseTime * multiplier);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Summary */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Video className="h-4 w-4" />
            Timeline Content
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              <span>{tracks.filter(t => t.type === 'video').reduce((acc, track) => acc + track.blocks.length, 0)} video(s)</span>
            </div>
            <div className="flex items-center gap-1">
              <Music className="h-3 w-3" />
              <span>{tracks.filter(t => t.type === 'audio').reduce((acc, track) => acc + track.blocks.length, 0)} audio(s)</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Duration: {formatDuration(duration)} • Size: ~{getEstimatedSize()}MB
          </p>
          <div className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 p-2 rounded border">
            <strong>Export:</strong> 
            {tracks.filter(t => t.type === 'video').reduce((acc, track) => acc + track.blocks.length, 0) === 1 
              ? " Single video will be exported in your selected format with original quality."
              : ` Multiple videos will be combined and exported as ONE video file in your selected format.`
            }
          </div>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Exporting...</span>
              <span>{Math.round(exportProgress)}%</span>
            </div>
            <Progress value={exportProgress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              Estimated time remaining: {formatDuration(getExportTime() * (1 - exportProgress / 100))}
            </p>
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: 'mp4' | 'mov' | 'webm') => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="mov">MOV</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select
                value={exportOptions.quality}
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setExportOptions(prev => ({ ...prev, quality: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select
                value={exportOptions.resolution}
                onValueChange={(value: '720p' | '1080p' | '4k') => 
                  setExportOptions(prev => ({ ...prev, resolution: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p HD</SelectItem>
                  <SelectItem value="1080p">1080p Full HD</SelectItem>
                  <SelectItem value="4k">4K Ultra HD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <Select
                value={aspectRatio}
                onValueChange={setAspectRatio}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                  <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="includeAudio"
              checked={exportOptions.includeAudio}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeAudio: checked }))
              }
            />
            <Label htmlFor="includeAudio">Include Audio</Label>
          </div>
        </div>

        {/* Export Info */}
        <div className="space-y-2 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Duration:</span>
            <span>{formatDuration(duration)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Estimated Size:</span>
            <span>{getEstimatedSize()} MB</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Export Time:</span>
            <span>{formatDuration(getExportTime())}</span>
          </div>
        </div>

        {/* Export Button */}
        <Button 
          className="w-full" 
          onClick={handleExport}
          disabled={isExporting || tracks.length === 0}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Video
            </>
          )}
        </Button>

        {/* Track Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Timeline Summary</Label>
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <div key={track.id || index} className="flex items-center gap-2 text-xs">
                {track.type === 'video' && <Video className="h-3 w-3" />}
                {track.type === 'audio' && <Music className="h-3 w-3" />}
                {track.type === 'text' && <FileText className="h-3 w-3" />}
                <span className="truncate">{track.name || `Track ${index + 1}`}</span>
                <Badge variant="outline" className="text-xs">
                  {track.blocks?.length || 0} clips
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 