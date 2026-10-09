"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Clapperboard, ImageIcon, Map, CreditCard, Film, Shield, Home, Newspaper } from "lucide-react";
import { getAdminEmailsForClient } from "@/lib/admin";

const baseNavItems = [
  { href: "/", label: "Home", icon: <Home /> },
  { href: "/studio", label: "Studio", icon: <LayoutDashboard /> },
  { href: "/studio/video-generator", label: "Video Generator", icon: <Clapperboard /> },
  { href: "/studio/video-editor", label: "Video Editor", icon: <Film /> },
  { href: "/studio/image-editor", label: "Image Editor", icon: <ImageIcon /> },
  { href: "/studio/map-animation", label: "Map Animation", icon: <Map /> },
  { href: "/newspaper-spin", label: "Newspaper Animator", icon: <Newspaper /> },
  { href: "/studio/billing", label: "Billing", icon: <CreditCard /> },
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

  // Rewrite internal path to public path for active state comparison
  // (middleware rewrites /studio → /dashboard internally so we might get either)
  const publicPathname = pathname.startsWith('/dashboard')
    ? `/studio${pathname.slice('/dashboard'.length)}`
    : pathname;

  return (
    <SidebarMenu className="p-2">
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={publicPathname === item.href || publicPathname.startsWith(item.href + '/')}
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
