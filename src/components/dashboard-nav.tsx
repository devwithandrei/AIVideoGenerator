"use client";

import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Clapperboard, ImageIcon, Map, CreditCard, Settings, Film } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/dashboard/video-generator", label: "AI Video Generator", icon: <Clapperboard /> },
  { href: "/dashboard/video-editor", label: "Video Editor", icon: <Film /> },
  { href: "/dashboard/image-editor", label: "Image Editor", icon: <ImageIcon /> },
  { href: "/dashboard/map-animation", label: "Map Animation", icon: <Map /> },
  { href: "/dashboard/billing", label: "Billing", icon: <CreditCard /> },
];

export function DashboardNav() {
  const pathname = usePathname();

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
