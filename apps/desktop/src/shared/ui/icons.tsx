import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 5h6M11.5 5h2M2.5 11h2M7.5 11h6" />
      <circle cx="10" cy="5" r="1.5" />
      <circle cx="6" cy="11" r="1.5" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3.5 5.5 8l4.5 4.5" />
    </Icon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.5V7a4 4 0 0 1 8 0v3.5l1 1.5H3l1-1.5ZM6.5 13.5a1.5 1.5 0 0 0 3 0" />
    </Icon>
  );
}

export function BellOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.2 4.2A4 4 0 0 1 12 7v3.5l1 1.5H6M4 7v3.5L3 12h2M6.5 13.5a1.5 1.5 0 0 0 3 0M2.5 2.5l11 11" />
    </Icon>
  );
}

export function DropIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2s-4 4.6-4 7.4a4 4 0 0 0 8 0C12 6.6 8 2 8 2Z" />
    </Icon>
  );
}
