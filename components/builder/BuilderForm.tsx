"use client";
import { useEffect, useState } from "react";

type Values = {
  partyA_name: string; partyA_addr: string; partyB_name: string; partyB_addr: string; jurisdiction: string;
};

export default function BuilderForm({
  values, onChange, onGenerate, template,
}: { values: Values; onChange: (v: Values) => void; onGenerate: (md: string) => void; template: any | null }) {
  // ... your existing BuilderForm code ...
  return <div>/* Form UI */</div>;
}
