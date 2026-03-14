import { CraftsmanMeasurementBoxProps } from "../types";

export function CraftsmanMeasurementBox({
  label,
  value,
}: CraftsmanMeasurementBoxProps) {
  return (
    <div className="rounded-md bg-slate-50 border border-slate-200 px-1 py-1">
      <p className="text-[10px] leading-tight text-slate-500 font-bangla">
        {label}
      </p>
      <p className="text-[11px] font-semibold text-slate-900 mt-0.5 leading-tight">
        {value || "—"}
      </p>
    </div>
  );
}
