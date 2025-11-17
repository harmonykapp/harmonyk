"use client";

export type FormValues = {
  title: string;
  facts: string;
};

type Props = {
  templateName: string;
  values: FormValues;
  onChange: (values: FormValues) => void;
  onGenerateAction: (values: FormValues) => Promise<void> | void;
  isGenerating?: boolean;
};

export default function BuilderForm({
  templateName,
  values,
  onChange,
  onGenerateAction,
  isGenerating = false,
}: Props) {
  const handleChange = (field: keyof FormValues, value: string) => {
    onChange({ ...values, [field]: value });
  };

  const handleClick = async () => {
    if (isGenerating) return;
    await onGenerateAction(values);
  };

  return (
    <div className="builder-form">
      <p className="text-secondary">
        Selected template: <strong>{templateName}</strong>
      </p>

      <label className="form-field">
        <span>Document title</span>
        <input
          value={values.title}
          onChange={(event) => handleChange("title", event.target.value)}
          placeholder={`${templateName} — v1`}
        />
      </label>

      <label className="form-field">
        <span>Facts / key terms</span>
        <textarea
          value={values.facts}
          onChange={(event) => handleChange("facts", event.target.value)}
          placeholder="Party names, dates, amounts, key clauses…"
        />
      </label>

      <button type="button" onClick={handleClick} disabled={isGenerating} className="btn btn-primary">
        {isGenerating ? "Generating…" : "Generate"}
      </button>
    </div>
  );
}
