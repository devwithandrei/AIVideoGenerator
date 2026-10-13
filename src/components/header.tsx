"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut, useUser, useClerk } from '@clerk/nextjs';
import { User, Download, Share2, Settings, LogOut, Menu, PanelLeft, X } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { useState } from "react";

export function Header() {
    const pathname = usePathname();
    const isStudio = pathname.startsWith('/studio') || pathname.startsWith('/dashboard') || pathname.startsWith('/newspaper-spin');
    const isAdmin = pathname.startsWith('/admin');
    const hasSidebar = isStudio || isAdmin;
    const isHome = pathname === '/' || pathname === '';
    const { user } = useUser();
    const { signOut } = useClerk();
    const { toggleSidebar, isMobile: isMobileSidebar } = useSidebar();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
            // Redirect to homepage after sign out
            window.location.href = '/';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const navLinkClass = (extra = "") =>
        `text-sm font-medium hover:underline underline-offset-4 ${!hasSidebar ? 'text-white/90 hover:text-white' : ''} ${extra}`;

    const ghostBtnClass = `text-sm font-medium ${!hasSidebar ? 'text-white/90 hover:text-white hover:bg-white/10' : ''}`;

    const renderNavLinks = (inSheet = false) => (
        inSheet ? (
            <div className="flex flex-col gap-1">
                <Link href="/#features" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                    Features
                </Link>
                <Link href="/pricing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                    Pricing
                </Link>
                <Link href="/api-docs" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                        API
                    </div>
                </Link>
                <Link href="/earn-credits" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                        Earn Credits
                    </div>
                </Link>
            </div>
        ) : (
            <>
                <Link href="/#features" className={navLinkClass()} prefetch={false}>
                    Features
                </Link>
                <Link href="/pricing" className={navLinkClass()} prefetch={false}>
                    Pricing
                </Link>
                <Link href="/api-docs" prefetch={false}>
                    <Button variant="ghost" size="sm" className={ghostBtnClass}>
                        API
                    </Button>
                </Link>
                <Link href="/earn-credits" prefetch={false} className={navLinkClass()}>
                    Earn Credits
                </Link>
            </>
        )
    );

    const renderUserActions = () => (
        <>
            <SignedIn>
                <CreditDisplay />
            </SignedIn>

            <Button variant="outline" size="sm" className={!hasSidebar ? 'text-white border-white/30 hover:bg-white/10 hover:text-white' : ''}>
                Subscribe
            </Button>

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
                            <span>Log out</span>
                        </DropdownMenuItem>
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
            {/* LEFT: logo + sidebar trigger (studio, mobile) */}
            <div className="flex items-center gap-2 min-w-0">
              {isStudio && (
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
                {renderNavLinks()}
                {renderUserActions()}
            </nav>

            {/* MOBILE: compact actions + menu button */}
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
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <Button variant="ghost" size="sm" className={!hasSidebar ? 'text-white/90 hover:text-white hover:bg-white/10' : ''}>
                            Sign In
                        </Button>
                    </SignInButton>
                </SignedOut>

                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className={`h-9 w-9 shrink-0 ${!hasSidebar ? 'text-white hover:bg-white/10' : ''}`} aria-label="Open menu">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 [&>button]:hidden">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between px-5 h-14 border-b shrink-0">
                                <span className="text-base font-semibold tracking-tight">Menu</span>
                                <SheetClose asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent" aria-label="Close menu">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </SheetClose>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {renderNavLinks(true)}
                                <div className="pt-3 space-y-2 border-t">
                                    <Button variant="outline" size="sm" className="w-full justify-center">
                                        Subscribe
                                    </Button>
                                    <SignedOut>
                                        <SignUpButton mode="modal">
                                            <Button
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                            >
                                                Sign Up
                                            </Button>
                                        </SignUpButton>
                                    </SignedOut>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
          </div>
        </header>
    );
}
