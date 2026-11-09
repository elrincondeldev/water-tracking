import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cx("rounded-3xl border border-line bg-raised p-5 sm:p-6", className)}
      {...props}
    />
  );
}
