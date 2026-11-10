import { cx } from "@gota/ui";
import type { ButtonHTMLAttributes } from "react";

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors",
        "hover:bg-pane-line hover:text-text",
        "focus-visible:outline-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  );
}
