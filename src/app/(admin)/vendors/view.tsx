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
  MapPin,
  Calendar,
  Copy,
  Sparkles,
  Fingerprint,
  Landmark,
  FileCheck,
  Shield,
  Award,
  TrendingUp,
  Download,
  Share2,
  MoreVertical,
  Eye,
  Camera,
  BadgeCheck,
  AlertCircle,
  User,
  Briefcase,
  FileText,
  Home,
  ChevronRight,
  Globe,
  CreditCard,
  Hash,
  AtSign,
  PhoneCall,
  MapPinned,
  Building,
  UserCircle,
  FileBadge,
  ScrollText,
  Banknote,
  CalendarClock,
  Activity,
  Image,
  FileImage,
  Star,
  Medal,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Props = {
  open: boolean;
  data: any;
  onClose: () => void;
};

export default function VendorDetailsModal({ open, data, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  if (!open || !data) return null;

  const cleanUrl = (u?: string) => (u || '').replace(/`/g, '').trim();

  const status = String(data?.status || '').toLowerCase();
  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'approved':
        return { 
          icon: CheckCircle, 
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: 'Approved',
        };
      case 'rejected':
        return { 
          icon: XCircle, 
          color: 'text-rose-600',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          label: 'Rejected',
        };
      default:
        return { 
          icon: Clock, 
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Pending',
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const completed = Array.isArray(data?.completed_pages) ? data.completed_pages.length : 0;
  const total = 5;
  const percentage = Math.min(100, Math.round((completed / total) * 100));

  const doc = data?.Documents || {};
  const images: { key: string; label: string; url: string; type: string; icon: any }[] = [
    { key: 'business_logo_image', label: 'Business Logo', url: cleanUrl(doc?.business_logo_image), type: 'logo', icon: Building },
    { key: 'vendor_image', label: 'Profile Photo', url: cleanUrl(doc?.vendor_image), type: 'profile', icon: UserCircle },
    { key: 'pancard_front_image', label: 'PAN Card', url: cleanUrl(doc?.pancard_front_image), type: 'identity', icon: FileBadge },
    { key: 'aadharcard_front_image', label: 'Aadhaar Front', url: cleanUrl(doc?.aadharcard_front_image), type: 'identity', icon: ScrollText },
    { key: 'aadharcard_back_image', label: 'Aadhaar Back', url: cleanUrl(doc?.aadharcard_back_image), type: 'identity', icon: ScrollText },
    { key: 'gst_certificate_image', label: 'GST Certificate', url: cleanUrl(doc?.gst_certificate_image), type: 'business', icon: FileText },
  ].filter(img => img.url);

  const contact = data?.ContactDetails || {};
  const identity = data?.Identity || {};
  const bank = data?.Bank || {};

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const DetailRow = ({ icon: Icon, label, value, copyable = true }: any) => (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors duration-200 group">
      <div className="p-1.5 rounded-md bg-slate-100 text-slate-500">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-slate-400">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm font-medium text-slate-700 truncate">{value || '—'}</p>
          {copyable && value && value !== '—' && (
            <button
              onClick={() => copyToClipboard(value, label)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copiedField === label ? (
                <CheckCircle size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} className="text-slate-400 hover:text-slate-600" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const TimelineItem = ({ icon: Icon, title, time, status, isLast }: any) => {
    const statusColors = {
      completed: 'bg-emerald-100 text-emerald-600',
      active: 'bg-amber-100 text-amber-600 animate-pulse',
      pending: 'bg-slate-100 text-slate-400'
    };
    
    return (
      <div className="flex gap-3 relative">
        {!isLast && (
          <div className="absolute left-3.5 top-6 bottom-0 w-px bg-slate-200" />
        )}
        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
          status === 'completed' ? 'bg-emerald-100' : status === 'active' ? 'bg-amber-100' : 'bg-slate-100'
        }`}>
          <Icon size={12} className={
            status === 'completed' ? 'text-emerald-600' : 
            status === 'active' ? 'text-amber-600' : 'text-slate-400'
          } />
        </div>
        <div className="flex-1 pb-3">
          <p className="text-sm font-medium text-slate-700">{title}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{time}</p>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'identity', label: 'Identity', icon: Fingerprint },
    { id: 'financial', label: 'Financial', icon: Landmark },
    { id: 'documents', label: 'Documents', icon: FileImage },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isVisible ? 'opacity-100 bg-black/40' : 'opacity-0 bg-black/0 pointer-events-none'
        }`}
        onClick={onClose}
      >
        <div 
          className={`relative w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          style={{ height: '60vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 px-5 py-3 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                  <StatusIcon size={13} />
                  <span className="text-sm font-medium">{statusConfig.label}</span>
                </div>

                {/* Vendor ID */}
                {/* <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-200">
                  <Medal size={12} className="text-slate-400" />
                  <span className="font-mono text-xs text-slate-600">{contact?.vendor_id || 'N/A'}</span>
                </div> */}

                {/* Progress */}
                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-200">
                  <Target size={12} className="text-slate-400" />
                  <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[14px] font-medium text-slate-500">
                    {completed}/{total}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {[ Download].map((Icon, i) => (
                  <button key={i} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                    <Icon size={16} />
                  </button>
                ))}
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button 
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600" 
                  onClick={onClose}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-slate-100 text-slate-700'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area - Adjusted for smaller height */}
          <div className="h-full pt-28 pb-16 overflow-y-auto">
            <div className="px-5 py-3">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  {/* Profile Section - Compact */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-base font-semibold text-slate-800">
                            {contact?.full_name || 'N/A'}
                          </h2>
                          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Building2 size={11} />
                            {identity?.business_name || data?.business_name || 'Individual Vendor'}
                          </p>
                        </div>
                        <div className="px-2 py-1 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={10} className="text-slate-400" />
                            <p className="text-[10px] text-slate-600">
                              {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details - Compact */}
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <User size={15} className="text-slate-400" />
                        Contact Information
                      </h3>
                    </div>
                    <div className="p-2">
                      <div className="grid grid-cols-2 gap-0.5">
                        <DetailRow icon={Mail} label="Email" value={contact?.email} />
                        <DetailRow icon={Phone} label="Phone" value={contact?.mobile} />
                        <DetailRow icon={MapPin} label="Address" value={contact?.address} />
                        <div className="grid grid-cols-2 gap-0.5 col-span-2">
                          <DetailRow icon={Building} label="City" value={contact?.city_name} />
                          <DetailRow icon={Globe} label="Pincode" value={contact?.pincode} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Identity Tab - Compact */}
              {activeTab === 'identity' && (
                <div className="space-y-2">
                  {[
                    { title: 'Personal Identity', icon: Fingerprint, items: [
                      { icon: FileBadge, label: 'PAN', value: identity?.pancard_number },
                      { icon: ScrollText, label: 'Aadhaar', value: identity?.aadharcard_number }
                    ]},
                    { title: 'Business Identity', icon: Building2, items: [
                      { icon: Briefcase, label: 'Business Name', value: identity?.business_name || data?.business_name },
                      { icon: FileText, label: 'GST', value: identity?.gst_number }
                    ]}
                  ].map((section, idx) => (
                    <div key={idx} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                          <section.icon size={11} className="text-slate-400" />
                          {section.title}
                        </h3>
                      </div>
                      <div className="p-2">
                        <div className="grid grid-cols-2 gap-0.5">
                          {section.items.map((item, i) => (
                            <DetailRow key={i} icon={item.icon} label={item.label} value={item.value} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Financial Tab - Compact */}
              {activeTab === 'financial' && (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Landmark size={15} className="text-slate-400" />
                      Bank Details
                    </h3>
                  </div>
                  <div className="p-2">
                    <div className="grid grid-cols-2 gap-0.5">
                      <DetailRow icon={User} label="Account Holder" value={bank?.account_holder_name} />
                      <DetailRow icon={CreditCard} label="Account No" value={bank?.account_number} />
                      <DetailRow icon={Hash} label="IFSC" value={bank?.ifsc_code} />
                      <DetailRow icon={Banknote} label="Type" value={bank?.account_type} />
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab - Compact */}
              {activeTab === 'documents' && (
                <div>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {images.slice(0, 6).map((img, idx) => {
                        const Icon = img.icon;
                        return (
                          <div
                            key={img.key}
                            className="group relative bg-white rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:border-slate-300 transition-all"
                            onClick={() => setSelectedImage(img.url)}
                          >
                            <div className="aspect-square bg-slate-50">
                              {img.url ? (
                                <img
                                  src={img.url}
                                  alt={img.label}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                  <Icon size={20} className="text-slate-300 mb-1" />
                                  <p className="text-[10px] text-slate-400">No preview</p>
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent">
                              <p className="text-[15px] font-medium text-white truncate">{img.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
                      <Image size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No documents</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab - Compact */}
              {activeTab === 'activity' && (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <CalendarClock size={11} className="text-slate-400" />
                      Timeline
                    </h3>
                  </div>
                  <div className="p-2">
                    <div className="space-y-0.5">
                      <TimelineItem 
                        icon={User}
                        title="Registration"
                        time={data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}
                        status="completed"
                        isLast={false}
                      />
                      <TimelineItem 
                        icon={FileCheck}
                        title="Documents"
                        time={data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'N/A'}
                        status="completed"
                        isLast={false}
                      />
                      <TimelineItem 
                        icon={Shield}
                        title="Verification"
                        time={status === 'pending' ? 'In progress' : 'Completed'}
                        status={status === 'pending' ? 'active' : 'completed'}
                        isLast={false}
                      />
                      <TimelineItem 
                        icon={BadgeCheck}
                        title="Approval"
                        time={data?.approved_at ? new Date(data.approved_at).toLocaleDateString() : 'Pending'}
                        status={status === 'approved' ? 'completed' : status === 'pending' ? 'active' : 'pending'}
                        isLast={true}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Compact */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-5 py-2.5 z-20">
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="px-3 py-1.5 text-sm rounded-lg border-slate-200 hover:bg-slate-50"
              >
                Close
              </Button>
              {status === 'pending' && (
                <>
                  <Button 
                    variant="destructive" 
                    className="px-3 py-1.5 text-sm rounded-lg bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="primary" 
                    className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[70vh]">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <button 
              className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}