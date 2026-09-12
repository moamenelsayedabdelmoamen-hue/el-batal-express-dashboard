import React from 'react';
import { OrderStatus, SubscriptionStatus, CaptainStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | SubscriptionStatus | CaptainStatus | boolean | string;
  type?: 'order' | 'subscription' | 'captain' | 'restaurant' | 'payment';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order' }) => {
  if (type === 'restaurant' || typeof status === 'boolean') {
    const isActive = Boolean(status);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
          isActive
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
        {isActive ? 'نشط' : 'موقوف'}
      </span>
    );
  }

  if (type === 'captain') {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            متصل (Online)
          </span>
        );
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            في توصيل (Busy)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            غير متصل (Offline)
          </span>
        );
    }
  }

  if (type === 'subscription') {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            ساري (Active)
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            معلق (Pending)
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
            منتهي (Expired)
          </span>
        );
      case 'Suspended':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 whitespace-nowrap">
            موقوف (Suspended)
          </span>
        );
      default:
        return <span className="text-xs text-zinc-400">{String(status)}</span>;
    }
  }

  if (type === 'payment') {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            ناجحة
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            قيد المعالجة
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
            فاشلة
          </span>
        );
      default:
        return <span className="text-xs text-zinc-400">{String(status)}</span>;
    }
  }

  // Order status
  switch (status) {
    case 'New':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25 whitespace-nowrap">
          جديد
        </span>
      );
    case 'Accepted':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 whitespace-nowrap">
          مقبول
        </span>
      );
    case 'Preparing':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 whitespace-nowrap">
          قيد التحضير
        </span>
      );
    case 'Ready':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/25 whitespace-nowrap">
          جاهز للتوصيل
        </span>
      );
    case 'Picked Up':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25 whitespace-nowrap">
          تم الاستلام
        </span>
      );
    case 'Delivered':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 whitespace-nowrap">
          تم التوصيل
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/25 whitespace-nowrap">
          ملغي
        </span>
      );
    default:
      return <span className="text-xs text-zinc-400">{String(status)}</span>;
  }
};
