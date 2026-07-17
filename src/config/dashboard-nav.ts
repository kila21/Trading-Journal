import { CalendarNavIcon, BarChartNavIcon, ListIcon } from "@/components/dashboard/icons";

export const dashboardNavLinks = [
  { key: "dashboard", href: "/dashboard", icon: CalendarNavIcon },
  { key: "trades", href: "/dashboard/trades", icon: ListIcon },
  { key: "analytics", href: "/dashboard/analytics", icon: BarChartNavIcon },
] as const;
