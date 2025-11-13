// Global, literal-typed list of app routes (SSOT for navigation).
// Import the type with: import type { AppRoute } from "@/types/routes";

export type AppRoute =
    | "/"
    | "/workbench"
    | "/builder"
    | "/builder/draft"
    | "/vault"
    | `/share/${string}`        // dynamic
    | "/signatures"
    | "/insights"
    | "/integrations"
    | "/calendar"
    | "/tasks"
    | "/settings"
    | "/billing";
