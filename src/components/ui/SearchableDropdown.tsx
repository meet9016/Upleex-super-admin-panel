'use client';

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { Input } from "./Input";

type Option = {
    label: string;
    value: string;
    image?: string;
};

type Props = {
    options: Option[];
    value: string | string[] | null;
    placeholder?: string;
    onChange: (value: string | string[]) => void;
    error?: boolean;
    errorMessage?: string;
    searchable?: boolean;
    onScrollNearBottom?: () => void;
    footer?: React.ReactNode;
    onSearch?: (value: string) => void;
    usePortal?: boolean;
    disabled?: boolean;
    multiple?: boolean;
    maxHeight?: string;
};

export default function SearchableDropdown({
    options,
    value,
    placeholder = "Select option",
    onChange,
    error = false,
    errorMessage,
    searchable = false,
    onScrollNearBottom,
    footer,
    usePortal = false,
    onSearch,
    disabled = false,
    multiple = false,
    maxHeight = "max-h-60",
}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [portalStyle, setPortalStyle] = useState<React.CSSProperties>();

    // Handle both single and multiple values
    const selectedValues = multiple 
        ? (Array.isArray(value) ? value : value ? [value] : [])
        : (value ? [value] : []);
    
    const selectedOptions = options.filter(o => selectedValues.includes(o.value));

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                !ref.current?.contains(target) &&
                !dropdownRef.current?.contains(target)
            ) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredOptions = searchable
        ? options.filter(o =>
            o.label.toLowerCase().includes(search.toLowerCase())
        )
        : options;

    useEffect(() => {
        if (!open || !searchable) return;
        searchInputRef.current?.focus();
    }, [open, searchable]);

    const updatePortalPosition = () => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPortalStyle({
            position: "fixed",
            top: r.bottom + 4,
            left: r.left,
            width: r.width,
            zIndex: 9999,
        });
    };

    useEffect(() => {
        if (!usePortal || !open) return;
        updatePortalPosition();
        window.addEventListener("scroll", updatePortalPosition, true);
        window.addEventListener("resize", updatePortalPosition);
        return () => {
            window.removeEventListener("scroll", updatePortalPosition, true);
            window.removeEventListener("resize", updatePortalPosition);
        };
    }, [usePortal, open]);

    const handleOptionClick = (opt: Option) => {
        if (disabled) return;
        
        if (multiple) {
            // Multiple selection logic
            const currentValues = Array.isArray(value) ? value : [];
            const isSelected = currentValues.includes(opt.value);
            
            let newValues: string[];
            if (isSelected) {
                newValues = currentValues.filter(v => v !== opt.value);
            } else {
                newValues = [...currentValues, opt.value];
            }
            
            onChange(newValues);
            // Don't close dropdown for multiple selection
        } else {
            // Single selection logic
            onChange(opt.value);
            setOpen(false);
            setSearch("");
        }
    };

    const getSelectedDisplayText = () => {
        if (multiple) {
            if (selectedOptions.length === 0) return placeholder;
            if (selectedOptions.length === 1) return selectedOptions[0].label;
            return `${selectedOptions.length} items selected`;
        } else {
            return selectedOptions[0]?.label || placeholder;
        }
    };

    const renderDropdown = (
        <div
            ref={dropdownRef}
            style={usePortal ? portalStyle : undefined}
            className={`${usePortal ? "" : "absolute mt-2 w-full"} 
      z-50 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden`}
        >
            {searchable && (
                <div className="p-2 border-b border-gray-200">
                    <Input
                        ref={searchInputRef as any}
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            onSearch?.(e.target.value);
                        }}
                        className="w-full"
                    />
                </div>
            )}

            <div
                className={`overflow-y-auto ${maxHeight}`}
                onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    const scrollPercentage =
                        (target.scrollTop + target.clientHeight) /
                        target.scrollHeight;
                    if (onScrollNearBottom && scrollPercentage >= 0.8) {
                        onScrollNearBottom();
                    }
                }}
            >
                {filteredOptions.length ? (
                    filteredOptions.map((opt) => {
                        const isSelected = selectedValues.includes(opt.value);

                        return (
                            <div
                                key={opt.value}
                                onClick={() => handleOptionClick(opt)}
                                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 transition-all hover:bg-gray-50
                                    ${isSelected ? "bg-blue-50/50" : ""}
                                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                            >
                                {/* Square Checkbox - Same for both single and multiple */}
                                <div className="flex-shrink-0">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                                        ${isSelected 
                                            ? 'bg-blue-500 border-blue-500' 
                                            : 'border-gray-300 bg-white'
                                        }`}
                                    >
                                        {isSelected && <Check size={14} className="text-white" />}
                                    </div>
                                </div>

                                {/* Image */}
                                {opt.image && (
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                        <img
                                            src={opt.image}
                                            alt={opt.label}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23f1f5f9'/%3E%3Ctext x='16' y='20' font-family='Arial' font-size='10' fill='%2394a3b8' text-anchor='middle'%3Eimg%3C/text%3E%3C/svg%3E";
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Label */}
                                <span className={`flex-1 ${isSelected ? "font-medium text-gray-900" : "text-gray-700"}`}>
                                    {opt.label}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <p className="px-4 py-8 text-sm text-gray-400 text-center">
                        No results found
                    </p>
                )}

                {footer && <div className="px-4 py-2 border-t border-gray-100">{footer}</div>}
            </div>
        </div>
    );

    return (
        <div ref={ref} className="relative w-full">
            {/* Selected items preview for multiple selection */}
            {multiple && selectedOptions.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                    {selectedOptions.slice(0, 3).map(opt => (
                        <div key={opt.value} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                            {opt.image && (
                                <img src={opt.image} alt={opt.label} className="w-4 h-4 rounded object-cover" />
                            )}
                            <span>{opt.label}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOptionClick(opt);
                                }}
                                className="ml-1 hover:text-blue-900"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    {selectedOptions.length > 3 && (
                        <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                            +{selectedOptions.length - 3} more
                        </div>
                    )}
                </div>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(!open)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-all h-11
                    ${error ? "!border-red-500 !ring-red-500/20" : "border-gray-200 hover:border-gray-300"}
                    ${disabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-800 hover:bg-gray-50"
                    }
                    ${open ? "ring-2 ring-blue-500/20 border-blue-500" : ""}
                `}
            >
                <span className="flex items-center gap-2 truncate">
                    {/* Show first selected image for single mode */}
                    {!multiple && selectedOptions[0]?.image && (
                        <img
                            src={selectedOptions[0].image}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                        />
                    )}
                    <span className={`truncate ${selectedOptions.length ? "text-gray-800" : "text-gray-400"}`}>
                        {getSelectedDisplayText()}
                    </span>
                </span>

                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {error && errorMessage && (
                <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
            )}

            {open &&
                (usePortal
                    ? createPortal(renderDropdown, document.body)
                    : renderDropdown)}
        </div>
    );
}