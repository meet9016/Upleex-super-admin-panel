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
    ChevronRight,
    Layers,
    Tag,
    CalendarDays,
    Download,
    Maximize2,
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
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
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
                return { 
                    icon: CheckCircle, 
                    color: 'text-emerald-600', 
                    bgColor: 'bg-emerald-50', 
                    borderColor: 'border-emerald-200',
                    gradient: 'from-emerald-500 to-green-500',
                    lightBg: 'bg-emerald-500/10',
                    label: 'Approved' 
                };
            case 'reject':
            case 'rejected':
                return { 
                    icon: XCircle, 
                    color: 'text-rose-600', 
                    bgColor: 'bg-rose-50', 
                    borderColor: 'border-rose-200',
                    gradient: 'from-rose-500 to-pink-500',
                    lightBg: 'bg-rose-500/10',
                    label: 'Rejected' 
                };
            case 'complete':
            case 'completed':
                return { 
                    icon: CheckCircle, 
                    color: 'text-blue-600', 
                    bgColor: 'bg-blue-50', 
                    borderColor: 'border-blue-200',
                    gradient: 'from-blue-500 to-indigo-500',
                    lightBg: 'bg-blue-500/10',
                    label: 'Completed' 
                };
            default:
                return { 
                    icon: Clock, 
                    color: 'text-amber-600', 
                    bgColor: 'bg-amber-50', 
                    borderColor: 'border-amber-200',
                    gradient: 'from-amber-500 to-orange-500',
                    lightBg: 'bg-amber-500/10',
                    label: 'Pending' 
                };
        }
    };

    const statusConfig = getStatusConfig(data.status);
    const StatusIcon = statusConfig.icon;

    const product = data.product_id || {};
    const vendor = data.vendor_id || {};

    const vendorName = vendor.full_name || product.vendor_name || data.vendor_name || 'Unknown Vendor';
    const businessName = vendor.business_name || 'No Business Name';

    const productImages = product.images || [];

    const DetailCard = ({ icon: Icon, label, value, gradient }: any) => (
        <div className="group relative bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all duration-300 hover:border-slate-200">
            <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient || 'from-blue-500 to-indigo-500'} text-white shadow-sm`}>
                    <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{value || '—'}</p>
                </div>
            </div>
        </div>
    );

    const MediaCard = ({ url, type, label }: { url: string; type: 'image' | 'video'; label: string }) => {
        if (!url) return null;
        return (
            <div
                className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => setSelectedMedia({ url, type })}
            >
                <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-100">
                    {type === 'image' ? (
                        <img 
                            src={url} 
                            alt={label} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center mb-2 shadow-lg">
                                <Video size={24} className="text-blue-500" />
                            </div>
                            <p className="text-xs font-medium text-slate-600">Click to preview video</p>
                        </div>
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                            <Maximize2 size={20} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <p className="text-xs font-medium text-white truncate flex items-center gap-1.5">
                        <Eye size={12} className="opacity-75" />
                        {label}
                    </p>
                </div>
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase bg-white/20 backdrop-blur-sm text-white border border-white/30`}>
                        {type}
                    </span>
                </div>
            </div>
        );
    };

    const StatBadge = ({ icon: Icon, label, value, color }: any) => (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={16} className="text-white" />
            </div>
            <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );

    return (
        <>
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${
                    isVisible ? 'opacity-100 bg-black/60 backdrop-blur-sm' : 'opacity-0 bg-black/0 pointer-events-none'
                }`}
                onClick={onClose}
            >
                <div
                    className={`relative w-full max-w-6xl bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
                        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                    style={{ height: '90vh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Gradient */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 z-20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20`}>
                                    <StatusIcon size={14} className="text-white" />
                                    <span className="text-sm font-medium text-white">{statusConfig.label}</span>
                                </div>
                                
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="mt-4 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {product.product_name || 'Quote Request'}
                                </h2>
                                <p className="text-sm text-slate-300 flex items-center gap-2">
                                    <Building2 size={14} className="opacity-70" />
                                    Requested from: <span className="font-semibold text-white">{vendorName}</span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-300">{businessName}</span>
                                </p>
                            </div>
                          
                        </div>
                    </div>

                    {/* Scrollable Content - All sections in one flow */}
                    <div className="h-full pt-36 pb-24 overflow-y-auto custom-scrollbar">
                        <div className="px-6 py-6 space-y-8">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <StatBadge 
                                    icon={Package} 
                                    label="Quantity" 
                                    value={data.qty || '1'} 
                                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                                />
                                <StatBadge 
                                    icon={IndianRupee} 
                                    label="Total Price" 
                                    value={`₹${parseFloat(data.calculated_price || data.total_price || '0').toLocaleString('en-IN')}`}
                                    color="bg-gradient-to-br from-emerald-500 to-green-600"
                                />
                                <StatBadge 
                                    icon={CalendarDays} 
                                    label="Duration" 
                                    value={`${data.number_of_days || 'N/A'} days`}
                                    color="bg-gradient-to-br from-purple-500 to-pink-600"
                                />
                                <StatBadge 
                                    icon={Layers} 
                                    label="Month" 
                                    value={data.month_name || 'N/A'}
                                    color="bg-gradient-to-br from-orange-500 to-amber-600"
                                />
                            </div>

                            {/* Product Details Section */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                                    Product Information
                                </h3>
                                <div className="grid lg:grid-cols-2 gap-3">
                                    <DetailCard 
                                        icon={Package} 
                                        label="Product Type" 
                                        value={product.product_type_name} 
                                        gradient="from-blue-500 to-indigo-500"
                                    />
                                    <DetailCard 
                                        icon={Target} 
                                        label="Listing Type" 
                                        value={product.product_listing_type_name} 
                                        gradient="from-purple-500 to-pink-500"
                                    />
                                    <DetailCard 
                                        icon={Tag} 
                                        label="Category" 
                                        value={product.category_name} 
                                        gradient="from-emerald-500 to-teal-500"
                                    />
                                    <DetailCard 
                                        icon={Layers} 
                                        label="Sub Category" 
                                        value={product.sub_category_name} 
                                        gradient="from-orange-500 to-amber-500"
                                    />
                                </div>
                            </div>

                            {/* Timeline Section */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                                    Quote Timeline
                                </h3>
                                <div className="grid lg:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Calendar size={16} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500">Start Date</p>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {data.start_date ? new Date(data.start_date).toLocaleDateString('en-IN', { 
                                                    day: 'numeric', 
                                                    month: 'long', 
                                                    year: 'numeric' 
                                                }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <Calendar size={16} className="text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500">End Date</p>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {data.end_date ? new Date(data.end_date).toLocaleDateString('en-IN', { 
                                                    day: 'numeric', 
                                                    month: 'long', 
                                                    year: 'numeric' 
                                                }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <Calendar size={16} className="text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500">Delivery Date</p>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {data.delivery_date ? new Date(data.delivery_date).toLocaleDateString('en-IN', { 
                                                    day: 'numeric', 
                                                    month: 'long', 
                                                    year: 'numeric' 
                                                }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Media Section - Product Images */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                                    Product Gallery
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {product.product_main_image && (
                                        <MediaCard url={product.product_main_image} type="image" label="Main Image" />
                                    )}
                                    {productImages.map((img: any, idx: number) => (
                                        <MediaCard key={idx} url={img.image} type="image" label={`Image ${idx + 1}`} />
                                    ))}
                                    {(!product.product_main_image && productImages.length === 0) && (
                                        <div className="col-span-4 py-8 text-center bg-gradient-to-br from-slate-50 to-white rounded-lg border border-dashed border-slate-200">
                                            <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-sm text-slate-400">No product images available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Media Section - Vendor Uploads */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                                    Vendor Uploads
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {data.upload_image && <MediaCard url={data.upload_image} type="image" label="Provided Image" />}
                                    {data.upload_video && <MediaCard url={data.upload_video} type="video" label="Provided Video" />}
                                    {data.return_image && <MediaCard url={data.return_image} type="image" label="Return Image" />}
                                    {data.return_video && <MediaCard url={data.return_video} type="video" label="Return Video" />}
                                    {!data.upload_image && !data.upload_video && !data.return_image && !data.return_video && (
                                        <div className="col-span-4 py-8 text-center bg-gradient-to-br from-slate-50 to-white rounded-lg border border-dashed border-slate-200">
                                            <Video size={32} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-sm text-slate-400">No media uploaded by vendor</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Activity Timeline Section */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                                    Activity Timeline
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { date: data.createdAt, action: 'Quote created', user: 'System' },
                                        { date: data.updatedAt, action: 'Quote updated', user: 'Vendor' },
                                        data.status === 'approval' && { date: new Date().toISOString(), action: 'Quote approved', user: 'Admin' },
                                    ].filter(Boolean).map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="relative">
                                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                                {idx < 2 && <div className="absolute top-4 left-1 w-0.5 h-12 bg-slate-200"></div>}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="text-sm font-medium text-slate-800">{item.action}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(item.date).toLocaleString('en-IN', { 
                                                            day: 'numeric', 
                                                            month: 'short', 
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                    <span className="text-slate-300">•</span>
                                                    <p className="text-xs text-slate-500">by {item.user}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 z-20">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                                    Created: {data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'N/A'}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={onClose} 
                                    className="border-slate-200 hover:bg-slate-50"
                                >
                                    Close
                                </Button>
                                {data.status?.toLowerCase() === 'pending' && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleStatusChange('reject')}
                                            disabled={isUpdating}
                                            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-rose-500/25"
                                        >
                                            {isUpdating ? 'Updating...' : 'Reject Quote'}
                                        </Button>
                                        <Button
                                            onClick={() => handleStatusChange('approval')}
                                            disabled={isUpdating}
                                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 shadow-lg shadow-emerald-500/25"
                                        >
                                            {isUpdating ? 'Updating...' : 'Approve Quote'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Preview Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 "
                    onClick={() => setSelectedMedia(null)}
                >
                    <div className="relative w-full max-w-6xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button
                            className="absolute -top-14 right-0 p-3 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full backdrop-blur-sm"
                            onClick={() => setSelectedMedia(null)}
                        >
                            <X size={20} />
                        </button>
                        {selectedMedia.type === 'image' ? (
                            <img 
                                src={selectedMedia.url} 
                                alt="Preview" 
                                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl mx-auto" 
                            />
                        ) : (
                            <video 
                                src={selectedMedia.url} 
                                controls 
                                autoPlay 
                                className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl mx-auto"
                            />
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </>
    );
}