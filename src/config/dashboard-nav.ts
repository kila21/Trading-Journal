import { CalendarNavIcon, BarChartNavIcon, ListIcon, PlaybookNavIcon } from "@/components/dashboard/icons";

export const dashboardNavLinks = [
  { key: "dashboard", href: "/dashboard", icon: CalendarNavIcon },
  { key: "trades", href: "/dashboard/trades", icon: ListIcon },
  { key: "playbook", href: "/dashboard/playbook", icon: PlaybookNavIcon },
  { key: "analytics", href: "/dashboard/analytics", icon: BarChartNavIcon },
] as const;
