import * as React from "react";

type SendIconProps = {
  size?: number;
  className?: string;
  ariaLabel?: string;
};

export function SendIcon({ size = 20, className, ariaLabel }: SendIconProps) {
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
      <path d="M12 20V4M12 4L6 10M12 4L18 10" />
    </svg>
  );
}
