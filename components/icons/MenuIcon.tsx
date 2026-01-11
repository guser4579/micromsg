import * as React from "react";

type MenuIconProps = {
  size?: number;
  className?: string;
  ariaLabel?: string;
};

export function MenuIcon({ size = 20, className, ariaLabel }: MenuIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={ariaLabel}
      role="img"
    >
      <path d="M4 8.5H20" />
      <path d="M4 15.5H20" />
    </svg>
  );
}
