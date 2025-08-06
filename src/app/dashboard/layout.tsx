import React from "react";
import Link from "next/link";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { Gem } from "lucide-react";
import { Header } from "@/components/header";
import { AuthWrapper } from "@/components/auth-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center justify-between w-full">
              <Link href="/" className="flex items-center gap-2" prefetch={false}>
                <Gem className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden">MediaForge AI</h1>
              </Link>
              <SidebarTrigger className="h-6 w-6" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <DashboardNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthWrapper>
  );
}
