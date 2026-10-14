"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut, useUser, useClerk } from '@clerk/nextjs';
import { User, Download, Share2, Settings, LogOut, PanelLeft } from "lucide-react";
import { CreditDisplay } from "@/components/credit-display";
import { NotificationBell } from "@/components/notification-bell";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";

export function Header() {
    const pathname = usePathname();
    const isStudio = pathname.startsWith('/studio') || pathname.startsWith('/dashboard') || pathname.startsWith('/newspaper-spin');
    const isAdmin = pathname.startsWith('/admin');
    const hasSidebar = isStudio || isAdmin;
    const isHome = pathname === '/' || pathname === '';
    const { user } = useUser();
    const { signOut } = useClerk();
    const { toggleSidebar } = useSidebar();

    const handleSignOut = async () => {
        try {
            await signOut();
            // Redirect to homepage after sign out
            window.location.href = '/';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const renderDropdownContent = () => (
        <>
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
            <DropdownMenuItem asChild>
                <Link href="/#features" prefetch={false}>Features</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/pricing" prefetch={false}>Pricing</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/api-docs" prefetch={false}>API</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/earn-credits" prefetch={false}>Earn Credits</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <span className="w-full text-center text-sm font-medium">Subscribe</span>
            </DropdownMenuItem>
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
                <span>Log out</span>
            </DropdownMenuItem>
        </>
    );

    const renderUserActions = () => (
        <>
            <SignedIn>
                <CreditDisplay />
            </SignedIn>

            <SignedOut>
                <SignInButton mode="modal">
                    <Button variant="ghost" size="sm" className={!hasSidebar ? 'text-white/90 hover:text-white hover:bg-white/10' : ''}>
                        Sign In
                    </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                    <Button
                        className={!hasSidebar ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                        style={!hasSidebar ? {} : { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground)' }}
                    >
                        Sign Up
                    </Button>
                </SignUpButton>
            </SignedOut>

            <SignedIn>
                <NotificationBell />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={`relative h-8 w-8 rounded-full ${!hasSidebar ? 'hover:bg-white/10' : ''}`}>
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        {renderDropdownContent()}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SignedIn>
        </>
    );

    return (
        <header
            className={
                hasSidebar
                    ? "h-14 bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b shrink-0"
                    : "h-14 sticky top-0 z-50 shrink-0"
            }
            style={
                !hasSidebar
                    ? {
                          background: isHome ? "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)" : "rgba(255,255,255,0.02)",
                          backdropFilter: isHome ? "blur(4px)" : "blur(12px)",
                      }
                    : undefined
            }
        >
          <div className="w-full h-full px-3 sm:px-6 md:px-8 lg:px-10 xl:px-14 flex items-center justify-between max-w-none gap-2">
            {/* LEFT: logo + sidebar trigger (studio/admin, mobile) */}
            <div className="flex items-center gap-2 min-w-0">
              {hasSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:hidden shrink-0"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                >
                  <PanelLeft className="h-5 w-5" />
                </Button>
              )}
              <Link href="/" className="flex items-center gap-2 shrink-0" prefetch={false}>
                <Image
                  src="/images/logo.png"
                  alt="AISNV Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              </Link>
            </div>

            {/* CENTER/RIGHT: desktop nav */}
            <nav className="hidden md:flex gap-4 lg:gap-6 items-center">
                {renderUserActions()}
            </nav>

            {/* MOBILE: compact actions */}
            <div className="flex md:hidden items-center gap-1">
                <SignedIn>
                    <CreditDisplay />
                    <NotificationBell />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={`relative h-8 w-8 rounded-full shrink-0 ${!hasSidebar ? 'hover:bg-white/10' : ''}`}>
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                        {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            {renderDropdownContent()}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <Button variant="ghost" size="sm" className={!hasSidebar ? 'text-white/90 hover:text-white hover:bg-white/10' : ''}>
                            Sign In
                        </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                        <Button
                            size="sm"
                            className={!hasSidebar ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                            style={!hasSidebar ? {} : { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground)' }}
                        >
                            Sign Up
                        </Button>
                    </SignUpButton>
                </SignedOut>
            </div>
          </div>
        </header>
    );
}
