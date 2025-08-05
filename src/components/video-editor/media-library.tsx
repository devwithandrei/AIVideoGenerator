"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileUp, 
  Video, 
  Music, 
  FileText, 
  Trash2, 
  Play,
  Pause,
  Volume2,
  Plus,
  Download
} from 'lucide-react';
import { TimelineBlock } from '@/types/video-editor';
import { useToast } from '@/hooks/use-toast';

interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  url: string;
  duration: number;
  thumbnail?: string;
  waveform?: number[];
  size: number;
  uploadedAt: Date;
}

interface MediaLibraryProps {
  onAddToTimeline: (block: TimelineBlock) => void;
  className?: string;
}

export function MediaLibrary({ onAddToTimeline, className }: MediaLibraryProps) {
  const { toast } = useToast();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [playingItem, setPlayingItem] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        const url = URL.createObjectURL(file);
        const id = `media-${Date.now()}-${Math.random()}`;
        
        let type: 'video' | 'audio' | 'text';
        let duration = 0;
        let thumbnail: string | undefined;
        let waveform: number[] | undefined;

        if (file.type.startsWith('video/')) {
          type = 'video';
          duration = await getVideoDuration(url);
          thumbnail = await generateVideoThumbnail(url);
        } else if (file.type.startsWith('audio/')) {
          type = 'audio';
          duration = await getAudioDuration(url);
          waveform = await generateAudioWaveform(url);
        } else {
          type = 'text';
          duration = 5; // Default text duration
        }

        const mediaItem: MediaItem = {
          id,
          name: file.name,
          type,
          url,
          duration,
          thumbnail,
          waveform,
          size: file.size,
          uploadedAt: new Date()
        };

        setMediaItems(prev => [...prev, mediaItem]);
        
        // Automatically add video files to timeline
        if (type === 'video') {
          const timelineBlock: TimelineBlock = {
            id: `block-${id}`,
            type: mediaItem.type,
            startTime: 0, // Will be adjusted in handleAddToTimeline
            duration: mediaItem.duration,
            source: mediaItem.url,
            name: mediaItem.name,
            thumbnail: mediaItem.thumbnail,
            waveform: mediaItem.waveform
          };
          
          onAddToTimeline(timelineBlock);
        }
        
        toast({
          title: "Media Uploaded",
          description: `${file.name} has been added to your library${type === 'video' ? ' and timeline' : ''}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload one or more files.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getVideoDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = url;
    });
  };

  const getAudioDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        resolve(0);
      };
      audio.src = url;
    });
  };

  const generateVideoThumbnail = async (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadeddata = () => {
        video.currentTime = 1; // Seek to 1 second
      };
      
      video.onseeked = () => {
        if (ctx) {
          canvas.width = 120;
          canvas.height = 68;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        }
      };

      video.onerror = () => {
        // Return a placeholder if thumbnail generation fails
        resolve('');
      };
      
      video.src = url;
    });
  };

  const generateAudioWaveform = async (url: string): Promise<number[]> => {
    // Simplified waveform generation - in a real app, you'd use Web Audio API
    return Array.from({ length: 50 }, () => Math.random() * 0.5 + 0.1);
  };

  const handleAddToTimeline = (item: MediaItem) => {
    const block: TimelineBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      type: item.type,
      startTime: 0, // Will be positioned at current time
      duration: item.duration,
      source: item.url,
      name: item.name,
      thumbnail: item.thumbnail,
      waveform: item.waveform,
      metadata: {
        volume: 1,
        speed: 1,
        opacity: 1
      }
    };

    onAddToTimeline(block);
    toast({
      title: "Added to Timeline",
      description: `${item.name} has been added to the timeline.`,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    const item = mediaItems.find(i => i.id === itemId);
    if (item) {
      URL.revokeObjectURL(item.url);
      setMediaItems(prev => prev.filter(i => i.id !== itemId));
      if (selectedItem === itemId) {
        setSelectedItem(null);
      }
      toast({
        title: "Media Deleted",
        description: `${item.name} has been removed from your library.`,
      });
    }
  };

  const handleDownloadItem = (item: MediaItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'audio':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'text':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Media Library
          <Badge variant="secondary">{mediaItems.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="video/*,audio/*,.txt,.md"
          multiple
        />
        
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Uploading...
            </div>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" /> 
              Upload Media
            </>
          )}
        </Button>
        
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 media-library-item ${
                  selectedItem === item.id 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                }`}
                onClick={() => setSelectedItem(item.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {item.thumbnail ? (
                      <div className="relative">
                        <img 
                          src={item.thumbnail} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded border flex items-center justify-center ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="font-mono">{formatDuration(item.duration)}</span>
                      <span>•</span>
                      <span>{formatFileSize(item.size)}</span>
                      <span>•</span>
                      <Badge variant="outline" className={`text-xs ${getTypeColor(item.type)}`}>
                        {item.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToTimeline(item);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadItem(item);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {mediaItems.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <FileUp className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">No media files uploaded yet</p>
                <p className="text-xs mt-1">Upload video, audio, or text files to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 