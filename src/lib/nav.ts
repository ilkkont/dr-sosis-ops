import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarRange,
  Truck,
  Warehouse,
  Boxes,
  UtensilsCrossed,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/events", label: "Etkinlikler", icon: CalendarRange },
  { href: "/warehouse", label: "Ana Depo", icon: Warehouse },
  { href: "/caravans", label: "Karavanlar", icon: Truck },
  { href: "/inventory", label: "Stok Kalemleri", icon: Boxes },
  { href: "/menu-products", label: "Menü Ürünleri", icon: UtensilsCrossed },
  { href: "/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];
