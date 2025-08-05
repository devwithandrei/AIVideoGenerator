"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Image, 
  FileText, 
  Upload, 
  Video,
  Settings,
  Zap
} from "lucide-react";
import { VideoGeneratorHeader } from "./components/video-generator-header";

export default function VideoGeneratorPage() {
  const [activeTab, setActiveTab] = useState("reference");

  return (
    <div className="h-screen flex flex-col">
      {/* Top Header */}
      <VideoGeneratorHeader credits={40} />
      
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">AI Video Generator</h1>
            <p className="text-muted-foreground">
              Create stunning videos using AI with multiple generation methods.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Pro Mode
            </Badge>
            <Badge variant="outline">3 trials remaining</Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reference" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Reference to Video
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Image to Video
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Text to Video
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="reference" className="space-y-6">
            <ReferenceToVideoTab />
          </TabsContent>

          <TabsContent value="image" className="space-y-6">
            <ImageToVideoTab />
          </TabsContent>

          <TabsContent value="text" className="space-y-6">
            <TextToVideoTab />
          </TabsContent>
        </div>
      </Tabs>
      </div>
    </div>
  );
}

// Import the tab components
import { ReferenceToVideoTab } from "./components/reference-to-video-tab";
import { ImageToVideoTab } from "./components/image-to-video-tab";
import { TextToVideoTab } from "./components/text-to-video-tab";
