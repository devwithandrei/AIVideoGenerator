"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image as ImageIcon, AlertCircle } from "lucide-react";
import { generateMapAnimation } from "@/ai/flows/generate-map-animation";
import { generateMapAnimationFromImage } from "@/ai/flows/generate-map-animation-from-image";
import { Alert, AlertDescription } from "@/components/ui/alert";

const promptFormSchema = z.object({
  prompt: z.string().min(10, {
    message: "Animation prompt must be at least 10 characters.",
  }),
  model: z.string(),
  aspectRatio: z.string(),
  mapStyle: z.string(),
  lineColor: z.string(),
  duration: z.string(),
});

const imageFormSchema = z.object({
  prompt: z.string().min(10, {
    message: "Animation prompt must be at least 10 characters.",
  }),
  model: z.string(),
  aspectRatio: z.string(),
  duration: z.string(),
});

export function MapAnimationClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const promptForm = useForm<z.infer<typeof promptFormSchema>>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      prompt: "",
      model: "veo2",
      aspectRatio: "16:9",
      mapStyle: "roadmap",
      lineColor: "red",
      duration: "5",
    },
  });

  const imageForm = useForm<z.infer<typeof imageFormSchema>>({
    resolver: zodResolver(imageFormSchema),
    defaultValues: {
      prompt: "",
      model: "veo2",
      aspectRatio: "16:9",
      duration: "5",
    },
  });

  // Watch the model selection to show warnings
  const selectedModel = promptForm.watch("model");
  const selectedImageModel = imageForm.watch("model");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "Image file size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmitPrompt(values: z.infer<typeof promptFormSchema>) {
    setIsLoading(true);
    setVideoUrl("");
    try {
      const result = await generateMapAnimation(values);
      setVideoUrl(result.videoDataUri);
      toast({
        title: "Success!",
        description: "Your map animation has been generated.",
      });
    } catch (error) {
      console.error("Map animation generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate animation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmitImage(values: z.infer<typeof imageFormSchema>) {
    if (!imageFile) {
      toast({
        title: "Error",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVideoUrl("");
    try {
      const result = await generateMapAnimationFromImage({
        ...values,
        imageFile,
      });
      setVideoUrl(result.videoDataUri);
      toast({
        title: "Success!",
        description: "Your map animation has been generated from image.",
      });
    } catch (error) {
      console.error("Map animation from image generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate animation from image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="prompt" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prompt">Map Animation</TabsTrigger>
          <TabsTrigger value="image">Image to Animation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prompt">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Generate Map Animation</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...promptForm}>
                  <form onSubmit={promptForm.handleSubmit(onSubmitPrompt)} className="space-y-8">
                    <FormField
                      control={promptForm.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Animation Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Highlight the borders of France with a glowing animation, Show a journey from Tokyo to Kyoto with cherry blossoms, Animate the Great Wall of China with historical markers"
                              className="resize-none"
                              rows={5}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promptForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AI Model</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an AI model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="veo2">Veo2</SelectItem>
                              <SelectItem value="hailuo">Hailuo</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    {/* Warning for Hailuo model */}
                    {selectedModel === "hailuo" && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Hailuo model only supports 16:9 aspect ratio. The aspect ratio will be automatically set to 16:9.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <FormField
                      control={promptForm.control}
                      name="aspectRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspect Ratio</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={selectedModel === "hailuo"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an aspect ratio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                              <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                              <SelectItem value="1:1">1:1 (Square)</SelectItem>
                              <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                              <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedModel === "hailuo" && (
                            <p className="text-sm text-muted-foreground">
                              Fixed to 16:9 for Hailuo model
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promptForm.control}
                      name="mapStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Map Style</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a map style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="roadmap">Roadmap</SelectItem>
                              <SelectItem value="satellite">Satellite</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                              <SelectItem value="terrain">Terrain</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promptForm.control}
                      name="lineColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Line Color</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a line color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="yellow">Yellow</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promptForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (seconds)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="30">30</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading} className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate Animation
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card className="flex items-center justify-center aspect-video bg-card/50 border-dashed">
              <CardContent className="p-0 w-full h-full">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating your animation... <br /> This can take up to a minute.</p>
                  </div>
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <p>Your generated map animation will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="image">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Generate from Image Reference</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...imageForm}>
                  <form onSubmit={imageForm.handleSubmit(onSubmitImage)} className="space-y-8">
                    <FormField
                      control={imageForm.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Animation Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Create an animated map showing the journey from the uploaded image, add glowing paths and markers, animate the route with smooth transitions and visual effects"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <FormLabel>Upload Reference Image</FormLabel>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          {uploadedImage ? (
                            <div className="space-y-4">
                              <img
                                src={uploadedImage}
                                alt="Uploaded reference"
                                className="w-full max-h-48 object-contain rounded-lg"
                              />
                              <p className="text-sm text-muted-foreground">
                                Image uploaded successfully
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Click to upload image</p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG, JPEG up to 10MB
                                </p>
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <FormField
                      control={imageForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AI Model</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an AI model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="veo2">Veo2</SelectItem>
                              <SelectItem value="hailuo">Hailuo</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    {/* Warning for Hailuo model in image tab */}
                    {selectedImageModel === "hailuo" && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Hailuo model only supports 16:9 aspect ratio. The aspect ratio will be automatically set to 16:9.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <FormField
                      control={imageForm.control}
                      name="aspectRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspect Ratio</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={selectedImageModel === "hailuo"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an aspect ratio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                              <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                              <SelectItem value="1:1">1:1 (Square)</SelectItem>
                              <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                              <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedImageModel === "hailuo" && (
                            <p className="text-sm text-muted-foreground">
                              Fixed to 16:9 for Hailuo model
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={imageForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (seconds)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="30">30</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading || !uploadedImage} className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate from Image
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card className="flex items-center justify-center aspect-video bg-card/50 border-dashed">
              <CardContent className="p-0 w-full h-full">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating your animation... <br /> This can take up to a minute.</p>
                  </div>
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <p>Your generated map animation will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
