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
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Props = {
  open: boolean;
  data: any;
  onClose: () => void;
};

export default function VendorDetailsModal({ open, data, onClose }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'profile', 'contact', 'identity', 'financial', 'documents', 'activity'
  ]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  if (!open || !data) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

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
  console.log("🚀 ~ VendorDetailsModal ~ bank:", bank)

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
        <p className="text-xs text-slate-400">{label}</p>
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
  const iconColor =
    status === "completed"
      ? "bg-emerald-100 text-emerald-600"
      : status === "active"
      ? "bg-amber-100 text-amber-600"
      : "bg-slate-100 text-slate-400";

  return (
    <div className="flex flex-col items-center relative flex-1">
      
      {/* Line */}
      {!isLast && (
        <div className="absolute top-3 left-1/2 w-full h-[2px] bg-slate-200 z-0"></div>
      )}

      {/* Icon */}
      <div
        className={`z-10 w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}
      >
        <Icon size={16} />
      </div>

      {/* Text */}
      <div className="text-center mt-2">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-400">{time}</p>
      </div>
    </div>
  );
};

  const Section = ({ id, title, icon: Icon, children, defaultExpanded = true }: any) => {
    const isExpanded = expandedSections.includes(id);
    
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-3">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>
        {isExpanded && (
          <div className="p-4">
            {children}
          </div>
        )}
      </div>
    );
  };

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
          style={{ height: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 px-5 py-3 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                  <StatusIcon size={13} />
                  <span className="text-sm font-medium">{statusConfig.label}</span>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-200">
                  <Target size={12} className="text-slate-400" />
                  <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {completed}/{total}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                  <Download size={16} />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button 
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600" 
                  onClick={onClose}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Vendor Name */}
            <div className="mt-3">
              <h2 className="text-xl font-bold text-slate-800">
                {contact?.full_name || 'N/A'}
              </h2>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Building2 size={14} />
                {identity?.business_name || data?.business_name || 'Individual Vendor'}
              </p>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="h-full pt-28 pb-16 overflow-y-auto">
            <div className="px-5 py-4">
              {/* Profile Section - Quick Info */}
              {/* <Section id="profile" title="Profile Overview" icon={User} defaultExpanded={true}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Vendor ID</p>
                    <p className="text-sm font-mono text-slate-700">{contact?.vendor_id || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Member Since</p>
                    <p className="text-sm text-slate-700">
                      {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </Section> */}

              {/* Contact Information */}
              <Section id="contact" title="Contact Information" icon={Mail} defaultExpanded={true}>
                <div className="grid grid-cols-2 gap-2">
                  <DetailRow icon={Mail} label="Email" value={contact?.email} />
                  <DetailRow icon={Phone} label="Phone" value={contact?.mobile} />
                  <DetailRow icon={MapPin} label="Address" value={contact?.address} />
                  <DetailRow icon={Building} label="City" value={contact?.city_name} />
                  <DetailRow icon={Globe} label="Pincode" value={contact?.pincode} />
                  <DetailRow icon={MapPinned} label="State" value={contact?.state_name} />
                </div>
              </Section>

              {/* Identity Details */}
              <Section id="identity" title="Identity Details" icon={Fingerprint} defaultExpanded={true}>
                <div className="grid grid-cols-2 gap-2">
                  <DetailRow icon={FileBadge} label="PAN Number" value={identity?.pancard_number} />
                  <DetailRow icon={ScrollText} label="Aadhaar Number" value={identity?.aadharcard_number} />
                  <DetailRow icon={Briefcase} label="Business Name" value={identity?.business_name || data?.business_name} />
                  <DetailRow icon={FileText} label="GST Number" value={identity?.gst_number} />
                </div>
              </Section>

              {/* Financial Details */}
              <Section id="financial" title="Financial Details" icon={Landmark} defaultExpanded={true}>
                <div className="grid grid-cols-2 gap-2">
                  <DetailRow icon={User} label="Account Holder" value={bank?.account_holder_name} />
                  <DetailRow icon={CreditCard} label="Account Number" value={bank?.account_number} />
                  <DetailRow icon={Hash} label="IFSC Code" value={bank?.ifsc_code} />
                  <DetailRow icon={Banknote} label="Account Type" value={bank?.account_type_name} />
                  {/* <DetailRow icon={Building} label="Bank Name" value={bank?.bank_name} /> */}
                  {/* <DetailRow icon={MapPin} label="Branch" value={bank?.branch_name} /> */}
                </div>
              </Section>

              {/* Documents */}
              <Section id="documents" title="Documents" icon={FileImage} defaultExpanded={true}>
                {images.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((img, idx) => {
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
                                <Icon size={24} className="text-slate-300 mb-1" />
                                <p className="text-xs text-slate-400">No preview</p>
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                            <p className="text-xs font-medium text-white truncate">{img.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Image size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No documents uploaded</p>
                  </div>
                )}
              </Section>

              {/* Activity Timeline */}
            <Section id="activity" title="Activity Timeline" icon={Activity} defaultExpanded={true}>
  <div className="flex items-start justify-between gap-6 w-full">
    
    <TimelineItem
      icon={User}
      title="Registration"
      time={data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : "N/A"}
      status="completed"
      isLast={false}
    />

    <TimelineItem
      icon={FileCheck}
      title="Documents Submitted"
      time={data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : "N/A"}
      status="completed"
      isLast={false}
    />

    <TimelineItem
      icon={Shield}
      title="Verification"
      time={status === "pending" ? "In progress" : "Completed"}
      status={status === "pending" ? "active" : "completed"}
      isLast={false}
    />

    <TimelineItem
      icon={BadgeCheck}
      title="Approval"
      time={data?.approved_at ? new Date(data.approved_at).toLocaleDateString() : "Pending"}
      status={
        status === "approved"
          ? "completed"
          : status === "pending"
          ? "active"
          : "pending"
      }
      isLast={true}
    />
    
  </div>
</Section>
            </div>
          </div>

          {/* Footer - Fixed with Actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-5 py-3 z-20">
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border-slate-200 hover:bg-slate-50"
              >
                Close
              </Button>
              {status === 'pending' && (
                <>
                  <Button 
                    variant="destructive" 
                    className="px-4 py-2 text-sm rounded-lg bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="primary" 
                    className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-900 text-white"
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
          <div className="relative max-w-3xl max-h-[80vh]">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <button 
              className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}