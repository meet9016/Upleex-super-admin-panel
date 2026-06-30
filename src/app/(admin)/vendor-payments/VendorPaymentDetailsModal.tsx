"use client";

import React, { useState } from "react";
import { X, Calendar, DollarSign, Package, User, CreditCard, Hash, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VendorPayment, SafeOrderInfo } from "@/types/vendorPayment";
import ConfirmModal from "@/components/common/ConfirmModal";
import PromptModal from "@/components/common/PromptModal";

interface VendorPaymentDetailsModalProps {
    open: boolean;
    data: VendorPayment | null;
    onClose: () => void;
    onReleasePayment?: (paymentId: string, notes?: string) => void;
    isReleasing?: boolean;
}

const VendorPaymentDetailsModal: React.FC<VendorPaymentDetailsModalProps> = ({
    open,
    data,
    onClose,
    onReleasePayment,
    isReleasing = false
}) => {
    const [notes, setNotes] = useState('');
    const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);
    
    if (!open || !data) return null;

    const isRent = !!data.quote_id;
    const typeLabel = isRent ? "Rent" : "Sell";
    const idLabel = isRent ? "Quote ID" : "Order ID";
    const amountLabel = isRent ? "Rental Amount" : "Order Amount";

    // Safety check for order/quote info
    let orderInfo: SafeOrderInfo = {
        order_id: 'N/A',
        user_name: 'Unknown Customer',
        total_amount: 0
    };
    
    if (data.order_id) {
        orderInfo = {
            order_id: data.order_id.order_id || 'N/A',
            user_name: data.order_id.user_name || 'Unknown Customer',
            total_amount: data.order_id.total_amount || 0
        };
    } else if (data.quote_id) {
        orderInfo = {
            order_id: `Q#${data.quote_id._id.slice(-6).toUpperCase()}`,
            user_name: data.quote_id.user_id?.name || data.quote_id.user_id?.first_name || 'Unknown Customer',
            total_amount: data.quote_id.calculated_price || 0
        };
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { color: "bg-orange-100 text-orange-800 border-orange-200", text: "Pending" },
            released: { color: "bg-green-100 text-green-800 border-green-200", text: "Released" },
            failed: { color: "bg-red-100 text-red-800 border-red-200", text: "Failed" },
            cancelled: { color: "bg-gray-100 text-gray-800 border-gray-200", text: "Cancelled" }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const canReleasePayment = () => {
        // Only allow release if payment is pending AND release_date has passed
        return data.payment_status === 'pending' && data.release_date && new Date() >= new Date(data.release_date);
    };

    const handleReleaseClick = () => {
        setReleaseConfirmOpen(true);
    };

    const handleReleaseConfirm = () => {
        if (onReleasePayment) {
            onReleasePayment(data._id, notes.trim() || undefined);
        }
        setReleaseConfirmOpen(false);
    };

    return (
      <>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">

    {/* HEADER */}
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-800 to-gray-700">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-xl shadow-sm">
          <DollarSign className="h-6 w-6 text-blue-600" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-50">
            Payment Details <span className="text-sm font-normal opacity-80">({typeLabel})</span>
          </h2>
          <p className="text-xs text-gray-100 ">
            {idLabel} : {orderInfo.order_id}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getPaymentStatusBadge(data.payment_status)}

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-600 transition"
        >
          <X size={20} className="text-gray-50" />
        </button>
      </div>
    </div>

    {/* BODY */}
    <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-6 space-y-6">

      {/* TOP SUMMARY */}
      <div className="grid md:grid-cols-3 gap-5">
        {[{
          icon: Package,
          label: amountLabel,
          value: formatAmount(orderInfo.total_amount),
          color: "blue"
        },
        {
          icon: DollarSign,
          label: "Vendor Amount",
          value: formatAmount(data.vendor_amount),
          color: "green"
        },
        {
          icon: User,
          label: "Customer",
          value: orderInfo.user_name,
          color: "purple"
        }].map((card, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white shadow-md border border-gray-100 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-${card.color}-100`}>
                <card.icon className={`text-${card.color}-600`} />
              </div>

              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-800">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DETAILS */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* ORDER INFO */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            {typeLabel} Information
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{idLabel}</span>
              <span className="font-mono text-gray-800">
                {orderInfo.order_id}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-800">
                {orderInfo.user_name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-bold text-gray-900">
                {formatAmount(orderInfo.total_amount)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Vendor ID</span>
              <span className="font-mono text-gray-700">
                {data.vendor_id}
              </span>
            </div>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-purple-600" />
            Payment Timeline
          </h3>

          <div className="space-y-4">

            {[
            { label: isRent ? "Completed" : "Delivered", value: formatDate(data.delivered_at) },
            { label: "Release Date", value: formatDate(data.release_date) },
              data.released_at && {
                label: "Released At",
                value: formatDate(data.released_at)
              }
            ].filter(Boolean).map((item: any, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* NOTES */}
      {(data.notes || canReleasePayment()) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Hash size={18} className="text-indigo-600" />
            Notes & Actions
          </h3>

          {data.notes && (
            <div className="mb-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
              {data.notes}
            </div>
          )}

          {canReleasePayment() && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add release notes..."
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
          )}
        </div>
      )}
    </div>

    {/* FOOTER */}
    <div className="border-t border-gray-200 px-6 py-5 bg-gray-50 flex justify-between items-center">

      <div>
        <p className="text-sm text-gray-500">Vendor Amount</p>
        <p className="text-2xl font-bold text-green-600">
          {formatAmount(data.vendor_amount)}
        </p>
      </div>

      <div className="flex gap-3">

        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-xl"
        >
          Close
        </Button>

        {canReleasePayment() && (
          <Button
            onClick={handleReleaseClick}
            disabled={isReleasing}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl shadow-md hover:shadow-lg"
          >
            {isReleasing ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Releasing...
              </>
            ) : (
              <>
                <DollarSign size={16} className="mr-2" />
                Release Payment
              </>
            )}
          </Button>
        )}
      </div>
    </div>
        </div>
      </div>

      {/* Release Payment Confirmation Modal */}
      <ConfirmModal
        open={releaseConfirmOpen}
        title="Release Payment?"
        description={`Are you sure you want to release payment for Order ${orderInfo.order_id}?\n\nCustomer: ${orderInfo.user_name}\nVendor Amount: ${formatAmount(data.vendor_amount)}\n\nThis action cannot be undone.`}
        confirmText="Release"
        cancelText="Cancel"
        onCancel={() => setReleaseConfirmOpen(false)}
        onConfirm={handleReleaseConfirm}
      />
      </>
    );
};

export default VendorPaymentDetailsModal;
