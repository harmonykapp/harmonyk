"use client";

type Values = {
  partyA_name: string; partyA_addr: string; partyB_name: string; partyB_addr: string; jurisdiction: string;
};

export default function BuilderForm({
  values, onChangeAction, onGenerateAction, template,
}: { values: Values; onChangeAction: (v: Values) => void; onGenerateAction: (md: string) => void; template: any | null }) {
  // ... your existing BuilderForm code ...
  return <div>/* Form UI */</div>;
}
