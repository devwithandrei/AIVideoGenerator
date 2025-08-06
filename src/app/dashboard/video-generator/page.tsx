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
      <div className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">AI Video Generator</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Create stunning videos using AI with multiple generation methods.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">Pro Mode</span>
              <span className="sm:hidden">Pro</span>
            </Badge>
            <Badge variant="outline" className="text-xs sm:text-sm">3 trials remaining</Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12">
            <TabsTrigger value="reference" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Reference to Video</span>
              <span className="sm:hidden">Reference</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Image className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Image to Video</span>
              <span className="sm:hidden">Image</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Text to Video</span>
              <span className="sm:hidden">Text</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 sm:mt-6">
            <TabsContent value="reference" className="space-y-4 sm:space-y-6">
              <ReferenceToVideoTab />
            </TabsContent>

            <TabsContent value="image" className="space-y-4 sm:space-y-6">
              <ImageToVideoTab />
            </TabsContent>

            <TabsContent value="text" className="space-y-4 sm:space-y-6">
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
