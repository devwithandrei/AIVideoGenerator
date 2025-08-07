"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut, useUser, useClerk } from '@clerk/nextjs';
import { Gem, User, Download, Share2, Settings, LogOut, Bell, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Header() {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith('/dashboard');
    const isAdmin = pathname.startsWith('/admin');
    const hasSidebar = isDashboard || isAdmin;
    const { user } = useUser();
    const { signOut } = useClerk();

    const handleSignOut = async () => {
        try {
            await signOut();
            // Redirect to homepage after sign out
            window.location.href = '/';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <header className="px-4 lg:px-6 h-14 flex items-center bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b shrink-0">
            <div className="flex items-center">
              {!hasSidebar && (
                <Link href="/" className="flex items-center gap-2" prefetch={false}>
                  <Gem className="h-8 w-8 text-primary" />
                  <h1 className="text-xl font-bold font-headline text-sidebar-foreground">MediaForge AI</h1>
                </Link>
              )}
            </div>
            <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                <Link href="/#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                    Features
                </Link>
                <Link href="/pricing" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                    Pricing
                </Link>
                
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
                  40
                </Badge>

                {/* Subscribe Button */}
                <Button variant="outline" size="sm">
                  Subscribe
                </Button>
                
                <SignedOut>
                    <SignInButton mode="modal">
                        <Button variant="ghost" size="sm">
                            Sign In
                        </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                        <Button style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                            Sign Up
                        </Button>
                    </SignUpButton>
                </SignedOut>
                
                <SignedIn>
                    {/* Notification Bell - Only shown when authenticated */}
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-4 w-4" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.emailAddresses?.[0]?.emailAddress}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Downloads</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Share2 className="mr-2 h-4 w-4" />
                                <span>Share</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SignedIn>
            </nav>
        </header>
    )
}
