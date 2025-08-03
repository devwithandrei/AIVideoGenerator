import React from "react";
import Link from "next/link";
import { Sidebar } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { Gem } from "lucide-react";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
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
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
