import type React from "react";
import SidebarNav from "@/components/navigation/SidebarNav";
import TopBar from "@/components/navigation/TopBar";
import SidebarBrand from "@/components/navigation/SidebarBrand";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <SidebarBrand />
        <SidebarNav />
      </aside>
      <div className="app-main">
        <TopBar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
