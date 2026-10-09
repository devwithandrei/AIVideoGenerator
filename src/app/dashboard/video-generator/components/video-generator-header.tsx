"use client";

import { Button } from "@/components/ui/button";

interface VideoGeneratorHeaderProps {
  credits?: number;
  isProcessing?: boolean;
}

export function VideoGeneratorHeader({ credits = 40, isProcessing = false }: VideoGeneratorHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left side - Processing status */}
      <div className="flex items-center gap-4">
        {isProcessing && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Processing</span>
          </div>
        )}
      </div>

      {/* Right side - Empty for now, can be used for future features */}
      <div className="flex items-center gap-4">
        {/* Future features can be added here */}
      </div>
    </div>
  );
} 