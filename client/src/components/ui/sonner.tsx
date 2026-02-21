"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:text-foreground",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "!border-l-4 !border-l-[#34C759] [&>svg]:!text-[#34C759]",
          error:
            "!border-l-4 !border-l-[#FF3B30] [&>svg]:!text-[#FF3B30]",
          warning:
            "!border-l-4 !border-l-[#FF9500] [&>svg]:!text-[#FF9500]",
          info:
            "!border-l-4 !border-l-[#007AFF] [&>svg]:!text-[#007AFF]",
        },
        style: {
          background: "hsl(var(--background) / 0.92)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow), var(--glass-highlight)",
          backdropFilter: "blur(var(--glass-blur))",
          WebkitBackdropFilter: "blur(var(--glass-blur))",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };