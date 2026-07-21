"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface OrbitOption {
  value: string;
  label: string;
  badge?: string;
}

interface OrbitSelectProps {
  options: (string | OrbitOption)[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function OrbitSelect({
  options,
  value,
  onChange,
  icon,
  placeholder = "Selecione...",
  className = "",
}: OrbitSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalizar opções para o formato OrbitOption
  const normalizedOptions: OrbitOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || {
    value,
    label: value || placeholder,
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border transition-all duration-200 cursor-pointer ${
          isOpen
            ? "border-cyan-400/80 shadow-[0_0_20px_rgba(0,240,255,0.25)] bg-white/10"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {icon && <span className="text-cyan-400 shrink-0">{icon}</span>}
          <span className="text-sm font-bold text-white tracking-wide truncate">
            {selectedOption.label}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-cyan-300" : ""
          }`}
        />
      </button>

      {/* Custom Glassmorphic Orbit Dropdown Popup */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[220px] z-[100] bg-[#0f1423] border border-cyan-500/50 rounded-2xl p-1.5 shadow-[0_15px_50px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="max-h-64 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
            {normalizedOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
