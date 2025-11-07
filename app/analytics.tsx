"use client";
import { useEffect } from "react";
import { initPosthog } from "@/lib/posthog-client";

export default function Analytics() {
  useEffect(() => { initPosthog(); }, []);
  return null;
}
