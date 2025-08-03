import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileUp, Scissors, Text, Music, Crop, Download } from "lucide-react";

export default function VideoEditorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Video Editor</h1>
        <p className="text-muted-foreground">
          Edit your videos with our simple yet powerful tools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
        <div className="space-y-4">
          <Card className="aspect-video w-full border-dashed flex items-center justify-center">
            <video
              src="https://placehold.co/1920x1080.mp4"
              controls
              className="w-full h-full object-contain rounded-lg bg-muted"
            >
               Your browser does not support the video tag.
            </video>
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
          <Button className="w-full" variant="outline">
            <FileUp className="mr-2 h-4 w-4" /> Upload Video
          </Button>
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">Tools</p>
              <Separator />
              <Button className="w-full justify-start" variant="ghost">
                <Scissors className="mr-2 h-4 w-4" /> Cut / Trim
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <Crop className="mr-2 h-4 w-4" /> Crop
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <Text className="mr-2 h-4 w-4" /> Add Text
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <Music className="mr-2 h-4 w-4" /> Add Music
              </Button>
            </CardContent>
          </Card>
          
           <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">Export</p>
              <Separator />
               <Button className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
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
