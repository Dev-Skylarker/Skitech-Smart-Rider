import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Package, Shield, Home, ShoppingBag, Flag } from "lucide-react";
import logoImg from "@/assets/logo.png";

const items = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Riders", url: "/admin/riders", icon: Users },
  { title: "Orders", url: "/admin/orders", icon: Package },
  { title: "Shop", url: "/admin/shop", icon: ShoppingBag },
  { title: "Roles", url: "/admin/roles", icon: Shield },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-3 py-3">
        <Link to="/admin" className="flex items-center gap-2 min-w-0">
          <img
            src={logoImg}
            alt="Logo"
            className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
          <span className="font-black text-xs leading-tight overflow-hidden whitespace-nowrap">
            Skitech <span className="text-primary">Admin</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === "/admin" ? path === "/admin" : path.startsWith(item.url)}
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Back to App</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
