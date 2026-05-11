// Navigation item type used by sidebar and mobile nav
export interface NavItem {
    title: string;
    href: string;
    icon: string;
    badge?: string;
}

// Dashboard stat card type
export interface StatCard {
    title: string;
    value: string | number;
    icon: string;
    description?: string;
    trend?: "up" | "down" | "neutral";
}
