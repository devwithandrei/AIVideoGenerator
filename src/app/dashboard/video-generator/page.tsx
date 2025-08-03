import { VideoGeneratorClient } from "./video-generator-client";

export default function VideoGeneratorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">AI Video Generator</h1>
        <p className="text-muted-foreground">
          Describe the video you want to create, and our AI will bring it to life.
        </p>
      </div>
      <VideoGeneratorClient />
    </div>
  );
}
