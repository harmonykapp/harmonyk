"use client"

import { useState } from "react";
import BuilderForm from "./BuilderForm";
import LivePreview from "./LivePreview";
import TemplatePicker from "./TemplatePicker";

type FormValues = {
  partyA_name: string
  partyA_addr: string
  partyB_name: string
  partyB_addr: string
  jurisdiction: string
}

export default function BuilderClient() {
  const [template, setTemplate] = useState<any | null>(null)
  const [formValues, setFormValues] = useState<FormValues>({
    partyA_name: "",
    partyA_addr: "",
    partyB_name: "",
    partyB_addr: "",
    jurisdiction: "usa",
  })
  const [docMarkdown, setDocMarkdown] = useState<string>("")

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Builder</h1>
        <div className="text-xs opacity-70">/builder</div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: Template search + tags + favorites */}
        <aside className="col-span-12 lg:col-span-3">
          <TemplatePicker selectedTemplate={template} onSelect={setTemplate} />
        </aside>

        {/* MIDDLE: Parties/Jurisdiction + Save */}
        <section className="col-span-12 lg:col-span-4">
          <BuilderForm
            values={formValues}
            onChangeAction={setFormValues}
            onGenerateAction={(md: string) => setDocMarkdown(md)}
            template={template}
          />
        </section>

        {/* RIGHT: Live Markdown Preview */}
        <section className="col-span-12 lg:col-span-5">
          <LivePreview markdown={docMarkdown} onPreviewEventAction={() => { }} />
        </section>
      </div>
    </div>
  )
}
