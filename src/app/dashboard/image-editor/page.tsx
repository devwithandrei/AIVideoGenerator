import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FileUp, Crop, Scaling, Wand2, Download } from "lucide-react";

export default function ImageEditorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">AI Image Editor & Generator</h1>
        <p className="text-muted-foreground">
          Create new images from text or edit your own with AI-powered tools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
        <div className="space-y-4">
          <Card className="aspect-video w-full border-dashed flex items-center justify-center">
             <Image
                src="https://placehold.co/1280x720.png"
                width={1280}
                height={720}
                alt="Image placeholder"
                data-ai-hint="abstract art"
                className="w-full h-full object-contain rounded-lg bg-muted"
              />
          </Card>
          <Card>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm font-semibold">Generate New Image</p>
               <div className="flex w-full items-center space-x-2">
                <Input type="text" placeholder="e.g., A cat wearing a spacesuit, photorealistic" />
                <Button type="submit" variant="secondary">
                  <Wand2 className="mr-2 h-4 w-4" /> Generate
                </Button>
              </div>
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
    </div>
  );
}
