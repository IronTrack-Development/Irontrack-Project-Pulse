"use client";

import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface EditableTalkingPointsProps {
  points: string[];
  onChange: (points: string[]) => void;
  readOnly?: boolean;
}

export default function EditableTalkingPoints({
  points,
  onChange,
  readOnly = false,
}: EditableTalkingPointsProps) {
  const addPoint = () => onChange([...points, ""]);

  const removePoint = (idx: number) => {
    const updated = points.filter((_, i) => i !== idx);
    onChange(updated.length > 0 ? updated : [""]);
  };

  const updatePoint = (idx: number, val: string) => {
    const updated = [...points];
    updated[idx] = val;
    onChange(updated);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...points];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    onChange(updated);
  };

  const moveDown = (idx: number) => {
    if (idx === points.length - 1) return;
    const updated = [...points];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    onChange(updated);
  };

  if (readOnly) {
    return (
      <ol className="space-y-2.5 pl-1">
        {points.map((point, idx) => (
          <li
            key={idx}
            className="flex gap-2.5 text-sm text-[color:var(--text-secondary)] leading-relaxed"
          >
            <span className="text-[#F97316] font-medium shrink-0 w-5 text-right">
              {idx + 1}.
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="space-y-2">
      {points.map((point, idx) => (
        <div
          key={idx}
          className="flex items-start gap-1.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-2 group"
        >
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
            <button
              onClick={() => moveUp(idx)}
              disabled={idx === 0}
              className="p-0.5 text-gray-600 hover:text-[color:var(--text-secondary)] disabled:opacity-30 disabled:cursor-default transition-colors"
              title={t('ui.move.up')}
            >
              <ChevronUp size={12} />
            </button>
            <button
              onClick={() => moveDown(idx)}
              disabled={idx === points.length - 1}
              className="p-0.5 text-gray-600 hover:text-[color:var(--text-secondary)] disabled:opacity-30 disabled:cursor-default transition-colors"
              title={t('ui.move.down')}
            >
              <ChevronDown size={12} />
            </button>
          </div>

          {/* Point number */}
          <span className="text-xs text-gray-600 mt-2 w-4 text-right shrink-0">
            {idx + 1}.
          </span>

          {/* Text input */}
          <textarea
            value={point}
            onChange={(e) => updatePoint(idx, e.target.value)}
            rows={2}
            placeholder={t('ui.talking.point')}
            className="flex-1 bg-transparent text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none resize-none min-h-[36px]"
          />

          {/* Remove button */}
          <button
            onClick={() => removePoint(idx)}
            className="p-1 text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-0.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
            title={t('ui.remove.point')}
          >
            <X size={12} />
          </button>
        </div>
      ))}

      <button
        onClick={addPoint}
        className="flex items-center gap-1.5 text-xs text-[#F97316] hover:text-[#ea6c10] transition-colors py-1.5 px-1 min-h-[32px]"
      >
        <Plus size={12} />{t('ui.add.talking.point')}
      </button>
    </div>
  );
}
