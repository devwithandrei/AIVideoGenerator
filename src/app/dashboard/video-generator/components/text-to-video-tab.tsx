"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, useUser } from '@clerk/nextjs';
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
import { Loader2, Video, FileText, HelpCircle, ExternalLink, Download, Smartphone, Monitor, Square, Film, MonitorSmartphone } from "lucide-react";
import { generateVideoFromText } from "@/ai/flows/generate-video-from-text";

const models = [
  {
    id: "veo2",
    name: "Veo2",
    description: "High quality video generation with advanced AI capabilities.",
  },
  {
    id: "hailuo",
    name: "Hailuo",
    description: "Generate 6s videos with sound from text prompts. Powered by Minimax Video-01.",
  },
];

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  model: z.string(),
  aspectRatio: z.string(),
  resolution: z.string(),
  format: z.string(),
  proMode: z.boolean().default(true),
});

export function TextToVideoTab() {
  const { toast } = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      model: models[0].id,
      aspectRatio: "16:9",
      resolution: "1080p",
      format: "MP4",
      proMode: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to generate videos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVideoUrl("");
    try {
      let result;
      if (values.model === "hailuo") {
        const { generateVideoFromTextHailuo } = await import("@/ai/flows/generate-video-from-text-hailuo");
        // Hailuo doesn't support custom aspect ratios, it generates in 16:9 format
        result = await generateVideoFromTextHailuo({
          ...values,
          aspectRatio: "16:9", // Hailuo is fixed at 16:9
          userId: user.id,
        });
      } else {
        result = await generateVideoFromText(values);
      }
      
      setVideoUrl(result.videoDataUri);
      toast({
        title: "Success!",
        description: "Your video has been generated from text.",
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

  const selectedModelDescription = models.find(
    (m) => m.id === form.watch("model")
  )?.description;
  
  const selectedModel = form.watch("model");
  const isHailuo = selectedModel === "hailuo";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
      {/* Left Panel - Input */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Videos from Text
            </CardTitle>
            <CardDescription>
              Describe the video you want to create, and our AI will bring it to life.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., A cinematic shot of a futuristic city with flying cars at sunset (Keep content appropriate and family-friendly)"
                          className="resize-none"
                          rows={5}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {models.length > 1 && (
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select AI Model</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {models.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedModelDescription && (
                            <FormDescription>
                              {selectedModelDescription}
                            </FormDescription>
                          )}
                          {isHailuo && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                              ⚠️ Hailuo generates 6-second videos with sound in 16:9 format only.
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolution</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a resolution" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="720p">720p (1280x720)</SelectItem>
                            <SelectItem value="1080p">
                              1080p (1920x1080)
                            </SelectItem>
                            <SelectItem value="4K">4K (3840x2160)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Format</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MP4">MP4</SelectItem>
                            <SelectItem value="MOV">MOV</SelectItem>
                            <SelectItem value="WebM">WebM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  style={{
                    backgroundColor: "hsl(var(--accent))",
                    color: "hsl(var(--accent-foreground))",
                  }}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate Video
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
                      link.download = `generated-video-${Date.now()}.mp4`;
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