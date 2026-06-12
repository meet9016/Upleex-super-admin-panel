"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Search, X } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import AgGridTable from "@/components/ui/AgGridTable";

interface UserRow {
    _id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string;
    platform: string;
    createdAt?: string;
}

function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function UserListPage() {
    const [rowData, setRowData] = useState<UserRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const debouncedSearch = useDebounce(searchText, 500);
    const validSearchText = debouncedSearch.length >= 3 || debouncedSearch.length === 0 ? debouncedSearch : "";

    const fetchUsers = useCallback(async (searchQuery = '') => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);

            const queryString = params.toString();
            const url = queryString ? `${endPointApi.getAllUsers}?${queryString}` : endPointApi.getAllUsers;

            const response = await api.get(url);
            if (response.data.status === 200 || response.data.success) {
                setRowData(response.data.data || []);
            }
        } catch (error: any) {
            toast.error("Failed to fetch user list");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(validSearchText);
    }, [fetchUsers, validSearchText]);

    const columnDefs: ColDef<any>[] = [
        {
            headerName: "Full Name",
            valueGetter: p => p.data?.full_name || `${p.data?.first_name || ''} ${p.data?.last_name || ''}`.trim() || p.data?.name || 'N/A',
            minWidth: 250,
            cellStyle: { fontWeight: "600", color: "#1e293b" }
        },
        {
            headerName: "Email",
            field: "email",
            minWidth: 300,
        },
        {
            headerName: "Phone",
            valueGetter: p => p.data?.phone || p.data?.mobile || 'N/A',
            minWidth: 200,
        },
        {
            headerName: "Platform",
            valueGetter: p => {
                const type = p.data?.platform || 'N/A';
                return type.charAt(0).toUpperCase() + type.slice(1);
            },
            minWidth: 150,
            cellStyle: { color: "#475569" }
        },
        {
            headerName: "Join Date",
            valueGetter: p => p.data?.createdAt ? new Date(p.data.createdAt).toLocaleDateString() : 'N/A',
            minWidth: 150,
            cellStyle: { color: "#475569" }
        }
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Registered Users</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        {searchText && (
                            <button
                                onClick={() => setSearchText('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-none rounded-none shadow-xl shadow-slate-200/50 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="h-full w-full relative">
                            <AgGridTable
                                rowData={rowData}
                                columns={columnDefs as ColDef<any>[]}
                                gridHeight={790}
                                loading={isLoading}
                                showCheckboxes={false}
                                noRowsMessage="No users found"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
