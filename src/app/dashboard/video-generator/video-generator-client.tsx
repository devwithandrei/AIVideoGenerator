"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const models = [
  {
    id: "comfyui-minimax",
    name: "MiniMax H3",
    description: "High-quality video generation powered by MiniMax H3.",
  },
  {
    id: "comfyui-lipsync",
    name: "MiniMax H3 + LipSync",
    description: "Generate with loaded lip-sync workflow.",
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
});

export function VideoGeneratorClient() {
  const { toast } = useToast();
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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setVideoUrl("");
    try {
      const resolution = values.resolution;
      let width = 1024;
      let height = 1024;
      if (values.aspectRatio === "16:9") { width = 1280; height = 720; }
      else if (values.aspectRatio === "9:16") { width = 720; height = 1280; }
      else if (values.aspectRatio === "1:1") { width = 1024; height = 1024; }
      else if (values.aspectRatio === "21:9") { width = 1280; height = 544; }
      if (resolution === "4K") { width = Math.round(width * 2); height = Math.round(height * 2); }
      if (resolution === "720p" && width > 1280) { width = Math.round(width * 0.75); height = Math.round(height * 0.75); }

      const res = await fetch("/api/comfyui/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "text-to-image",
          prompt: values.prompt,
          width,
          height,
          steps: 8,
          cfg: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      if (data.outputs && data.outputs.length > 0) {
        setVideoUrl(data.outputs[0]);
      } else if (data.outputUrls && data.outputUrls.length > 0) {
        setVideoUrl(data.outputUrls[0]);
      }
      toast({
        title: "Success!",
        description: "Your generation is ready.",
      });
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const selectedModelDescription = models.find(
    (m) => m.id === form.watch("model")
  )?.description;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Media</CardTitle>
          <CardDescription>
            Fill in the details below to generate your media.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {models.length > 1 && (
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Workflow</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a workflow" />
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
                          <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                          <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                          <SelectItem value="1:1">Square (1:1)</SelectItem>
                          <SelectItem value="21:9">
                            Widescreen Cinematic (21:9)
                          </SelectItem>
                          <SelectItem value="32:9">Ultra-Wide (32:9)</SelectItem>
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
                      <FormLabel>Output Format</FormLabel>
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
                          <SelectItem value="MP4">PNG (Image)</SelectItem>
                          <SelectItem value="MOV">JPG (Image)</SelectItem>
                          <SelectItem value="WebM">WebP (Image)</SelectItem>
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
                Generate
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
              <p className="text-muted-foreground">
                Generating... <br /> This may take a moment.
              </p>
            </div>
          ) : videoUrl ? (
            videoUrl.startsWith("data:image") ? (
              <img
                src={videoUrl}
                alt="Generated output"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Video className="h-16 w-16 mb-4" />
              <p>Your generated media will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
