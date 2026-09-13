import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

type Variant = "primary" | "danger" | "ghost" | "link" | "preset" | "scene";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg";
  selected?: boolean;
  asChild?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background";

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "px-3.5 py-2 text-sm",
  lg: "px-7 py-3 text-lg",
};

const variants: Record<Variant | "default", string> = {
  default: "bg-surface text-foreground border-border hover:border-primary",
  primary:
    "bg-primary text-primary-foreground border-transparent hover:brightness-110",
  danger: "bg-danger text-white border-transparent hover:brightness-110",
  ghost: "bg-transparent border-transparent hover:bg-background",
  link: "bg-transparent border-transparent text-primary p-1 hover:underline",
  preset: "bg-surface text-foreground",
  scene:
    "bg-scene-accent text-scene-on-accent border-transparent hover:brightness-110",
};

export function Button({
  variant,
  size = "md",
  selected = false,
  asChild = false,
  className,
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const classes = cn(
    base,
    variant !== "link" && sizes[size],
    variants[variant ?? "default"],
    variant === "preset" &&
      (selected
        ? "border-primary text-primary font-semibold"
        : "border-border"),
    className,
  );
  return <Comp className={classes} {...rest} />;
}
