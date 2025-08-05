"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  User, 
  Zap,
  Download,
  Share2,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

      {/* Right side - User controls */}
      <div className="flex items-center gap-4">
        {/* API Link */}
        <Button variant="ghost" size="sm">
          API
        </Button>

        {/* Earn Credits */}
        <Button variant="ghost" size="sm">
          Earn Credits
        </Button>

        {/* Credits Display */}
        <Badge variant="outline" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {credits}
        </Badge>

        {/* Subscribe Button */}
        <Button variant="outline" size="sm">
          Subscribe
        </Button>

        {/* Notification Bell */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Downloads
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 