"use client";

import React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../lib/utils";

// Tailwind size presets
const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

// Avatar Root
const Avatar = React.forwardRef(function Avatar(
  { className, size = "md", ring = false, ...props },
  ref
) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-black/10 dark:after:border-white/10",
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        ring && "ring-1 ring-black/5 dark:ring-white/10",
        className
      )}
      {...props}
    />
  );
});

// Avatar Image
const AvatarImage = React.forwardRef(function AvatarImage(
  { className, alt = "", ...props },
  ref
) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});

// Avatar Fallback
const AvatarFallback = React.forwardRef(function AvatarFallback(
  { className, delayMs = 0, children, ...props },
  ref
) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      delayMs={delayMs}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium",
        className
      )}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  );
});

export { Avatar, AvatarImage, AvatarFallback };
