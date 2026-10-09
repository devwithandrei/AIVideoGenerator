"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { MapAnimatorCanvas } from './MapAnimatorCanvas';
import { exportCanvasAnimation } from '@/lib/exportAnimation';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function MapAnimator() {
  const { toast } = useToast();
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setMapImageUrl(result);
      toast({
        title: "Image uploaded successfully",
        description: "You can now draw your path on the map",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async (canvas: HTMLCanvasElement, format: 'mp4' | 'gif') => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      await exportCanvasAnimation(canvas, format, `map-animation-${Date.now()}.${format}`);
      
      toast({
        title: "Export successful",
        description: `Your ${format.toUpperCase()} has been downloaded`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your animation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const clearImage = () => {
    setMapImageUrl(null);
    toast({
      title: "Image cleared",
      description: "Upload a new map image to continue",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Map Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!mapImageUrl ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <Label htmlFor="map-image" className="cursor-pointer">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="map-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Upload a map image to get started. You can use any map screenshot, 
                    satellite image, or custom map design.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={mapImageUrl}
                    alt="Uploaded map"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearImage}
                    className="absolute top-2 right-2"
                  >
                    Clear
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Map image uploaded successfully. You can now draw your path on the canvas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Upload a map image</p>
                  <p className="text-xs text-muted-foreground">
                    Use any map screenshot, satellite image, or custom map design
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Draw your path</p>
                  <p className="text-xs text-muted-foreground">
                    Click on the canvas to add points and create your route
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Choose animation</p>
                  <p className="text-xs text-muted-foreground">
                    Select from Glowing Trail, Dashed Travel, or Moving Dot
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium">Export your animation</p>
                  <p className="text-xs text-muted-foreground">
                    Download as MP4 or GIF for sharing
                  </p>
                </div>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> For best results, use high-resolution map images 
                and create smooth paths with multiple points.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {mapImageUrl && (
        <MapAnimatorCanvas
          mapImageUrl={mapImageUrl}
          onExport={handleExport}
        />
      )}

      {isExporting && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Exporting animation...</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
