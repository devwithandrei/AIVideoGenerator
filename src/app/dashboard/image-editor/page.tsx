import { ImageGeneratorClient } from "./image-generator-client";

export default function ImageEditorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">AI Image Editor & Generator</h1>
        <p className="text-muted-foreground">
          Create new images from text or edit your own with AI-powered tools.
        </p>
      </div>

     <ImageGeneratorClient />
    </div>
  );
}
