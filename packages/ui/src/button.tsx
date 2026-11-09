import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent-strong text-on-accent hover:opacity-90",
  secondary: "border border-line bg-raised text-text hover:bg-sunken",
  ghost: "text-muted hover:bg-sunken hover:text-text",
  danger: "border border-line bg-raised text-danger hover:bg-sunken",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
