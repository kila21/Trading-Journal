import { CalendarNavIcon, BarChartNavIcon } from "@/components/dashboard/icons";

export const dashboardNavLinks = [
  { key: "dashboard", href: "/dashboard", icon: CalendarNavIcon },
  { key: "analytics", href: "/dashboard/analytics", icon: BarChartNavIcon },
] as const;
