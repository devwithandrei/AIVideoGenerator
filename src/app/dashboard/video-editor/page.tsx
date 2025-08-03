"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileUp, Scissors, Text, Music, Crop, Download, Film } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function VideoEditorPage() {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoFileName(file.name);
      toast({
        title: "Video Uploaded",
        description: `${file.name} has been loaded.`,
      });
    } else {
       toast({
        title: "Invalid File",
        description: "Please select a valid video file.",
        variant: "destructive",
      });
    }
     // Reset file input to allow uploading the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDownloadClick = () => {
     if (!videoUrl) {
       toast({
        title: "No Video to Download",
        description: "Please upload a video first.",
        variant: "destructive",
      });
      return;
    }
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = videoFileName || "edited-video.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
        title: "Download Started",
        description: "Your video is being downloaded.",
      });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Video Editor</h1>
        <p className="text-muted-foreground">
          Upload and edit your videos with our simple yet powerful tools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
        <div className="space-y-4">
          <Card className="aspect-video w-full border-dashed flex items-center justify-center bg-muted/50">
             {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Film className="h-16 w-16 mb-4" />
                    <p>Upload a video to start editing.</p>
                </div>
             )}
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">Timeline</div>
              <div className="h-24 mt-2 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                [Timeline controls will be here]
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="video/*"
          />
          <Button className="w-full" variant="outline" onClick={handleUploadClick}>
            <FileUp className="mr-2 h-4 w-4" /> Upload Video
          </Button>
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">Tools</p>
              <Separator />
              <Button className="w-full justify-start" variant="ghost" disabled>
                <Scissors className="mr-2 h-4 w-4" /> Cut / Trim
              </Button>
              <Button className="w-full justify-start" variant="ghost" disabled>
                <Crop className="mr-2 h-4 w-4" /> Crop
              </Button>
              <Button className="w-full justify-start" variant="ghost" disabled>
                <Text className="mr-2 h-4 w-4" /> Add Text
              </Button>
              <Button className="w-full justify-start" variant="ghost" disabled>
                <Music className="mr-2 h-4 w-4" /> Add Music
              </Button>
            </CardContent>
          </Card>
          
           <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">Export</p>
              <Separator />
               <Button className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}} onClick={handleDownloadClick}>
                 <Download className="mr-2 h-4 w-4" /> Export Video
               </Button>
               <div className="text-xs text-muted-foreground text-center pt-2">MP4, MOV, WebM</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
