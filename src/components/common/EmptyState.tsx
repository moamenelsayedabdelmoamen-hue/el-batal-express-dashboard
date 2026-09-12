import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'لا توجد بيانات متاحة حالياً',
  description = 'لم يتم العثور على أي عناصر تطابق معايير البحث أو التصفية الحالية.',
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#101319]/60 border border-zinc-800/80 rounded-2xl">
      <div className="w-14 h-14 mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-zinc-200 mb-1.5">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
