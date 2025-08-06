"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Clapperboard, ImageIcon, Map, CreditCard, Film, Shield } from "lucide-react";
import { getAdminEmailsForClient } from "@/lib/admin";

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/dashboard/video-generator", label: "AI Video Generator", icon: <Clapperboard /> },
  { href: "/dashboard/video-editor", label: "Video Editor", icon: <Film /> },
  { href: "/dashboard/image-editor", label: "Image Editor", icon: <ImageIcon /> },
  { href: "/dashboard/map-animation", label: "Map Animation", icon: <Map /> },
  { href: "/dashboard/billing", label: "Billing", icon: <CreditCard /> },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Panel", icon: <Shield /> },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useUser();
  
  // Check if user is admin using environment variable
  const adminEmails = getAdminEmailsForClient();
  const isAdmin = user?.publicMetadata?.role === 'admin' || 
                  (user?.emailAddresses?.[0]?.emailAddress && 
                   adminEmails.includes(user.emailAddresses[0].emailAddress));
  
  // Combine base nav items with admin items if user is admin
  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  return (
    <SidebarMenu className="p-2">
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <a href={item.href}>
              {item.icon}
              <span>{item.label}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
