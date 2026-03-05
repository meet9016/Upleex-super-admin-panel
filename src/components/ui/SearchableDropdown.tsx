'use client';

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X } from "lucide-react";
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
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const selectedValues = multiple 
        ? (Array.isArray(value) ? value : value ? [value] : [])
        : (value ? [value] : []);
    
    const selectedOptions = options.filter(o => selectedValues.includes(o.value));

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    useEffect(() => {
        if (!open) {
            setHighlightedIndex(-1);
            setSearch("");
        }
    }, [open]);

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

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && dropdownRef.current) {
            const highlightedElement = dropdownRef.current.querySelectorAll('[role="option"]')[highlightedIndex];
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    handleOptionClick(filteredOptions[highlightedIndex]);
                }
                break;
                 case 'Backspace':
            // remove selected option
            if (!search) {
                if (multiple) {
                    const currentValues = Array.isArray(value) ? value : value ? [value] : [];
                    if (currentValues.length) {
                        const newValues = currentValues.slice(0, -1);
                        onChange(newValues);
                    }
                } else {
                    if (value) {
                        onChange("");
                    }
                }
            }
            break;
            case 'Escape':
                setOpen(false);
                setSearch("");
                break;
            case 'Tab':
                setOpen(false);
                setSearch("");
                break;
        }
    };

    const handleOptionClick = (opt: Option) => {
        if (disabled) return;
        
        if (multiple) {
            const currentValues = Array.isArray(value) ? value : value ? [value] : [];
            const isSelected = currentValues.includes(opt.value);
            
            let newValues: string[];
            if (isSelected) {
                newValues = currentValues.filter(v => v !== opt.value);
            } else {
                newValues = [...currentValues, opt.value];
            }
            
            onChange(newValues);
            
            // Keep focus on search input if open
            if (searchable && open) {
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 0);
            }
        } else {
    const currentValue = Array.isArray(value) ? value[0] : value;

    // If already selected → deselect
    if (currentValue === opt.value) {
        onChange("");
    } else {
        onChange(opt.value);
    }

    setOpen(false);
    setSearch("");
}
    };

    const handleRemoveSelected = (opt: Option, e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        
        const currentValues = Array.isArray(value) ? value : value ? [value] : [];
        const newValues = currentValues.filter(v => v !== opt.value);
        onChange(newValues);
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        onChange(multiple ? [] : "");
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
                            setHighlightedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
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
                    filteredOptions.map((opt, index) => {
                        const isSelected = selectedValues.includes(opt.value);

                        return (
                            <div
                                key={opt.value}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleOptionClick(opt)}
                                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 transition-all
                                    ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
                                    ${highlightedIndex === index ? "bg-gray-100" : ""}
                                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                {/* Checkbox */}
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
            {/* Selected items chips for multiple select */}
            {multiple && selectedOptions.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {selectedOptions.map(opt => (
                        <div 
                            key={opt.value} 
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs group"
                        >
                            {opt.image && (
                                <img 
                                    src={opt.image} 
                                    alt={opt.label} 
                                    className="w-4 h-4 rounded object-cover" 
                                />
                            )}
                            <span className="max-w-[150px] truncate">{opt.label}</span>
                            <button
                                type="button"
                                onClick={(e) => handleRemoveSelected(opt, e)}
                                className="hover:bg-blue-100 rounded-sm p-0.5 transition-colors"
                                aria-label={`Remove ${opt.label}`}
                            >
                                <X size={12} className="text-blue-600" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Main dropdown button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(!open)}
                onKeyDown={handleKeyDown}
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
                    {/* Show selected item image for single select */}
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

                <div className="flex items-center gap-1">
                    {/* Clear button - only show when there's a selection */}
                    {selectedOptions.length > 0 && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClearAll(e);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            role="button"
                            tabIndex={-1}
                            aria-label="Clear selection"
                        >
                            <X size={16} className="text-gray-400 hover:text-gray-600" />
                        </div>
                    )}
                    
                    {/* Dropdown arrow */}
                    <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                </div>
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