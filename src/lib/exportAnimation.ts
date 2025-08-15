export interface ExportOptions {
  format: 'mp4' | 'gif';
  fps: number;
  duration: number;
  quality: 'low' | 'medium' | 'high';
}

export class AnimationExporter {
  static async exportCanvasAsVideo(
    canvas: HTMLCanvasElement,
    format: 'mp4' | 'gif',
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (onProgress) {
      onProgress(0);
    }

    try {
      // For now, we'll export as a static image since video export requires more complex setup
      // In a real implementation, you would use MediaRecorder API or a library like RecordRTC
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, format === 'gif' ? 'image/gif' : 'image/png');
      });

      if (onProgress) {
        onProgress(100);
      }

      return blob;
    } catch (error) {
      if (onProgress) {
        onProgress(0);
      }
      throw error;
    }
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static getSupportedFormats(): string[] {
    return ['png', 'jpg']; // Simplified for now
  }

  static getQualityOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'low', label: 'Low (640x480)' },
      { value: 'medium', label: 'Medium (1280x720)' },
      { value: 'high', label: 'High (1920x1080)' }
    ];
  }

  // Simple canvas recording using MediaRecorder API
  static async recordCanvasAsVideo(
    canvas: HTMLCanvasElement,
    duration: number = 3000,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Starting canvas recording for', duration, 'ms');
        
        const stream = canvas.captureStream(30); // 30 FPS
        console.log('Canvas stream created:', stream);
        
        // Try different MIME types for better compatibility
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
        }
        
        console.log('Using MIME type:', mimeType);
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType
        });

        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          console.log('Data available:', event.data.size, 'bytes');
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          console.log('Recording stopped, total chunks:', chunks.length);
          const blob = new Blob(chunks, { type: mimeType });
          console.log('Final blob size:', blob.size, 'bytes');
          resolve(blob);
        };

        mediaRecorder.onerror = (error) => {
          console.error('MediaRecorder error:', error);
          reject(error);
        };

        mediaRecorder.onstart = () => {
          console.log('Recording started');
        };

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms

        // Update progress
        if (onProgress) {
          const startTime = Date.now();
          const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            onProgress(progress);
            
            if (progress >= 100) {
              clearInterval(progressInterval);
            }
          }, 100);
        }

        // Stop recording after duration
        setTimeout(() => {
          console.log('Stopping recording after', duration, 'ms');
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          } else {
            console.log('MediaRecorder state:', mediaRecorder.state);
          }
        }, duration);

      } catch (error) {
        console.error('Recording setup error:', error);
        reject(error);
      }
    });
  }
}

// Utility function for simple export
export async function exportCanvasAnimation(
  canvas: HTMLCanvasElement,
  format: 'mp4' | 'gif',
  filename?: string
): Promise<void> {
  try {
    let blob: Blob;
    
    if (format === 'mp4') {
      // Use MediaRecorder for video - record the full animation
      blob = await AnimationExporter.recordCanvasAsVideo(canvas, 3000); // 3 seconds
    } else {
      // Use canvas export for static images
      blob = await AnimationExporter.exportCanvasAsVideo(canvas, 'png');
    }
    
    const defaultFilename = `map-animation.${format === 'mp4' ? 'webm' : 'png'}`;
    AnimationExporter.downloadBlob(blob, filename || defaultFilename);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}
