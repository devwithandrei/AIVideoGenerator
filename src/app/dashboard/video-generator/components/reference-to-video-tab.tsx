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

const MODELS = [
  {
    id: "minimax-h3-fl2va",
    unetVariant: "fl2va" as const,
    name: "MiniMax H3",
    tagline: "Text / Image → Video (FL2VA)",
    description: "MiniMax H3 standard UNet — best for general text/image-to-video motion.",
  },
  {
    id: "minimax-h3-ref2va",
    unetVariant: "ref2va" as const,
    name: "MiniMax H3 Ref",
    tagline: "Reference → Video (Ref2VA)",
    description: "Reference-conditioned UNet — keep character/object identity across frames when using references.",
  },
];

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  model: z.string(),
  aspectRatio: z.string(),
  duration: z.string(),
  resolution: z.string(),
  format: z.string(),
  proMode: z.boolean().default(true),
});

export function ReferenceToVideoTab() {
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
      model: MODELS[1].id,
      aspectRatio: "16:9",
      duration: "5s",
      resolution: "1080p",
      format: "MP4",
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
    if (uploadedImages.length === 0 && uploadedReferences.length === 0) {
      toast({
        title: "No Media Uploaded",
        description: "Please upload at least one image or reference.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVideoUrl("");
    try {
      let width = 1024;
      let height = 1024;
      if (values.aspectRatio === "16:9") { width = 1280; height = 720; }
      else if (values.aspectRatio === "9:16") { width = 720; height = 1280; }
      else if (values.aspectRatio === "1:1") { width = 1024; height = 1024; }
      else if (values.aspectRatio === "21:9") { width = 1280; height = 544; }
      else if (values.aspectRatio === "32:9") { width = 1920; height = 540; }
      if (values.resolution === "1080p") {
        width = Math.min(Math.round(width * 1.5), 1920);
        height = Math.min(Math.round(height * 1.5), 1080);
      }
      if (values.resolution === "4k" || values.resolution === "4K") {
        width = Math.round(width * 2);
        height = Math.round(height * 2);
      }
      if (values.resolution === "720p" && width > 1280) {
        width = Math.round(width * 0.75);
        height = Math.round(height * 0.75);
      }

      const selectedModel = MODELS.find((m) => m.id === values.model) || MODELS[1];

      const res = await fetch("/api/comfyui/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "text-to-video",
          prompt: values.prompt,
          images: uploadedImages,
          references: uploadedReferences,
          width,
          height,
          steps: values.proMode ? 20 : 8,
          cfg: 1,
          unetVariant: selectedModel.unetVariant,
          format: values.format,
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
      const errorMessage = error instanceof Error ? error.message : "Failed to generate. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const selectedModelDescription = MODELS.find(
    (m) => m.id === form.watch("model")
  )?.description;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Generate Videos with Multi-Reference Consistency
            </CardTitle>
            <CardDescription>
              Upload one or more characters, objects, or scenes as references, describe the content you want to generate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
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

                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the video you want to generate based on your references..."
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ref-proMode"
                    checked={form.watch("proMode")}
                    onCheckedChange={(checked) => form.setValue("proMode", checked)}
                  />
                  <Label htmlFor="ref-proMode">Quality Mode (more steps)</Label>
                  <Badge variant="secondary">Higher quality = slower</Badge>
                </div>

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
                            {MODELS.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                <div className="flex flex-col gap-0.5 pr-2">
                                  <div className="text-sm font-medium">{m.name}</div>
                                  <div className="text-[11px] text-muted-foreground">{m.tagline}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedModelDescription && (
                          <FormDescription>{selectedModelDescription}</FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <SelectItem value="720p">720p (HD)</SelectItem>
                            <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                            <SelectItem value="4k">4K (Ultra HD)</SelectItem>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MP4">MP4 (Recommended)</SelectItem>
                            <SelectItem value="MOV">MOV (ProRes)</SelectItem>
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
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
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
                      const ext = form.getValues("format")?.toLowerCase() || "mp4";
                      link.download = `reference-video-${Date.now()}.${ext}`;
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
