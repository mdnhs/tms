import { CraftsmanMeasurementBoxProps } from "../types";

export function CraftsmanMeasurementBox({
  label,
  value,
}: CraftsmanMeasurementBoxProps) {
  return (
    <div className="rounded-md  border border-slate-200 overflow-hidden">
      <p className="text-[10px] leading-tight text-slate-500 font-bangla bg-slate-50 p-1 border-b border-slate-200">
        {label}
      </p>
      <p className="text-[11px] font-semibold text-slate-900 mt-0.5 leading-tight p-1">
        {value || "—"}
      </p>
    </div>
  );
}
