import { cx } from "@gota/ui";
import type { InputHTMLAttributes } from "react";

export function TextField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cx("flex flex-col gap-1.5 text-sm", className)}>
      <span className="text-muted">{label}</span>
      <input
        className="h-10 rounded-xl border border-line bg-surface px-3 text-text focus-visible:outline-2 focus-visible:outline-accent"
        {...props}
      />
    </label>
  );
}
