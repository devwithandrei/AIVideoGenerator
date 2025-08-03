"use client";

import { useState } from "react";
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
  const [imageUrl, setImageUrl] = useState("https://placehold.co/1280x720.png");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setImageUrl("");
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


  return (
     <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
        <div className="space-y-4">
          <Card className="aspect-video w-full border-dashed flex items-center justify-center bg-muted/50">
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
                    alt="Generated image"
                    className="w-full h-full object-contain rounded-lg"
                  />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-4" />
                  <p>Your generated image will appear here.</p>
                </div>
              )
             }
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
          <Button className="w-full" variant="outline">
            <FileUp className="mr-2 h-4 w-4" /> Upload Image
          </Button>
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">Editing Tools</p>
              <Separator />
              <Button className="w-full justify-start" variant="ghost">
                <Crop className="mr-2 h-4 w-4" /> Crop
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <Scaling className="mr-2 h-4 w-4" /> Resize
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <Wand2 className="mr-2 h-4 w-4" /> Enhance
              </Button>
            </CardContent>
          </Card>
          
           <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">Download</p>
              <Separator />
               <Button className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                 <Download className="mr-2 h-4 w-4" /> Download Image
               </Button>
               <div className="text-xs text-muted-foreground text-center pt-2">JPG, PNG, WebP</div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
