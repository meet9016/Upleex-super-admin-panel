"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trash2, Eye, Search, X } from "lucide-react";
import { apiService } from "@/services/api";
import type { Contact } from "@/types/contact";
import AgGridTable from "@/components/ui/AgGridTable";
import Tooltip from "@/components/ui/Tooltip";
import { ColDef } from "ag-grid-community";
import { toast } from "react-toastify";
import { MdSearch } from "react-icons/md";
import CommonDeleteModal from "@/components/common/CommonDeleteModal";
import PageLoader from "@/components/common/PageLoader";
import ActionButtons from "@/components/common/ActionButtons";

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ContactUsPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<Contact[]>([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const gridRef = useRef<any>(null);
  const debouncedSearch = useDebounce(searchText, 600);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (debouncedSearch.length >= 3) {
      searchContacts(debouncedSearch);
    } else if (debouncedSearch.length === 0) {
      setFilteredContacts(contacts);
    }
  }, [debouncedSearch, contacts]);

  const fetchContacts = async () => {
    try {
      setIsFetching(true);
      const response = await apiService.getAllContacts({ limit: 1000 });
      
      // Ensure proper data mapping and date handling
      const formattedContacts = response.data.map((contact: any) => {
        return {
          id: contact._id || contact.id,
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          message: contact.message || '',
          created_at: contact.createdAt || contact.created_at || new Date().toISOString(),
          updated_at: contact.updatedAt || contact.updated_at || new Date().toISOString(),
        };
      });
      
      setContacts(formattedContacts);
      setFilteredContacts(formattedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to fetch contacts");
    } finally {
      setIsFetching(false);
    }
  };

  const searchContacts = (searchTerm: string) => {
    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteContact(contactToDelete.id);
      toast.success("Contact deleted successfully");
      setShowDeletePopup(false);
      setContactToDelete(null);
      fetchContacts();
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      toast.error(error?.response?.data?.message || "Failed to delete contact");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setContactToDelete(null);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setFilteredContacts(contacts);
  };


  const columnDefs: ColDef<Contact>[] = [
    {
      field: "name",
      headerName: "Name",
      minWidth: 200,
      cellStyle: { fontWeight: "600", color: "#1e293b", display: 'flex', alignItems: 'center' }
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 250,
      cellStyle: { color: "#64748b", display: 'flex', alignItems: 'center' }
    },
    {
      field: "phone",
      headerName: "Phone",
      minWidth: 150,
      cellStyle: { color: "#64748b", display: 'flex', alignItems: 'center' },
      cellRenderer: (params: { data: Contact }) => params.data.phone || '-'
    },
    {
      field: "message",
      headerName: "Message",
      minWidth: 400,
      cellStyle: { color: "#1e293b", display: 'flex', alignItems: 'center' },
      cellRenderer: (params: { data: Contact }) => {
        const message = params.data?.message || "";
        const isLong = message.length > 100;
        const displayMessage = isLong ? `${message.substring(0, 100)}...` : message;
        
        return (
          <Tooltip 
            className="w-full"
            content={
              <div className="max-w-sm p-1 leading-relaxed text-slate-50">
                {message}
              </div>
            }
          >
            <span className="cursor-pointer border-b border-dotted border-slate-300 whitespace-nowrap overflow-hidden text-ellipsis block w-full">
              {displayMessage}
            </span>
          </Tooltip>
        );
      }
    },
    {
      field: "created_at",
      headerName: "Date",
      width: 120,
      cellStyle: { color: "#64748b", display: 'flex', alignItems: 'center' },
      cellRenderer: (params: { data: Contact }) => {
        try {
          const date = new Date(params.data.created_at);
          if (isNaN(date.getTime())) {
            console.warn('Invalid date for contact:', params.data.id, params.data.created_at);
            return 'Invalid Date';
          }
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch (error) {
          return 'Invalid Date';
        }
      }
    },
    {
          headerName: "Action",
          width: 100,
          minWidth: 100,
          maxWidth: 100,
          pinned: "right",
          suppressHeaderMenuButton: true,
          sortable: false,
          filter: false,
          cellStyle: { display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" },
          cellRenderer: (params: { data: any }) => (
            <ActionButtons onDelete={() => handleDeleteClick(params.data)} />
          )
        },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Contact Us Management</h2>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-2 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* LEFT */}
            <div>
              <CardTitle className="text-lg">Contact Messages</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Total: {filteredContacts.length} contacts
                {searchText && ` • Searching: "${searchText}"`}
              </p>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              
              {/* DELETE BUTTON */}
              <Button
                variant="destructive"
                size="md"
                disabled={selectedRows.length === 0}
                onClick={async () => {
                  if (selectedRows.length === 0) return;
                  if (!confirm(`Delete ${selectedRows.length} selected contacts?`)) return;

                  try {
                    const ids = selectedRows.map(r => r.id).filter(Boolean);
                    await apiService.bulkDeleteContacts(ids);
                    toast.success(`${selectedRows.length} contact${selectedRows.length > 1 ? 's' : ''} deleted successfully`);
                    setSelectedRows([]);
                    gridRef.current?.api?.deselectAll();
                    await fetchContacts();
                  } catch (error: any) {
                    console.error("Bulk delete error:", error);
                    toast.error(error?.response?.data?.message || 'Failed to delete selected contacts');
                  }
                }}
                className="w-full sm:w-auto h-9 text-sm"
              >
                Delete Selected ({selectedRows.length})
              </Button>

              {/* SEARCH */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-full text-sm"
                />

                <MdSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                {searchText && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative h-full">
          <AgGridTable
            loading={isFetching}
            ref={gridRef}
            rowData={filteredContacts}
            columns={columnDefs}
            onSelectionChange={(selected) => {
              setSelectedRows(selected);
            }}
            enableSearch={false}
            enableFilter={false}
            gridHeight={680}
            noRowsMessage="No contact found"
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Popup */}
      <CommonDeleteModal
        open={showDeletePopup}
        title="Delete Contact?"
        description={contactToDelete ? `Are you sure you want to delete the message from "${contactToDelete.name}"? This action cannot be undone.` : "This action cannot be undone."}
        isLoading={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ContactUsPage;