"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Video, 
  Upload, 
  Image as ImageIcon,
  FileText,
  HelpCircle,
  ExternalLink,
  Play,
  Download,
  Smartphone,
  Monitor,
  Square,
  Film,
  MonitorSmartphone
} from "lucide-react";
import { generateVideoFromImage } from "@/ai/flows/generate-video-from-image";

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  model: z.string(),
  aspectRatio: z.string(),
  duration: z.string(),
  resolution: z.string(),
  proMode: z.boolean().default(true),
});

export function ImageToVideoTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedReferences, setUploadedReferences] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      model: "veo2",
      aspectRatio: "16:9",
      duration: "5s",
      resolution: "1080p",
      proMode: true,
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newImages = files.map(file => URL.createObjectURL(file));
    setUploadedImages(prev => [...prev, ...newImages]);
    toast({
      title: "Images Uploaded",
      description: `${files.length} image(s) uploaded successfully.`,
    });
  };

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newReferences = files.map(file => URL.createObjectURL(file));
    setUploadedReferences(prev => [...prev, ...newReferences]);
    toast({
      title: "References Uploaded",
      description: `${files.length} reference(s) uploaded successfully.`,
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (uploadedImages.length === 0) {
      toast({
        title: "No Images Uploaded",
        description: "Please upload at least one image to generate video from.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVideoUrl("");
    try {
      let result;
      if (values.model === "hailuo") {
        const { generateVideoFromImageHailuo } = await import("@/ai/flows/generate-video-from-image-hailuo");
        // For Hailuo, we'll use the first image
        const imageDataUri = uploadedImages[0];
        result = await generateVideoFromImageHailuo({
          ...values,
          imageDataUri,
          aspectRatio: "16:9", // Hailuo is fixed at 16:9
        });
      } else {
        result = await generateVideoFromImage({
          ...values,
          images: uploadedImages,
          references: uploadedReferences,
        });
      }
      
      setVideoUrl(result.videoDataUri);
      toast({
        title: "Success!",
        description: "Your video has been generated from images.",
      });
    } catch (error) {
      console.error("Video generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate video. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
      {/* Left Panel - Input */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Generate Videos from Images
            </CardTitle>
            <CardDescription>
              Upload images and describe how you want them to be animated into a video.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Media Upload Sections */}
                <div className="space-y-4">
                  {/* Images Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Images</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-24 border-dashed"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-sm">+ Images</span>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-24 border-dashed"
                        onClick={() => referenceInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-6 w-6" />
                          <span className="text-sm">+ References</span>
                        </div>
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <input
                      ref={referenceInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleReferenceUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Uploaded Media Preview */}
                  {(uploadedImages.length > 0 || uploadedReferences.length > 0) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Uploaded Media</Label>
                      <div className="flex flex-wrap gap-2">
                        {uploadedImages.map((url, index) => (
                          <div key={`image-${index}`} className="relative">
                            <img
                              src={url}
                              alt={`Uploaded image ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs">
                              Image
                            </Badge>
                          </div>
                        ))}
                        {uploadedReferences.map((url, index) => (
                          <div key={`reference-${index}`} className="relative">
                            <img
                              src={url}
                              alt={`Uploaded reference ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <Badge variant="outline" className="absolute -top-1 -right-1 text-xs">
                              Ref
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Prompt */}
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe how you want your images to be animated into a video... (Keep content appropriate and family-friendly)"
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        Please keep your prompts appropriate and family-friendly. Avoid content involving violence, explicit material, or inappropriate themes.
                      </p>
                    </FormItem>
                  )}
                />

                {/* Pro Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="proMode"
                    checked={form.watch("proMode")}
                    onCheckedChange={(checked) => form.setValue("proMode", checked)}
                  />
                  <Label htmlFor="proMode">Pro Mode</Label>
                  <Badge variant="secondary">3 trials</Badge>
                </div>

                {/* Help Links */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    <HelpCircle className="h-4 w-4 mr-1" />
                    User Guide
                  </Button>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Try Samples
                  </Button>
                </div>

                {/* Model Selection */}
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="veo2">Veo2</SelectItem>
                <SelectItem value="hailuo">Hailuo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Aspect Ratio */}
                <FormField
                  control={form.control}
                  name="aspectRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aspect Ratio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an aspect ratio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="9:16">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              Portrait (9:16)
                            </div>
                          </SelectItem>
                          <SelectItem value="16:9">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              Landscape (16:9)
                            </div>
                          </SelectItem>
                          <SelectItem value="1:1">
                            <div className="flex items-center gap-2">
                              <Square className="h-4 w-4" />
                              Square (1:1)
                            </div>
                          </SelectItem>
                          <SelectItem value="21:9">
                            <div className="flex items-center gap-2">
                              <Film className="h-4 w-4" />
                              Widescreen Cinematic (21:9)
                            </div>
                          </SelectItem>
                          <SelectItem value="32:9">
                            <div className="flex items-center gap-2">
                              <MonitorSmartphone className="h-4 w-4" />
                              Ultra-Wide (32:9)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duration & Resolution */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="3s">3s</SelectItem>
                            <SelectItem value="5s">5s</SelectItem>
                            <SelectItem value="10s">10s</SelectItem>
                            <SelectItem value="15s">15s</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolution</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                            <SelectItem value="4k">4K</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Generate Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  style={{
                    backgroundColor: "hsl(var(--accent))",
                    color: "hsl(var(--accent-foreground))",
                  }}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Output */}
      <div className="space-y-6">
        <Card className="flex items-center justify-center aspect-video bg-card/50 border-dashed">
          <CardContent className="p-0 w-full h-full flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Generating your video... <br /> This can take up to a minute.
                </p>
              </div>
            ) : videoUrl ? (
              <div className="relative w-full h-full">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = videoUrl;
                      link.download = `image-video-${Date.now()}.mp4`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast({
                        title: "Download Started",
                        description: "Your video is being downloaded.",
                      });
                    }}
                    className="bg-background/80 backdrop-blur"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Video className="h-16 w-16 mb-4" />
                <p>Your generated video will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 