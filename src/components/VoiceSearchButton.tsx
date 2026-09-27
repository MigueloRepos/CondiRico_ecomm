import React from "react";
import { Mic } from "lucide-react";

interface VoiceSearchButtonProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "pill" | "circle" | "embedded";
  ariaLabel?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onClick,
  className = "",
  size = "md",
  variant = "embedded",
  ariaLabel = "Buscar por voz con comando hablado",
}) => {
  if (variant === "embedded") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative grid size-8 place-items-center rounded-full text-muted-foreground transition-all duration-300 hover:text-primary hover:bg-primary/10 active:scale-90 ${className}`}
        aria-label={ariaLabel}
        title="Buscar por comando de voz"
      >
        <Mic className="size-4.5 transition-transform duration-300 group-hover:scale-110" />
        <span className="absolute -top-1 -right-1 size-2 rounded-full bg-offer ring-2 ring-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-bold text-brand-deep shadow-xs backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-primary hover:scale-105 active:scale-95 ${className}`}
        aria-label={ariaLabel}
      >
        <Mic className="size-3.5 text-offer animate-pulse" />
        <span>Voz</span>
      </button>
    );
  }

  // Circle variant
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid ${sizeClasses[size]} place-items-center rounded-full border border-white/80 bg-white/80 text-primary shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white hover:scale-110 hover:shadow-primary/20 active:scale-95 ${className}`}
      aria-label={ariaLabel}
      title="Buscar por voz"
    >
      <Mic className={size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5"} />
    </button>
  );
};
