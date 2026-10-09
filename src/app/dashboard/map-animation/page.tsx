import { MapAnimationClient } from "./map-animation-client";

export default function MapAnimationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Map Animation Generator</h1>
        <p className="text-muted-foreground">
          Enter a location or route to create a beautiful animated map video.
        </p>
      </div>
      <MapAnimationClient />
    </div>
  );
}
