"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

export default function SidebarBrand() {
  const { theme, isReady } = useTheme();
  const isDark = isReady ? theme === "dark" : false;
  const logoSrc = isDark ? "/ui/logo_dark_horizontal.png" : "/ui/logo_light_horizontal.png";

  return (
    <Link href="/" className="sidebar-brand" aria-label="Monolyth home">
      <Image src={logoSrc} alt="Monolyth" width={150} height={36} priority />
    </Link>
  );
}

