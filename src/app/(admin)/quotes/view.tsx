'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    CheckCircle,
    Clock,
    XCircle,
    Building2,
    Mail,
    Phone,
    Calendar,
    Eye,
    FileText,
    Image as ImageIcon,
    Video,
    Target,
    Package,
    IndianRupee,
    User,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import { toast } from 'react-toastify';

type Props = {
    open: boolean;
    data: any;
    onClose: () => void;
    onStatusUpdate?: () => void;
};

export default function QuoteDetailsModal({ open, data, onClose, onStatusUpdate }: Props) {
    const [isVisible, setIsVisible] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

    useEffect(() => {
        if (open) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [open]);

    if (!open || !data) return null;

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            const response = await api.post(endPointApi.changeQuoteStatus, {
                id: data.id || data._id,
                status: newStatus,
            });

            if (response.data.success || response.data.status === 200) {
                toast.success(`Quote status updated to ${newStatus}`);
                if (onStatusUpdate) onStatusUpdate();
                onClose();
            } else {
                toast.error(response.data.message || "Failed to update status");
            }
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const s = String(status || '').toLowerCase();
        switch (s) {
            case 'approval':
            case 'approved':
            case 'active':
                return { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', label: 'Approved' };
            case 'reject':
            case 'rejected':
                return { icon: XCircle, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', label: 'Rejected' };
            case 'complete':
            case 'completed':
                return { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', label: 'Completed' };
            default:
                return { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', label: 'Pending' };
        }
    };

    const statusConfig = getStatusConfig(data.status);
    const StatusIcon = statusConfig.icon;

    const product = data.product_id || {};
    const vendor = data.vendor_id || {};

    // Find vendor details if they are nested differently or available at top level
    const vendorName = vendor.full_name || product.vendor_name || data.vendor_name || 'Unknown Vendor';
    const businessName = vendor.business_name || 'No Business Name';

    const productImages = product.images || [];

    const DetailRow = ({ icon: Icon, label, value }: any) => (
        <div className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-500">
                <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-700 truncate">{value || '—'}</p>
            </div>
        </div>
    );

    const MediaCard = ({ url, type, label }: { url: string; type: 'image' | 'video'; label: string }) => {
        if (!url) return null;
        return (
            <div
                className="group relative bg-white rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:border-slate-300 transition-all"
                onClick={() => setSelectedMedia({ url, type })}
            >
                <div className="aspect-video bg-slate-50">
                    {type === 'image' ? (
                        <img src={url} alt={label} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <Video size={32} className="text-slate-400 mb-2" />
                            <p className="text-xs font-medium text-slate-500">Video Preview</p>
                        </div>
                    )}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-xs font-medium text-white truncate">{label}</p>
                </div>
            </div>
        );
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100 bg-black/40' : 'opacity-0 bg-black/0 pointer-events-none'}`}
                onClick={onClose}
            >
                <div
                    className={`relative w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                    style={{ height: '85vh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 px-5 py-4 z-20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                                    <StatusIcon size={13} />
                                    <span className="text-sm font-medium">{statusConfig.label}</span>
                                </div>
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                                    <FileText size={12} />
                                    <span className="text-xs font-mono font-medium">Quote ID: {data._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="mt-4">
                            <h2 className="text-xl font-bold text-slate-800">
                                {product.product_name || 'Generic Quote Request'}
                            </h2>
                            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                                <Building2 size={14} />
                                Requested from: <span className="font-semibold text-slate-700">{vendorName}</span> ({businessName})
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="h-full pt-32 pb-20 overflow-y-auto bg-slate-50/50">
                        <div className="px-6 py-4 space-y-6">

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Product & Vendor Section */}
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <Package size={16} className="text-blue-500" />
                                            Product Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <DetailRow icon={Package} label="Product Type" value={product.product_type_name} />
                                            <DetailRow icon={Target} label="Listing Type" value={product.product_listing_type_name} />
                                            <DetailRow icon={ImageIcon} label="Category" value={product.category_name} />
                                            <DetailRow icon={Target} label="Sub Category" value={product.sub_category_name} />
                                        </div>
                                    </div>

                                    {/* <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <User size={16} className="text-indigo-500" />
                                            Vendor Contact
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <DetailRow icon={Mail} label="Email" value={vendor.email} />
                                            <DetailRow icon={Phone} label="Mobile" value={vendor.mobile} />
                                        </div>
                                    </div> */}
                                </div>

                                {/* Pricing & Timing Section */}
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <IndianRupee size={16} className="text-emerald-500" />
                                            Quote Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                                            <div className="col-span-1">
                                                <p className="text-xs text-slate-400">Quantity</p>
                                                <p className="text-xl font-bold text-slate-800">{data.qty || '1'}</p>
                                            </div>
                                            <div className="col-span-1">
                                                <p className="text-xs text-slate-400">Total Price</p>
                                                <p className="text-xl font-bold text-emerald-600">₹{parseFloat(data.calculated_price || data.total_price || '0').toLocaleString('en-IN')}</p>
                                            </div>
                                            <DetailRow icon={Calendar} label="Start Date" value={data.start_date ? new Date(data.start_date).toLocaleDateString() : 'N/A'} />
                                            <DetailRow icon={Calendar} label="End Date" value={data.end_date ? new Date(data.end_date).toLocaleDateString() : 'N/A'} />
                                            <DetailRow icon={Calendar} label="Delivery Date" value={data.delivery_date ? new Date(data.delivery_date).toLocaleDateString() : 'N/A'} />
                                            <DetailRow icon={Clock} label="Month" value={data.month_name || 'N/A'} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Product Images Section */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <ImageIcon size={16} className="text-purple-500" />
                                    Product Images
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <MediaCard url={product.product_main_image} type="image" label="Main Product Image" />
                                    {productImages.map((img: any, idx: number) => (
                                        <MediaCard key={idx} url={img.image} type="image" label={`Product Image ${idx + 1}`} />
                                    ))}
                                    {(!product.product_main_image && productImages.length === 0) && (
                                        <div className="col-span-4 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-sm text-slate-400">No product images available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Vendor Uploaded Media Section */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-orange-500" />
                                    Vendor Uploaded Media (For this Quote)
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <MediaCard url={data.upload_image} type="image" label="Provided Image" />
                                    <MediaCard url={data.upload_video} type="video" label="Provided Video" />
                                    <MediaCard url={data.return_image} type="image" label="Return Confirmation Image" />
                                    <MediaCard url={data.return_video} type="video" label="Return Confirmation Video" />
                                    {!data.image && !data.video && !data.return_image && !data.return_video && (
                                        <div className="col-span-4 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-sm text-slate-400">No media uploaded by vendor for this specific quote</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 z-20 flex justify-between items-center">
                        <div className="flex gap-2">
                            <span className="text-xs text-slate-400">Created: {data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose} className="border-slate-200">Close</Button>
                            {data.status?.toLowerCase() === 'pending' && (
                                <>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleStatusChange('reject')}
                                        disabled={isUpdating}
                                        className="bg-rose-500 hover:bg-rose-600 text-white border-0"
                                    >
                                        Reject Quote
                                    </Button>
                                    <Button
                                        onClick={() => handleStatusChange('approval')}
                                        disabled={isUpdating}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                                    >
                                        Approve Quote
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Preview Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedMedia(null)}
                >
                    <div className="relative w-full max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button
                            className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors"
                            onClick={() => setSelectedMedia(null)}
                        >
                            <X size={24} />
                        </button>
                        {selectedMedia.type === 'image' ? (
                            <img src={selectedMedia.url} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl mx-auto" />
                        ) : (
                            <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl mx-auto" />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
