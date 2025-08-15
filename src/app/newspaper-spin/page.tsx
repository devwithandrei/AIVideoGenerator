'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, Download, Newspaper } from 'lucide-react';
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
  const [newspaperImage, setNewspaperImage] = useState<string | null>(null);
  const [effectType, setEffectType] = useState<'spin' | 'search'>('spin');
  const { toast } = useToast();

  const handleVideoGenerated = (blob: Blob) => {
    console.log('Video generated, blob size:', blob.size);
    const url = URL.createObjectURL(blob);
    setGeneratedVideo(url);
    setIsGenerating(false);
    
    toast({
      title: 'Success!',
      description: 'Your newspaper animation video has been generated. Download it to save it permanently.',
    });
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
