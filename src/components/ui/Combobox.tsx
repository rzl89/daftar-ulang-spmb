import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/utils";

interface ComboboxProps {
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  /** List of string options to show in dropdown */
  options: string[];
  /** Current value */
  value?: string;
  /** Called when user selects or types a value */
  onChange?: (value: string) => void;
  /** Called on blur for react-hook-form register */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Input name (for react-hook-form register) */
  name?: string;
  className?: string;
  disabled?: boolean;
}

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      label,
      error,
      required,
      placeholder = "Ketik untuk mencari...",
      options,
      value: controlledValue,
      onChange,
      onBlur,
      name,
      className,
      disabled,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(controlledValue || "");
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const inputId = name || label?.toLowerCase().replace(/\s+/g, "-");

    // Sync external value changes (e.g. auto-fill from verification)
    useEffect(() => {
      if (controlledValue !== undefined) {
        setInputValue(controlledValue);
      }
    }, [controlledValue]);

    // Filter options based on input
    const filteredOptions = inputValue
      ? options.filter((opt) =>
          opt.toLowerCase().includes(inputValue.toLowerCase())
        )
      : options;

    const displayOptions = isOpen ? filteredOptions : [];

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll active item into view
    useEffect(() => {
      if (activeIndex >= 0 && listRef.current) {
        const items = listRef.current.children;
        if (items[activeIndex]) {
          items[activeIndex].scrollIntoView({ block: "nearest" });
        }
      }
    }, [activeIndex]);

    const selectOption = useCallback(
      (opt: string) => {
        setInputValue(opt);
        setIsOpen(false);
        setActiveIndex(-1);
        onChange?.(opt);
      },
      [onChange]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setIsOpen(true);
          setActiveIndex(0);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < displayOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : displayOptions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < displayOptions.length) {
            selectOption(displayOptions[activeIndex]);
          } else {
            // Accept typed value as-is
            setIsOpen(false);
            setActiveIndex(-1);
            onChange?.(inputValue);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    };

    return (
      <div className="space-y-1.5" ref={containerRef}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            name={name}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
              onChange?.(e.target.value);
            }}
            onFocus={() => {
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onBlur={(e) => {
              // Small delay so click on option registers before close
              setTimeout(() => {
                setIsOpen(false);
                setActiveIndex(-1);
              }, 150);
              onBlur?.(e);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${inputId}-listbox`}
            className={cn(
              "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800",
              "transition-all duration-200",
              "border-slate-200 hover:border-primary/30",
              "focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none",
              "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
              error &&
                "border-destructive focus:border-destructive focus:ring-destructive/10",
              className
            )}
          />
          {/* Dropdown chevron */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A237E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Dropdown list */}
          {isOpen && displayOptions.length > 0 && (
            <ul
              id={`${inputId}-listbox`}
              ref={listRef}
              role="listbox"
              className={cn(
                "absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto",
                "rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50",
                "py-1"
              )}
            >
              {displayOptions.map((opt, i) => (
                <li
                  key={opt}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur before selection
                    selectOption(opt);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "px-4 py-2.5 text-sm cursor-pointer transition-colors",
                    "hover:bg-primary/5",
                    i === activeIndex && "bg-primary/10 text-primary font-medium",
                    i !== activeIndex && "text-slate-700"
                  )}
                >
                  {opt}
                </li>
              ))}
            </ul>
          )}

          {/* No results message */}
          {isOpen && inputValue && filteredOptions.length === 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg py-3 px-4 text-sm text-slate-400 text-center">
              Sekolah tidak ditemukan. Ketik nama sekolah Anda.
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Combobox.displayName = "Combobox";
