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
    CreditCard,
    ChevronDown,
    Loader2,
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
    const [depositStatus, setDepositStatus] = useState(data?.deposit_status || 'pending');
    const [isUpdatingDeposit, setIsUpdatingDeposit] = useState(false);

    useEffect(() => {
        setDepositStatus(data?.deposit_status || 'pending');
    }, [data?.deposit_status]);

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

    const handleDepositStatusChange = async (newStatus: string) => {
        if (!newStatus || newStatus === depositStatus || isUpdatingDeposit) return;
        setIsUpdatingDeposit(true);
        try {
            const response = await api.post(endPointApi.updateDepositStatus, {
                quote_id: data.id || data._id,
                deposit_status: newStatus,
            });
            if (response.data.success || response.data.status === 200) {
                setDepositStatus(newStatus);
                toast.success(`Deposit status updated to ${newStatus.toUpperCase()}`);
                if (onStatusUpdate) onStatusUpdate();
            } else {
                toast.error(response.data.message || "Failed to update deposit status");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update deposit status");
        } finally {
            setIsUpdatingDeposit(false);
        }
    };

    if (!open || !data) return null;

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);
        const quoteId = data._id || data.id;
        try {
            const response = await api.post(endPointApi.changeQuoteStatus, {
                quote_id: quoteId,
                id: quoteId,
                status: newStatus,
            });

            if (response.data.success || response.data.status === 200) {
                toast.success(`Quote status updated to ${newStatus.toUpperCase()}`);
                data.status = newStatus;
                if (onStatusUpdate) onStatusUpdate();
            } else {
                toast.error(response.data.message || "Failed to update status");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || "Failed to update status");
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

    const parseDeposit = (val: any) => {
        if (!val && val !== 0) return 0;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/,/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    const rawQuoteDeposit = parseDeposit(data.deposit_amount);
    const rawProductDeposit = parseDeposit(product.deposit_amount);
    const depositAmount = rawQuoteDeposit > 0 ? rawQuoteDeposit : rawProductDeposit;

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
                    <p className="text-sm font-medium text-slate-400 ">{label}</p>
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
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30`}>
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
                    className={`relative w-full max-w-5xl bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
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
                                    <span className="text-sm font-medium text-white">Status: {statusConfig.label}</span>
                                </div>
                                {data.payment_status && (
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20`}>
                                        <IndianRupee size={14} className="text-white" />
                                        <span className="text-sm font-medium text-white">Payment: {data.payment_status.charAt(0).toUpperCase() + data.payment_status.slice(1)}</span>
                                    </div>
                                )}
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
                                    {/* <span className="text-slate-400">•</span> */}
                                      {/* <span className="text-slate-300">{businessName}</span> */}
                                </p>
                            </div>
                          
                        </div>
                    </div>

                    {/* Scrollable Content - All sections in one flow */}
                    <div className="h-full pt-36 pb-24 overflow-y-auto custom-scrollbar">
                        <div className="px-6 py-6 space-y-8">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                                    icon={IndianRupee} 
                                    label="Deposit Amount" 
                                    value={`₹${Number(depositAmount).toLocaleString('en-IN')}`} 
                                    color="bg-gradient-to-br from-indigo-500 to-violet-600"
                                />
                                <StatBadge 
                                    icon={CalendarDays} 
                                    label="Duration" 
                                    value={`${data.number_of_days || '-'} days`} 
                                    color="bg-gradient-to-br from-purple-500 to-pink-600"
                                />
                                <StatBadge 
                                    icon={Layers} 
                                    label="Month" 
                                    value={data.month_name || '-'} 
                                    color="bg-gradient-to-br from-orange-500 to-amber-600"
                                />
                            </div>

                            {/* Customer Information Section */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full"></div>
                                    Customer Information
                                </h3>
                                <div className="grid lg:grid-cols-3 gap-3">
                                    <DetailCard 
                                        icon={User} 
                                        label="Customer Name" 
                                        value={
                                            (typeof data.user_id === 'object' && (data.user_id?.name || data.user_id?.full_name || (data.user_id?.first_name ? `${data.user_id.first_name} ${data.user_id?.last_name || ''}`.trim() : null))) ||
                                            data.customer_name ||
                                            data.user_name ||
                                            'N/A'
                                        } 
                                        gradient="from-blue-600 to-indigo-600"
                                    />
                                    <DetailCard 
                                        icon={Phone} 
                                        label="Contact Number" 
                                        value={
                                            (typeof data.user_id === 'object' && (data.user_id?.mobile || data.user_id?.phone || data.user_id?.contact_number)) ||
                                            data.customer_mobile ||
                                            data.customer_phone ||
                                            data.mobile ||
                                            data.phone ||
                                            'N/A'
                                        } 
                                        gradient="from-emerald-600 to-teal-600"
                                    />
                                    <DetailCard 
                                        icon={Mail} 
                                        label="Email Address" 
                                        value={
                                            (typeof data.user_id === 'object' && data.user_id?.email) ||
                                            data.customer_email ||
                                            data.email ||
                                            'N/A'
                                        } 
                                        gradient="from-purple-600 to-pink-600"
                                    />
                                </div>
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
                                                }) : '-'}
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
                                                }) : '-'}
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
                                                }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details Section */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                                    Payment Information
                                </h3>
                                <div className="grid lg:grid-cols-2 gap-3">
                                    <DetailCard 
                                        icon={User} 
                                        label="Customer Payment" 
                                        value={data.total_price ? `₹${Number(data.total_price).toLocaleString('en-IN')}` : '—'} 
                                        gradient="from-blue-500 to-indigo-500"
                                    />
                                    <DetailCard 
                                        icon={Building2} 
                                        label="Admin Payment" 
                                        value={data.vendor_amount ? `₹${Number(data.vendor_amount).toLocaleString('en-IN')}` : '—'} 
                                        gradient="from-emerald-500 to-teal-500"
                                    />
                                    <DetailCard 
                                        icon={CheckCircle} 
                                        label="Payment Status" 
                                        value={data.payment_status || 'Pending'} 
                                        gradient="from-amber-500 to-orange-500"
                                    />
                                    {/* Security Deposit Card */}
                                    <div className="group relative bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all duration-300 hover:border-slate-200">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                                                    <IndianRupee size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-400">Security Deposit</p>
                                                    <p className="text-sm font-semibold text-slate-800 mt-1">
                                                        ₹{Number(depositAmount).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className="text-[11px] font-medium text-slate-400">Deposit Status</span>
                                                <div className="inline-flex items-center">
                                                    <select
                                                        value={depositStatus}
                                                        disabled={isUpdatingDeposit}
                                                        onChange={(e) => handleDepositStatusChange(e.target.value)}
                                                        className={`text-xs font-semibold py-1 px-2.5 rounded-md border transition-colors cursor-pointer outline-none ${
                                                            depositStatus === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                                                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                                        } ${isUpdatingDeposit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="paid">Paid</option>
                                                    </select>
                                                    {isUpdatingDeposit && <Loader2 size={12} className="ml-1.5 animate-spin text-slate-500" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <DetailCard 
                                        icon={FileText} 
                                        label="Transaction ID" 
                                        value={data.transaction_id || data.payment_id || '—'} 
                                        gradient="from-slate-500 to-slate-700"
                                    />
                                    <DetailCard 
                                        icon={CreditCard} 
                                        label="Payment Method" 
                                        value={data.payment_method || 'Online'} 
                                        gradient="from-purple-500 to-pink-500"
                                    />
                                    <DetailCard 
                                        icon={Clock} 
                                        label="Payment Date" 
                                        value={data.payment_date ? new Date(data.payment_date).toLocaleDateString('en-IN', { 
                                            day: 'numeric', 
                                            month: 'short', 
                                            year: 'numeric' 
                                        }) : '—'} 
                                        gradient="from-orange-500 to-amber-500"
                                    />
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
                                    }) : '-'}
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
                                {data.status?.toLowerCase() === 'pending' ? (
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
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-500">Change Status:</span>
                                        <select
                                            value={data.status || 'pending'}
                                            disabled={isUpdating}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            className="text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm outline-none cursor-pointer hover:border-slate-400 focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approval">Approved</option>
                                            <option value="delivery">In Delivery</option>
                                            <option value="complete">Completed</option>
                                            <option value="reject">Rejected</option>
                                        </select>
                                    </div>
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