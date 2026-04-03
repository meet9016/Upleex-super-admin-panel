"use client";

import React, { useState, useEffect, useRef } from "react";
import { MdCalendarToday, MdChevronLeft, MdChevronRight } from "react-icons/md";
import clsx from "clsx";

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    min?: string;
    className?: string;
    error?: string;
}

export default function DatePicker({
    value,
    onChange,
    min,
    className,
    error,
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date()); // For navigation
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize current view based on value or today
    useEffect(() => {
        if (value) {
            setCurrentDate(new Date(value));
        } else {
            setCurrentDate(new Date());
        }
    }, [isOpen, value]); // Reset when opening

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return "Select Date";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "Select Date";

        return date.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        );
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        );
    };

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
        );
        // Adjust for timezone offset to ensure YYYY-MM-DD matches local date
        const offset = selectedDate.getTimezoneOffset();
        const localDate = new Date(selectedDate.getTime() - offset * 60 * 1000);
        const dateStr = localDate.toISOString().split("T")[0];

        onChange(dateStr);
        setIsOpen(false);
    };

    const isDateDisabled = (day: number) => {
        if (!min) return false;
        const dateToCheck = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
        );
        const minDate = new Date(min);
        // Compare only dates, ignore time
        dateToCheck.setHours(0, 0, 0, 0);
        minDate.setHours(0, 0, 0, 0);
        return dateToCheck < minDate;
    };

    const isDateSelected = (day: number) => {
        if (!value) return false;
        const selected = new Date(value);
        return (
            selected.getDate() === day &&
            selected.getMonth() === currentDate.getMonth() &&
            selected.getFullYear() === currentDate.getFullYear()
        );
    };

    const renderCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const disabled = isDateDisabled(day);
            const selected = isDateSelected(day);

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        !disabled && handleDateClick(day);
                    }}
                    disabled={disabled}
                    className={clsx(
                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                        selected
                            ? "bg-blue-600 text-white shadow-md cursor-pointer"
                            : disabled
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                    )}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div
            ref={containerRef}
            className="relative"
        >
            {/* Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center justify-between w-full h-11 pl-4 pr-4 border rounded-xl bg-slate-50 transition-colors cursor-pointer",
                    isOpen ? "border-blue-500 ring-1 ring-blue-200" : error ? "border-red-500 bg-red-50" : "border-slate-100 hover:border-blue-400",
                    className
                )}
            >
                <div className="flex flex-col justify-center">
                    <span className="text-sm font-medium text-slate-700 leading-tight">
                        {value ? formatDateDisplay(value) : "Select Date"}
                    </span>
                </div>
                <MdCalendarToday
                    className={clsx(
                        "transition-colors",
                        isOpen ? "text-gray-600" : "text-gray-400"
                    )}
                    size={18}
                />
            </div>

            {/* Dropdown Calendar */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
                        >
                            <MdChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-gray-800">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
                        >
                            <MdChevronRight size={20} />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                            <div
                                key={day}
                                className="h-8 flex items-center justify-center text-xs font-semibold text-gray-400"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                        {renderCalendarDays()}
                    </div>
                </div>
            )}
        </div>
    );
}
