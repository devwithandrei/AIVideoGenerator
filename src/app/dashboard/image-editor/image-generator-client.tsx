"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FileUp, Crop, Scaling, Wand2, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { generateImageFromText } from "@/ai/flows/generate-image-from-text";

const formSchema = z.object({
  prompt: z.string().min(5, {
    message: "Prompt must be at least 5 characters.",
  }),
});

export function ImageGeneratorClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setImageUrl("");
    setUploadedFileName("");
    try {
      const result = await generateImageFromText({ prompt: values.prompt });
      setImageUrl(result.imageDataUri);
      toast({
        title: "Success!",
        description: "Your image has been generated.",
      });
    } catch (error) {
      console.error("Image generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        setUploadedFileName(file.name);
        toast({
          title: "Image Uploaded",
          description: `${file.name} has been loaded into the editor.`,
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow uploading the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDownloadClick = () => {
    if (!imageUrl) {
       toast({
        title: "No Image to Download",
        description: "Please generate or upload an image first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simple download approach - works with data URIs
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = uploadedFileName || `generated-image-${Date.now()}.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your image is being downloaded.",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
      <div className="space-y-4">
        <Card className="aspect-video w-full border-dashed flex items-center justify-center bg-slate-800/50 border-slate-600">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating your image...</p>
            </div>
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              width={1280}
              height={720}
              alt="Generated or uploaded image"
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ImageIcon className="h-16 w-16 mb-4 text-slate-400" />
              <p>Your generated image will appear here.</p>
            </div>
          )}
        </Card>
        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm font-semibold">Generate New Image</p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-start space-x-2">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input placeholder="e.g., A cat wearing a spacesuit, photorealistic" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="secondary" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
        />
        <Button className="w-full" variant="outline" onClick={handleUploadClick}>
          <FileUp className="mr-2 h-4 w-4" /> Upload Image
        </Button>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold">Editing Tools</p>
            <Separator />
            <Button className="w-full justify-start" variant="ghost" disabled>
              <Crop className="mr-2 h-4 w-4" /> Crop
            </Button>
            <Button className="w-full justify-start" variant="ghost" disabled>
              <Scaling className="mr-2 h-4 w-4" /> Resize
            </Button>
            <Button className="w-full justify-start" variant="ghost" disabled>
              <Wand2 className="mr-2 h-4 w-4" /> Enhance
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold">Download</p>
            <Separator />
            <Button className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} onClick={handleDownloadClick} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" /> Download Image
            </Button>
            <div className="text-xs text-muted-foreground text-center pt-2">JPG, PNG, WebP</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
