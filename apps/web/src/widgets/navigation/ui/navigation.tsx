import { cx } from "@gota/ui";
import { NavLink } from "react-router";

const LINKS = [
  { to: "/", label: "Today" },
  { to: "/history", label: "History" },
  { to: "/bottle", label: "Bottle" },
  { to: "/review", label: "Review" },
  { to: "/settings", label: "Settings" },
];

export function Navigation() {
  return (
    <nav
      aria-label="Main"
      className={cx(
        "fixed inset-x-0 bottom-0 z-10 border-t border-line bg-raised/90 pb-[env(safe-area-inset-bottom)] backdrop-blur",
        "sm:static sm:border-0 sm:bg-transparent sm:pb-0 sm:backdrop-blur-none",
      )}
    >
      <ul className="mx-auto flex max-w-2xl justify-around sm:justify-end sm:gap-1">
        {LINKS.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cx(
                  "block rounded-full px-3 py-3 text-sm transition sm:py-2",
                  isActive ? "font-medium text-accent-strong" : "text-muted hover:text-text",
                )
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
