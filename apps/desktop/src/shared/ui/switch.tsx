import { cx } from "@gota/ui";

type SwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  "aria-label": string;
};

export function Switch({ checked, disabled, onChange, "aria-label": label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-[18px] w-8 shrink-0 rounded-full transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:opacity-50",
        checked ? "bg-accent" : "bg-muted/30",
      )}
    >
      <span
        className={cx(
          "absolute top-px left-px size-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none",
          checked && "translate-x-3.5",
        )}
      />
    </button>
  );
}
