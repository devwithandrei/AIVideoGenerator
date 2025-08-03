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
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { generateMapAnimation } from "@/ai/flows/generate-map-animation";

const formSchema = z.object({
  locationDetails: z.string().min(5, {
    message: "Location details must be at least 5 characters.",
  }),
});

export function MapAnimationClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationDetails: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setVideoUrl("");
    try {
      const result = await generateMapAnimation({ locationDetails: values.locationDetails });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="locationDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location or Route Details</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., A road trip from Paris to Rome"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
  );
}
