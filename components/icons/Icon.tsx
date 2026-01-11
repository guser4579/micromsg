import * as React from "react";
import { MenuIcon } from "./MenuIcon";
import { SendIcon } from "./SendIcon";

// Icon names will be expanded to union type as icons are added
// Example: type IconName = "menu" | "send" | "arrow-up";
export type IconName = "menu" | "send" | string;

export type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  ariaLabel?: string;
};

// SVG content mapping - will be populated as icons are added
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; ariaLabel?: string }>> = {
  menu: MenuIcon,
  send: SendIcon,
};

export function Icon({ name, size = 20, className, ariaLabel }: IconProps) {
  const IconComponent = iconMap[name];

  // Return null if icon doesn't exist (no visual changes during setup)
  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={size} className={className} ariaLabel={ariaLabel} />;
}
