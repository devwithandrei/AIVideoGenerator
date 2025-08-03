"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Header() {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith('/dashboard');

    return (
        <header className="px-4 lg:px-6 h-14 flex items-center bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b shrink-0">
            <div className="flex items-center">
              {isDashboard && <SidebarTrigger className="mr-4" />}
              <Link href="/" className="flex items-center justify-center" prefetch={false}>
                  <Logo />
              </Link>
            </div>
            <nav className="ml-auto flex gap-4 sm:gap-6">
                <Link href="/#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                    Features
                </Link>
                <Link href="/dashboard/billing" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                    Pricing
                </Link>
                <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                    <Link href="/dashboard" prefetch={false}>
                        Get Started
                    </Link>
                </Button>
            </nav>
        </header>
    )
}
