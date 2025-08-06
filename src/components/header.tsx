"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export function Header() {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith('/dashboard');
    const { state } = useSidebar();

    return (
        <header className="px-4 lg:px-6 h-14 flex items-center bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b shrink-0">
            <div className="flex items-center">
              {isDashboard && state === "collapsed" && <SidebarTrigger className="mr-4" />}
            </div>
            <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                <Link href="/#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                    Features
                </Link>
                <Link href="/dashboard/billing" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                    Pricing
                </Link>
                
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
                    <UserButton 
                        appearance={{
                            elements: {
                                avatarBox: "h-8 w-8",
                                userButtonPopoverCard: "bg-background border border-border",
                                userButtonPopoverActionButton: "hover:bg-muted",
                                userButtonPopoverActionButtonText: "text-foreground"
                            }
                        }}
                    />
                </SignedIn>
            </nav>
        </header>
    )
}
