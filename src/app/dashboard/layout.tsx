import React from "react";
import Link from "next/link";
import { Sidebar, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { Gem } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2" prefetch={false}>
              <Gem className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden">MediaForge AI</h1>
            </Link>
          </div>
          <DashboardNav />
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center h-14 px-4 sm:px-8">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center w-full justify-end">
              {/* UserNav removed since authentication is disabled */}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-8">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
