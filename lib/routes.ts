import type { AppRoute } from "@/types/routes";

// Canonical list (non-dynamic) for menus / sitemaps:
export const ROUTES: AppRoute[] = [
    "/",
    "/workbench",
    "/builder",
    "/builder/draft",
    "/vault",
    "/signatures",
    "/insights",
    "/integrations",
    "/calendar",
    "/tasks",
    "/settings",
    "/billing",
];

// Type guard for dynamic paths (e.g., /share/:id)
export function isAppRoute(path: string): path is AppRoute {
    if (ROUTES.includes(path as AppRoute)) return true;
    if (path.startsWith("/share/") && path.length > "/share/".length) return true;
    return false;
}

