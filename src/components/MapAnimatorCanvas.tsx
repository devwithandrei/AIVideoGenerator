"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Undo2, Trash2, Play, Pause, Download } from 'lucide-react';

export interface Point {
  x: number;
  y: number;
}

export interface AnimationConfig {
  type: 'glowing-trail' | 'dashed-travel' | 'moving-dot';
  speed: number;
  color: string;
  thickness: number;
}

interface MapAnimatorCanvasProps {
  mapImageUrl: string | null;
  onExport: (canvas: HTMLCanvasElement, format: 'mp4' | 'gif') => void;
}

export function MapAnimatorCanvas({ mapImageUrl, onExport }: MapAnimatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>({
    type: 'glowing-trail',
    speed: 1,
    color: '#ff0000',
    thickness: 3,
  });
  const [animationProgress, setAnimationProgress] = useState(0);

  const ctx = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.current = canvas.getContext('2d');
    const context = ctx.current;
    if (!context) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Set default styles
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }, []);

  // Store image drawing parameters for coordinate conversion
  const [imageParams, setImageParams] = useState<{
    offsetX: number;
    offsetY: number;
    drawWidth: number;
    drawHeight: number;
  } | null>(null);

  // Draw the current path
  const drawPath = useCallback(() => {
    const context = ctx.current;
    if (!context || points.length === 0) return;

    context.strokeStyle = animationConfig.color;
    context.lineWidth = animationConfig.thickness;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i].x, points[i].y);
    }
    
    context.stroke();
  }, [points, animationConfig]);

  // Calculate total path distance
  const getTotalPathDistance = useCallback(() => {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance;
  }, [points]);

  // Get point at specific distance along path
  const getPointAtDistance = useCallback((targetDistance: number) => {
    let currentDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const segmentDistance = Math.sqrt(dx * dx + dy * dy);
      
      if (currentDistance + segmentDistance >= targetDistance) {
        const ratio = (targetDistance - currentDistance) / segmentDistance;
        return {
          x: points[i - 1].x + dx * ratio,
          y: points[i - 1].y + dy * ratio,
        };
      }
      
      currentDistance += segmentDistance;
    }
    
    return points[points.length - 1];
  }, [points]);

  // Draw glowing trail animation
  const drawGlowingTrail = useCallback((currentDistance: number) => {
    const context = ctx.current;
    if (!context) return;

    const trailLength = 100;
    const trailStart = Math.max(0, currentDistance - trailLength);
    
    context.strokeStyle = animationConfig.color;
    context.lineWidth = animationConfig.thickness;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    // Draw trail with gradient effect
    for (let d = trailStart; d <= currentDistance; d += 5) {
      const alpha = (d - trailStart) / trailLength;
      context.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
      
      const point = getPointAtDistance(d);
      const nextPoint = getPointAtDistance(Math.min(d + 5, currentDistance));
      
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.lineTo(nextPoint.x, nextPoint.y);
      context.stroke();
    }
  }, [animationConfig, getPointAtDistance]);

  // Draw dashed travel animation
  const drawDashedTravel = useCallback((currentDistance: number) => {
    const context = ctx.current;
    if (!context) return;

    context.strokeStyle = animationConfig.color;
    context.lineWidth = animationConfig.thickness;
    context.setLineDash([10, 5]);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    
    let drawnDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const segmentDistance = Math.sqrt(dx * dx + dy * dy);
      
      if (drawnDistance + segmentDistance <= currentDistance) {
        context.lineTo(points[i].x, points[i].y);
        drawnDistance += segmentDistance;
      } else {
        const ratio = (currentDistance - drawnDistance) / segmentDistance;
        const x = points[i - 1].x + dx * ratio;
        const y = points[i - 1].y + dy * ratio;
        context.lineTo(x, y);
        break;
      }
    }
    
    context.stroke();
    context.setLineDash([]);
  }, [animationConfig, points]);

  // Draw moving dot animation
  const drawMovingDot = useCallback((currentDistance: number) => {
    const context = ctx.current;
    if (!context) return;

    const point = getPointAtDistance(currentDistance);
    
    // Draw the path
    context.strokeStyle = animationConfig.color;
    context.lineWidth = animationConfig.thickness;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    
    let drawnDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const segmentDistance = Math.sqrt(dx * dx + dy * dy);
      
      if (drawnDistance + segmentDistance <= currentDistance) {
        context.lineTo(points[i].x, points[i].y);
        drawnDistance += segmentDistance;
      } else {
        const ratio = (currentDistance - drawnDistance) / segmentDistance;
        const x = points[i - 1].x + dx * ratio;
        const y = points[i - 1].y + dy * ratio;
        context.lineTo(x, y);
        break;
      }
    }
    
    context.stroke();
    
    // Draw the moving dot
    context.fillStyle = animationConfig.color;
    context.beginPath();
    context.arc(point.x, point.y, 8, 0, 2 * Math.PI);
    context.fill();
    
    // Add glow effect
    context.shadowColor = animationConfig.color;
    context.shadowBlur = 10;
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, 2 * Math.PI);
    context.fill();
    context.shadowBlur = 0;
  }, [animationConfig, points, getPointAtDistance]);

  // Draw animation based on type - simplified and reliable
  const drawAnimation = useCallback(() => {
    const context = ctx.current;
    if (!context || points.length < 2) return;

    const totalDistance = getTotalPathDistance();
    const currentDistance = totalDistance * animationProgress;

    // Draw the completed path
    context.strokeStyle = animationConfig.color;
    context.lineWidth = animationConfig.thickness;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    
    let drawnDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const segmentDistance = Math.sqrt(dx * dx + dy * dy);
      
      if (drawnDistance + segmentDistance <= currentDistance) {
        context.lineTo(points[i].x, points[i].y);
        drawnDistance += segmentDistance;
      } else {
        const ratio = (currentDistance - drawnDistance) / segmentDistance;
        const x = points[i - 1].x + dx * ratio;
        const y = points[i - 1].y + dy * ratio;
        context.lineTo(x, y);
        break;
      }
    }
    
    context.stroke();

    // Draw animation element based on type
    if (animationConfig.type === 'moving-dot') {
      const point = getPointAtDistance(currentDistance);
      context.fillStyle = animationConfig.color;
      context.beginPath();
      context.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      context.fill();
    } else if (animationConfig.type === 'glowing-trail') {
      // Draw glowing effect
      const trailLength = 50;
      const trailStart = Math.max(0, currentDistance - trailLength);
      
      for (let d = trailStart; d <= currentDistance; d += 5) {
        const alpha = (d - trailStart) / trailLength;
        const point = getPointAtDistance(d);
        context.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        context.beginPath();
        context.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        context.fill();
      }
    } else if (animationConfig.type === 'dashed-travel') {
      // Draw dashed effect
      context.setLineDash([10, 5]);
      context.stroke();
      context.setLineDash([]);
    }
  }, [points, animationProgress, animationConfig, getTotalPathDistance, getPointAtDistance]);

  // Draw map background
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = ctx.current;
    if (!canvas || !context || !mapImageUrl) return;

    const img = new Image();
    
    img.onload = () => {
      try {
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate aspect ratio to fit image properly
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider than canvas
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgAspect;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          // Image is taller than canvas
          drawHeight = canvas.height;
          drawWidth = canvas.height * imgAspect;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        }
        
        // Store image parameters for coordinate conversion
        setImageParams({ offsetX, offsetY, drawWidth, drawHeight });
        
        context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Redraw points and path after a short delay to ensure state is updated
        setTimeout(() => {
          if (points.length > 0) {
            drawPath();
          }
        }, 0);
      } catch (error) {
        console.error('Error drawing image:', error);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image:', mapImageUrl);
    };
    
    img.src = mapImageUrl;
  }, [mapImageUrl]);

  // Handle canvas click to add points
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = ctx.current;
    if (!canvas || !context) return;

    // Get precise coordinates
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Calculate exact click position
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    const canvasX = clientX * scaleX;
    const canvasY = clientY * scaleY;
    
    console.log('Click at:', { clientX, clientY, canvasX, canvasY });
    
    // If we have image parameters, check bounds
    if (imageParams) {
      // Convert to image coordinates for boundary check
      const imageX = (canvasX - imageParams.offsetX) / imageParams.drawWidth;
      const imageY = (canvasY - imageParams.offsetY) / imageParams.drawHeight;
      
      console.log('Image coordinates:', { imageX, imageY });
      
      // Only add point if click is within the image bounds
      if (imageX >= 0 && imageX <= 1 && imageY >= 0 && imageY <= 1) {
        addPointWithDrawing(canvasX, canvasY);
      } else {
        console.log('Click outside image bounds');
      }
    } else {
      // If no image, allow clicking anywhere on canvas
      addPointWithDrawing(canvasX, canvasY);
    }
  };

  // Helper function to add point and draw immediately
  const addPointWithDrawing = (x: number, y: number) => {
    const context = ctx.current;
    if (!context) return;

    const newPoint = { x, y };
    setPoints(prev => {
      const newPoints = [...prev, newPoint];
      
      // Draw the line immediately for instant feedback
      if (newPoints.length > 1) {
        const lastPoint = newPoints[newPoints.length - 2];
        
        // Set drawing styles
        context.strokeStyle = animationConfig.color;
        context.lineWidth = animationConfig.thickness;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        // Draw the line segment
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(newPoint.x, newPoint.y);
        context.stroke();
        
        console.log('Drew line from', lastPoint, 'to', newPoint);
      } else {
        // Draw a dot for the first point
        context.fillStyle = animationConfig.color;
        context.beginPath();
        context.arc(newPoint.x, newPoint.y, 3, 0, 2 * Math.PI);
        context.fill();
        
        console.log('Drew dot at', newPoint);
      }
      
      return newPoints;
    });
  };

  // Mouse drawing handlers for smooth drawing
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    handleCanvasClick(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const context = ctx.current;
    if (!canvas || !context) return;

    // Get precise coordinates
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Calculate exact mouse position
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    const canvasX = clientX * scaleX;
    const canvasY = clientY * scaleY;
    
    // If we have image parameters, check bounds
    if (imageParams) {
      const imageX = (canvasX - imageParams.offsetX) / imageParams.drawWidth;
      const imageY = (canvasY - imageParams.offsetY) / imageParams.drawHeight;
      
      if (imageX >= 0 && imageX <= 1 && imageY >= 0 && imageY <= 1) {
        addPointWithDrawing(canvasX, canvasY);
      }
    } else {
      addPointWithDrawing(canvasX, canvasY);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Undo last point
  const undoLastPoint = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  // Clear all points
  const clearPoints = () => {
    setPoints([]);
    setAnimationProgress(0);
    setIsAnimating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Start animation
  const startAnimation = () => {
    if (points.length < 2) return;
    
    // Stop any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsAnimating(true);
    setAnimationProgress(0);
    
    // Start the animation loop
    requestAnimationFrame(animate);
  };

  // Stop animation
  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Animation loop - completely rewritten
  const animate = useCallback(() => {
    const context = ctx.current;
    const canvas = canvasRef.current;
    if (!context || !canvas || !isAnimating) {
      console.log('Animation stopped: context, canvas, or isAnimating missing');
      return;
    }

    // Update progress
    setAnimationProgress(prev => {
      const newProgress = prev + (0.01 * animationConfig.speed);
      if (newProgress >= 1) {
        setIsAnimating(false);
        return 1;
      }
      return newProgress;
    });

    // Clear and redraw everything
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image if available
    if (mapImageUrl && imageParams) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, imageParams.offsetX, imageParams.offsetY, imageParams.drawWidth, imageParams.drawHeight);
        drawAnimation();
        
        // Continue animation
        if (isAnimating) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      img.src = mapImageUrl;
    } else {
      // No image, just draw animation
      drawAnimation();
      
      // Continue animation
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }
  }, [isAnimating, animationConfig, mapImageUrl, imageParams, drawAnimation]);

  // Redraw when animation config changes (but not when points change - they're drawn instantly)
  useEffect(() => {
    if (!isAnimating) {
      const canvas = canvasRef.current;
      const context = ctx.current;
      if (!canvas || !context) return;

      // Only redraw when animation config changes, not when points change
      const redraw = () => {
        if (mapImageUrl && imageParams) {
          const img = new Image();
          img.onload = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, imageParams.offsetX, imageParams.offsetY, imageParams.drawWidth, imageParams.drawHeight);
            if (points.length > 0) {
              drawPath();
            }
          };
          img.src = mapImageUrl;
        } else {
          context.clearRect(0, 0, canvas.width, canvas.height);
          if (points.length > 0) {
            drawPath();
          }
        }
      };

      requestAnimationFrame(redraw);
    }
  }, [animationConfig, isAnimating, mapImageUrl, imageParams, drawPath]); // Removed 'points' from dependencies

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={undoLastPoint}
          disabled={points.length === 0}
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearPoints}
          disabled={points.length === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={isAnimating ? stopAnimation : startAnimation}
          disabled={points.length < 2}
        >
          {isAnimating ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Play
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            if (points.length < 2) return;
            
            try {
              // Start animation
              setIsAnimating(true);
              setAnimationProgress(0);
              
              // Wait for animation to start
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Record the animation
              const canvas = canvasRef.current;
              if (!canvas) return;
              
              const stream = canvas.captureStream(30);
              const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
              });
              
              const chunks: Blob[] = [];
              
              mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  chunks.push(event.data);
                }
              };
              
              mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'map-animation.webm';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Stop animation
                setIsAnimating(false);
                setAnimationProgress(0);
              };
              
              // Start recording
              mediaRecorder.start();
              
              // Stop recording after 3 seconds
              setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                }
              }, 3000);
              
            } catch (error) {
              console.error('Export failed:', error);
              setIsAnimating(false);
              setAnimationProgress(0);
            }
          }}
          disabled={points.length < 2}
        >
          <Download className="h-4 w-4 mr-2" />
          Export MP4
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport(canvasRef.current!, 'gif')}
          disabled={points.length < 2}
        >
          <Download className="h-4 w-4 mr-2" />
          Export GIF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Animation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Animation Type</label>
              <Select
                value={animationConfig.type}
                onValueChange={(value: 'glowing-trail' | 'dashed-travel' | 'moving-dot') =>
                  setAnimationConfig(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glowing-trail">Glowing Trail</SelectItem>
                  <SelectItem value="dashed-travel">Dashed Travel</SelectItem>
                  <SelectItem value="moving-dot">Moving Dot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Speed</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={animationConfig.speed}
                onChange={(e) =>
                  setAnimationConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))
                }
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">{animationConfig.speed}x</span>
            </div>

            <div>
              <label className="text-sm font-medium">Color</label>
              <input
                type="color"
                value={animationConfig.color}
                onChange={(e) =>
                  setAnimationConfig(prev => ({ ...prev, color: e.target.value }))
                }
                className="w-full h-10 rounded border"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Thickness</label>
              <input
                type="range"
                min="1"
                max="10"
                value={animationConfig.thickness}
                onChange={(e) =>
                  setAnimationConfig(prev => ({ ...prev, thickness: parseInt(e.target.value) }))
                }
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">{animationConfig.thickness}px</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>1. Upload a map image above</p>
              <p>2. Click on the map to add points for your path</p>
              <p>3. Use Undo to remove the last point</p>
              <p>4. Use Clear to start over</p>
              <p>5. Adjust animation settings</p>
              <p>6. Click Play to preview the animation</p>
              <p>7. Export as MP4 or GIF when ready</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="w-full h-[600px] cursor-crosshair bg-gray-100"
          style={{ touchAction: 'none' }}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Points: {points.length}</p>
        {isAnimating && <p>Progress: {Math.round(animationProgress * 100)}%</p>}
      </div>
    </div>
  );
}
