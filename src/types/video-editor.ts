export interface TimelineBlock {
  id: string;
  type: 'video' | 'audio' | 'text';
  startTime: number;
  duration: number;
  source: string;
  name: string;
  thumbnail?: string;
  waveform?: number[];
  metadata?: {
    volume?: number;
    speed?: number;
    opacity?: number;
    [key: string]: any;
  };
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  blocks: TimelineBlock[];
  visible: boolean;
  locked: boolean;
}

export interface VideoEditorState {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  zoom: number;
  isPlaying: boolean;
  selectedBlockId: string | null;
  selectedTrackId: string | null;
}

export interface VideoEditorConfig {
  fps: number;
  snapToGrid: boolean;
  gridSize: number;
  showWaveform: boolean;
  showThumbnails: boolean;
}

export interface ExportOptions {
  format: 'mp4' | 'mov' | 'webm';
  quality: 'low' | 'medium' | 'high';
  resolution: '720p' | '1080p' | '4k';
  includeAudio: boolean;
  aspectRatio?: string;
} 