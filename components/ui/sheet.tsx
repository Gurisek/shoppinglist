"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "left" | "bottom" | "top";
  children: React.ReactNode;
  className?: string;
}

export function Sheet({
  open,
  onOpenChange,
  side = "right",
  children,
  className,
}: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "absolute flex h-full w-full max-w-md flex-col border border-zinc-800 bg-zinc-950 shadow-xl transition-transform",
          side === "right" && "right-0 top-0",
          side === "left" && "left-0 top-0",
          side === "bottom" && "bottom-0 left-0 max-w-none h-auto w-full",
          side === "top" && "top-0 left-0 max-w-none h-auto w-full",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-800 p-4 flex items-center gap-2">
      {children}
    </div>
  );
}
export function SheetTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-white truncate">{children}</h2>
  );
}
export function SheetContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-4 space-y-4", className)}>
      {children}
    </div>
  );
}
export function SheetFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-800 p-4 flex justify-end gap-2">
      {children}
    </div>
  );
}
