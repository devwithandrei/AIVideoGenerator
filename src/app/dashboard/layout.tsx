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
            <div className="flex items-center justify-end w-full">
              <SidebarTrigger className="h-6 w-6" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <DashboardNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthWrapper>
  );
}
