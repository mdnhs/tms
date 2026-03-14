import { CraftsmanInfoFieldProps } from "../types";

export function CraftsmanInfoField({
  label,
  value,
  inputStyle = false,
  borderless = false,
  compact = false,
  handwrittenPlaceholder,
}: CraftsmanInfoFieldProps) {
  const wrapperClass = borderless
    ? compact
      ? "px-0.5 py-1"
      : "px-0.5 py-1.5"
    : "rounded-lg border border-slate-300 px-2.5 py-1.5";

  const plainValueClass = compact
    ? "text-[11px] font-semibold text-slate-900 mt-0.5"
    : "text-xs font-semibold text-slate-900 mt-0.5";

  const inputClass = compact
    ? "min-h-7 rounded-lg border border-slate-400 bg-white px-2 py-1 text-[11px] font-semibold text-slate-900"
    : "min-h-8 rounded-lg border border-slate-400 bg-white px-2 py-1 text-xs font-semibold text-slate-900";

  return (
    <div className={wrapperClass}>
      <p
        className={`text-[10px] font-semibold text-slate-500 font-bangla ${borderless ? "mb-1" : ""}`}
      >
        {label}
      </p>
      {inputStyle ? (
        <div
          className={`${inputClass} ${handwrittenPlaceholder ? "flex items-center justify-between gap-1" : ""}`}
        >
          <span>{value}</span>
          {handwrittenPlaceholder ? (
            <span className="font-mono text-[10px] text-slate-400 tracking-tight">
              {handwrittenPlaceholder}
            </span>
          ) : null}
        </div>
      ) : (
        <p
          className={
            borderless
              ? plainValueClass
              : "font-mono text-xs font-bold text-slate-900 mt-0.5"
          }
        >
          {value}
        </p>
      )}
    </div>
  );
}
