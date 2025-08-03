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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video } from "lucide-react";
import { generateVideoFromText } from "@/ai/flows/generate-video-from-text";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  aspectRatio: z.string(),
  resolution: z.string(),
  format: z.string(),
});

export function VideoGeneratorClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      aspectRatio: "16:9",
      resolution: "1080p",
      format: "MP4",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setVideoUrl("");
    try {
      const result = await generateVideoFromText(values);
      setVideoUrl(result.videoDataUri);
      toast({
        title: "Success!",
        description: "Your video has been generated.",
      });
    } catch (error) {
      console.error("Video generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Video</CardTitle>
          <CardDescription>Fill in the details below to generate your video.</CardDescription>
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
                        placeholder="e.g., A cinematic shot of a futuristic city with flying cars at sunset"
                        className="resize-none"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <FormField
                  control={form.control}
                  name="aspectRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aspect Ratio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an aspect ratio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                          <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                          <SelectItem value="1:1">Square (1:1)</SelectItem>
                          <SelectItem value="21:9">Widescreen Cinematic (21:9)</SelectItem>
                          <SelectItem value="32:9">Ultra-Wide (32:9)</SelectItem>
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
                            <SelectValue placeholder="Select a resolution" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="720p">720p (1280x720)</SelectItem>
                          <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
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
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a format" />
                          </Trigger>
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

              <Button type="submit" disabled={isLoading} className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Video
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="flex items-center justify-center aspect-video bg-card/50 border-dashed">
        <CardContent className="p-0 w-full h-full flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating your video... <br /> This can take up to a minute.</p>
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
              <Video className="h-16 w-16 mb-4" />
              <p>Your generated video will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
