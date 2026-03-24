
import { TEMPLATES } from "@/lib/templates";

type Props = { onSelect: (templateId: string) => void };

export default function TemplatePicker({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      <h1 className="text-2xl font-medium">Pick a template</h1>

      <div className="grid grid-cols-2 gap-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="min-w-[200px] rounded-xl border border-gray-300 bg-gray-50 p-6 text-left transition-colors duration-150 hover:border-gray-500"
          >
            <div className="text-base font-medium">{t.label}</div>

            <div className="mt-1 text-sm text-gray-600">
              {t.description}
            </div>

            <div className="mt-2 text-xs text-gray-400">
              {t.files.join("  ·  ")}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}