'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, Download, Newspaper, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewspaperSpinCanvas } from '@/components/NewspaperSpinCanvas';
import { NewspaperSearchCanvas } from '@/components/NewspaperSearchCanvas';

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface GenerateRequest {
  name: string;
  theme: 'light' | 'dark';
  aspect: 'landscape' | 'vertical';
  duration: '5s' | '10s' | '15s' | '20s' | '25s' | '30s' | 'auto';
}

interface SavedVideo {
  id: string;
  name: string;
  theme: 'light' | 'dark';
  aspect: 'landscape' | 'vertical';
  videoUrl: string;
  cloudinaryId?: string; // Cloudinary public_id
  createdAt: Date;
  fileName: string;
}

export default function NewspaperSpinPage() {
  const [formData, setFormData] = useState<GenerateRequest>({
    name: '',
    theme: 'light',
    aspect: 'landscape',
    duration: 'auto',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [newspaperImage, setNewspaperImage] = useState<string | null>(null);
  const [effectType, setEffectType] = useState<'spin' | 'search'>('spin');
  const { toast } = useToast();

  const handleVideoGenerated = async (blob: Blob) => {
    console.log('Video generated, blob size:', blob.size);
    const url = URL.createObjectURL(blob);
    setGeneratedVideo(url);
    setIsGenerating(false);
    
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('video', blob, `newspaper-animation-${formData.name}.mp4`);
      formData.append('metadata', JSON.stringify({
        name: formData.name,
        theme: formData.theme,
        aspect: formData.aspect,
        effectType,
        duration: formData.duration,
      }));

      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to Cloudinary');
      }

      const result = await response.json();
      
      if (result.success) {
        // Create unique ID
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Save the video to the collection with Cloudinary URL
        const newVideo: SavedVideo = {
          id: uniqueId,
          name: formData.name,
          theme: formData.theme,
          aspect: formData.aspect,
          videoUrl: result.video.url, // Use Cloudinary URL
          cloudinaryId: result.video.public_id, // Store Cloudinary ID
          createdAt: new Date(),
          fileName: `newspaper-animation-${formData.name}.mp4`
        };
        
        // Check if video with same name and settings already exists
        setSavedVideos(prev => {
          const existingVideo = prev.find(video => 
            video.name === newVideo.name && 
            video.theme === newVideo.theme && 
            video.aspect === newVideo.aspect
          );
          
          if (existingVideo) {
            // Replace the existing video instead of adding duplicate
            return prev.map(video => 
              video.id === existingVideo.id ? newVideo : video
            );
          } else {
            // Add new video
            return [newVideo, ...prev];
          }
        });
        
        // Update localStorage with metadata only
        try {
          const existingVideos = JSON.parse(localStorage.getItem('newspaperSpinVideos') || '[]');
          const existingVideoIndex = existingVideos.findIndex((video: SavedVideo) => 
            video.name === newVideo.name && 
            video.theme === newVideo.theme && 
            video.aspect === newVideo.aspect
          );
          
          if (existingVideoIndex !== -1) {
            // Replace existing video
            existingVideos[existingVideoIndex] = {
              ...newVideo,
              videoUrl: result.video.url // Store Cloudinary URL
            };
          } else {
            // Add new video
            existingVideos.unshift({
              ...newVideo,
              videoUrl: result.video.url // Store Cloudinary URL
            });
          }
          
          // Limit to 20 videos to prevent storage issues
          if (existingVideos.length > 20) {
            existingVideos.splice(20);
          }
          
          localStorage.setItem('newspaperSpinVideos', JSON.stringify(existingVideos));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
        
        toast({
          title: 'Success!',
          description: 'Your newspaper animation video has been generated and saved to the cloud',
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      toast({
        title: 'Upload Error',
        description: 'Video generated but failed to save to cloud. It will be available temporarily.',
        variant: 'destructive',
      });
      
      // Fallback: save locally with blob URL
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newVideo: SavedVideo = {
        id: uniqueId,
        name: formData.name,
        theme: formData.theme,
        aspect: formData.aspect,
        videoUrl: url,
        createdAt: new Date(),
        fileName: `newspaper-animation-${formData.name}.mp4`
      };
      
      setSavedVideos(prev => [newVideo, ...prev]);
    }
  };

  const handleProgress = (progress: number) => {
    setProgress(progress);
  };

  const handleInputChange = (field: keyof GenerateRequest, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setNewspaperImage(result);
        // Auto-switch to search effect when image is uploaded
        setEffectType('search');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewspaperImage(null);
    setEffectType('spin');
  };

  const handleGenerate = () => {
    console.log('Generate button clicked');
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter text to animate',
        variant: 'destructive',
      });
      return;
    }

    if (formData.name.length > 25) {
      toast({
        title: 'Error',
        description: 'Text must be 25 characters or less',
        variant: 'destructive',
      });
      return;
    }

    // Check if search effect requires an image
    if (effectType === 'search' && !newspaperImage) {
      toast({
        title: 'Error',
        description: 'Please upload a newspaper image for the search effect',
        variant: 'destructive',
      });
      return;
    }

    console.log('Starting client-side video generation with:', formData, 'effectType:', effectType);
    setIsGenerating(true);
    setProgress(0);
    setGeneratedVideo(null);
  };

  const handleDownload = () => {
    if (generatedVideo) {
      const link = document.createElement('a');
      link.href = generatedVideo;
      // Always use .mp4 extension for better compatibility
      link.download = `newspaper-animation-${formData.name}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadSaved = (video: SavedVideo) => {
    try {
      // Handle Cloudinary URLs
      if (video.videoUrl && video.videoUrl.includes('cloudinary.com')) {
        const link = document.createElement('a');
        link.href = video.videoUrl;
        const fileName = video.fileName.endsWith('.mp4') ? video.fileName : `${video.fileName}.mp4`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (video.videoUrl && video.videoUrl.startsWith('blob:')) {
        // Handle blob URLs (current format)
        const link = document.createElement('a');
        link.href = video.videoUrl;
        const fileName = video.fileName.endsWith('.mp4') ? video.fileName : `${video.fileName}.mp4`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (video.videoUrl && video.videoUrl.startsWith('data:video/')) {
        // Handle legacy base64 data
        fetch(video.videoUrl)
          .then(res => res.blob())
          .then(blob => {
            const mp4Blob = new Blob([blob], { type: 'video/mp4' });
            const url = URL.createObjectURL(mp4Blob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = video.fileName.endsWith('.mp4') ? video.fileName : `${video.fileName}.mp4`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          })
          .catch(error => {
            console.error('Error downloading video:', error);
            toast({
              title: 'Download Error',
              description: 'Failed to download video',
              variant: 'destructive',
            });
          });
      } else {
        toast({
          title: 'Download Error',
          description: 'Video data not available',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error downloading video:', error);
      toast({
        title: 'Download Error',
        description: 'Failed to download video',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSaved = async (videoId: string) => {
    // Find the video to get its Cloudinary ID
    const videoToDelete = savedVideos.find(video => video.id === videoId);
    
    // Delete from Cloudinary if it has a cloudinaryId
    if (videoToDelete?.cloudinaryId) {
      try {
        const response = await fetch(`/api/upload-video?public_id=${videoToDelete.cloudinaryId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          console.warn('Failed to delete from Cloudinary, but continuing with local deletion');
        }
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }
    }
    
    setSavedVideos(prev => prev.filter(video => video.id !== videoId));
    
    // Update localStorage
    const existingVideos = JSON.parse(localStorage.getItem('newspaperSpinVideos') || '[]');
    const updatedVideos = existingVideos.filter((video: SavedVideo) => video.id !== videoId);
    localStorage.setItem('newspaperSpinVideos', JSON.stringify(updatedVideos));
    
    toast({
      title: 'Video Deleted',
      description: 'The video has been removed from your collection',
    });
  };

  const clearAllVideos = () => {
    setSavedVideos([]);
    localStorage.removeItem('newspaperSpinVideos');
    
    // Clear all sessionStorage to free up quota
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Error clearing sessionStorage:', error);
    }
    
    toast({
      title: 'All Videos Cleared',
      description: 'All saved videos have been removed and storage cleared',
    });
  };

  // Load saved videos on component mount
  React.useEffect(() => {
    const loadVideos = async () => {
      try {
        const existingVideos = JSON.parse(localStorage.getItem('newspaperSpinVideos') || '[]');
        
        // Convert createdAt strings back to Date objects and filter valid videos
        const validVideos = existingVideos
          .filter((video: any) => video && video.id && video.name)
          .map((video: any) => ({
            ...video,
            createdAt: new Date(video.createdAt)
          }));
        
        // Remove duplicates based on name, theme, and aspect
        const uniqueVideos = validVideos.filter((video: SavedVideo, index: number, self: SavedVideo[]) => 
          index === self.findIndex((v: SavedVideo) => 
            v.name === video.name && 
            v.theme === video.theme && 
            v.aspect === video.aspect
          )
        );
        
        setSavedVideos(uniqueVideos);
        
        // Update localStorage with cleaned videos if needed
        if (uniqueVideos.length !== existingVideos.length) {
          localStorage.setItem('newspaperSpinVideos', JSON.stringify(uniqueVideos));
        }
        
        // Clean up any old sessionStorage data
        try {
          const keys = Object.keys(sessionStorage);
          keys.forEach(key => {
            if (key.startsWith('video_')) {
              sessionStorage.removeItem(key);
            }
          });
        } catch (error) {
          console.warn('Error cleaning up sessionStorage:', error);
        }
      } catch (error) {
        console.error('Error loading saved videos:', error);
        setSavedVideos([]);
      }
    };
    
    loadVideos();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">Newspaper Animator</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Create professional newspaper intro videos with classic spin effects or documentary-style search animations. 
            Perfect for documentaries, presentations, and creative projects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle>Video Settings</CardTitle>
              <CardDescription>
                Customize your newspaper animation video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Text Input */}
              <div className="space-y-2">
                <Label htmlFor="name">Text to Animate</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Type the text you want to animate (max 25 characters)"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  maxLength={25}
                  disabled={isGenerating}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.name.length}/25 characters
                </p>
              </div>

              {/* Effect Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="effect-type">Animation Effect</Label>
                <Select
                  value={effectType}
                  onValueChange={(value) => setEffectType(value as 'spin' | 'search')}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select animation effect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spin">Classic Spin</SelectItem>
                    <SelectItem value="search">Documentary Search</SelectItem>
                    {/* Future animation types can be added here */}
                    {/* <SelectItem value="zoom">Zoom Effect</SelectItem> */}
                    {/* <SelectItem value="fade">Fade Transition</SelectItem> */}
                    {/* <SelectItem value="slide">Slide Animation</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {/* Newspaper Image Upload (for search effect) */}
              {effectType === 'search' && (
                <div className="space-y-2">
                  <Label>Newspaper Image</Label>
                  <div className="space-y-2">
                    {newspaperImage ? (
                      <div className="relative">
                        <img
                          src={newspaperImage}
                          alt="Uploaded newspaper"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          onClick={handleRemoveImage}
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          disabled={isGenerating}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isGenerating}
                          className="hidden"
                          id="newspaper-upload"
                        />
                        <label
                          htmlFor="newspaper-upload"
                          className="cursor-pointer text-blue-500 hover:text-blue-700"
                        >
                          Click to upload newspaper image
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                          Upload a newspaper image for the search effect
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Theme Toggle */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="theme"
                      checked={formData.theme === 'dark'}
                      onCheckedChange={(checked) => 
                        handleInputChange('theme', checked ? 'dark' : 'light')
                      }
                      disabled={isGenerating}
                    />
                    <Label htmlFor="theme">
                      {formData.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Duration Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="duration">Video Duration</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value: '5s' | '10s' | '15s' | '20s' | '25s' | '30s' | 'auto') => 
                    handleInputChange('duration', value)
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select video duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5s">5 seconds</SelectItem>
                    <SelectItem value="10s">10 seconds</SelectItem>
                    <SelectItem value="15s">15 seconds</SelectItem>
                    <SelectItem value="20s">20 seconds</SelectItem>
                    <SelectItem value="25s">25 seconds</SelectItem>
                    <SelectItem value="30s">30 seconds</SelectItem>
                    <SelectItem value="auto">Auto (Complete Animation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Aspect Ratio Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="aspect">Aspect Ratio</Label>
                <Select
                  value={formData.aspect}
                  onValueChange={(value: 'landscape' | 'vertical') => 
                    handleInputChange('aspect', value)
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Landscape (16:9) - 1280x720</SelectItem>
                    <SelectItem value="vertical">Vertical (9:16) - 1080x1920</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.name.trim() || (effectType === 'search' && !newspaperImage)}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording Video... {progress}%
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>

              {/* Progress Bar */}
              {isGenerating && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Canvas Section */}
          <Card>
            <CardHeader>
              <CardTitle>Video Generator</CardTitle>
              <CardDescription>
                Preview the animation and generate your newspaper animation video
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formData.name.trim() ? (
                <div className="space-y-4">
                  {/* Show canvas only when generating, show video when generated */}
                  {isGenerating ? (
                    <div>
                      {effectType === 'spin' ? (
                        <NewspaperSpinCanvas
                          name={formData.name}
                          theme={formData.theme}
                          aspect={formData.aspect}
                          duration={formData.duration}
                          isGenerating={isGenerating}
                          onVideoGenerated={handleVideoGenerated}
                          onProgress={handleProgress}
                        />
                      ) : (
                        <NewspaperSearchCanvas
                          name={formData.name}
                          theme={formData.theme}
                          aspect={formData.aspect}
                          duration={formData.duration}
                          newspaperImage={newspaperImage}
                          isGenerating={isGenerating}
                          onVideoGenerated={handleVideoGenerated}
                          onProgress={handleProgress}
                        />
                      )}
                    </div>
                  ) : generatedVideo ? (
                    <div className="space-y-4">
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          src={generatedVideo}
                          controls
                          className="w-full h-full"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleDownload}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Video
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Click "Generate Video" to create your newspaper animation</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter text to see the preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>



        {/* Saved Videos Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-headline">Your Generated Animations</h2>
            {savedVideos.length > 0 && (
              <Button
                onClick={clearAllVideos}
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
          {savedVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedVideos.map((video) => {
                if (!video || !video.id) return null;
                return (
                  <Card key={video.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-video bg-black">
                        {video.videoUrl && (video.videoUrl.startsWith('blob:') || video.videoUrl.startsWith('data:video/')) ? (
                          <video
                            src={video.videoUrl}
                            controls
                            className="w-full h-full"
                            onError={(e) => {
                              console.error('Video load error:', e);
                              // Remove corrupted video
                              handleDeleteSaved(video.id);
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white">
                            <div className="text-center">
                              <div className="text-4xl mb-2">⚠️</div>
                              <p className="text-sm">Video not available</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">{video.name}</h3>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleDownloadSaved(video)}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteSaved(video.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{video.theme} • {video.aspect}</span>
                          <span>{video.createdAt ? video.createdAt.toLocaleDateString() : 'Unknown date'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No saved videos yet. Generate your first animation!</p>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-headline mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Newspaper className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Classic Animation</h3>
                  <p className="text-sm text-muted-foreground">
                    Authentic spinning newspaper effect with smooth 3D rotation
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">High Quality</h3>
                  <p className="text-sm text-muted-foreground">
                    Professional MP4 output with H.264 encoding
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Multiple Formats</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose between landscape and vertical aspect ratios
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
