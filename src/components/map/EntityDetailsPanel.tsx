import React from 'react';
import {
  X,
  Store,
  Bike,
  Navigation,
  Phone,
  Clock,
  Send,
  MapPin,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Restaurant, Captain, Order } from '../../types';
import { isLocationFresh, formatDistanceArabic, haversineDistanceKm } from '../../utils/geoUtils';

interface EntityDetailsPanelProps {
  selectedRestaurant: Restaurant | null;
  selectedCaptain: Captain | null;
  selectedOrder: Order | null;
  restaurants: Restaurant[];
  captains: Captain[];
  activeOrders: Order[];
  onClose: () => void;
  onFindNearestCaptain: (restaurant: Restaurant) => void;
}

export const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({
  selectedRestaurant,
  selectedCaptain,
  selectedOrder,
  restaurants,
  captains,
  activeOrders,
  onClose,
  onFindNearestCaptain,
}) => {
  const navigate = useNavigate();

  if (!selectedRestaurant && !selectedCaptain && !selectedOrder) {
    return null;
  }

  // Case 1: Restaurant Details
  if (selectedRestaurant) {
    const restaurantActiveOrders = activeOrders.filter(
      (o) => o.restaurantId === selectedRestaurant.id
    );

    return (
      <div className="p-5 rounded-2xl bg-[#0d1017] border border-zinc-800 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              {selectedRestaurant.logo ? (
                <img
                  src={selectedRestaurant.logo}
                  alt={selectedRestaurant.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Store className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-zinc-100">
                  {selectedRestaurant.name}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedRestaurant.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {selectedRestaurant.isActive ? 'نشط' : 'غير نشط'}
                </span>
              </div>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">
                {selectedRestaurant.category || 'مطعم'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="font-mono">{selectedRestaurant.phone || '—'}</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="truncate">{selectedRestaurant.address || 'العنوان غير محدد'}</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              الطلبات النشطة:{' '}
              <strong className="text-amber-400 font-extrabold font-mono">
                {restaurantActiveOrders.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>التقييم: ⭐ {selectedRestaurant.rating || 5.0}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => onFindNearestCaptain(selectedRestaurant)}
            className="flex-1 min-w-[170px] py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>البحث عن أقرب كابتن</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/send-order?restaurantId=${selectedRestaurant.id}&restaurantName=${encodeURIComponent(
                  selectedRestaurant.name
                )}`
              )
            }
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>إرسال طلب جديد</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/restaurants/${selectedRestaurant.id}/orders`)}
            className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800 transition-all"
            title="عرض سجل طلبات المطعم"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Captain Details
  if (selectedCaptain) {
    const freshness = isLocationFresh(selectedCaptain.lastLocationUpdate);
    const isAvailable = selectedCaptain.status === 'available' || selectedCaptain.status === 'online';
    const isBusy = selectedCaptain.status === 'busy';

    // Find active order if busy
    const captainActiveOrder = activeOrders.find((o) => o.captainId === selectedCaptain.id);

    return (
      <div className="p-5 rounded-2xl bg-[#0d1017] border border-zinc-800 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 ${
                isBusy
                  ? 'bg-amber-600/20 text-amber-400 border-amber-500/40'
                  : isAvailable
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-zinc-100">
                  {selectedCaptain.name}
                </h4>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    isBusy
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : isAvailable
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {isBusy ? 'في رحلة توصيل' : isAvailable ? 'متاح للطلب' : 'غير متصل'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {selectedCaptain.vehicleType || 'دراجة نارية'} • تقييم ⭐{' '}
                {selectedCaptain.rating || 5.0}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="font-mono">{selectedCaptain.phone || '—'}</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>
              آخر تحديث للموقع:{' '}
              <strong
                className={freshness.isFresh ? 'text-emerald-400' : 'text-amber-400'}
              >
                {freshness.formattedTime}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <ShoppingBag className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>
              إجمالي الطلبات المنجزة:{' '}
              <strong className="text-zinc-100 font-mono">
                {selectedCaptain.ordersCount || 0}
              </strong>
            </span>
          </div>

          {captainActiveOrder && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                رحلة نشطة: {captainActiveOrder.orderNumber}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
          <a
            href={`tel:${selectedCaptain.phone}`}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>اتصال بالكابتن</span>
          </a>

          {isAvailable && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/send-order?captainId=${selectedCaptain.id}&captainName=${encodeURIComponent(
                    selectedCaptain.name
                  )}`
                )
              }
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال طلب للكابتن</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Case 3: Active Order / Trip Details
  if (selectedOrder) {
    const rest = restaurants.find((r) => r.id === selectedOrder.restaurantId);
    const capt = captains.find((c) => c.id === selectedOrder.captainId);

    let distanceText = '—';
    if (rest?.coords && capt?.coords) {
      const dist = haversineDistanceKm(
        rest.coords.lat,
        rest.coords.lng,
        capt.coords.lat,
        capt.coords.lng
      );
      distanceText = formatDistanceArabic(dist);
    }

    return (
      <div className="p-5 rounded-2xl bg-[#0d1017] border border-zinc-800 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-zinc-100">
                  تفاصيل الرحلة {selectedOrder.orderNumber}
                </h4>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {selectedOrder.status}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                المسافة المباشرة بين المطعم والكابتن:{' '}
                <strong className="text-amber-400 font-bold">{distanceText}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Route Steps */}
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" />
              <span className="text-zinc-400">المطعم:</span>
              <strong className="text-zinc-100">{selectedOrder.restaurantName}</strong>
            </div>
            {rest?.phone && (
              <a href={`tel:${rest.phone}`} className="text-amber-400 hover:underline">
                {rest.phone}
              </a>
            )}
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-400">الكابتن:</span>
              <strong className="text-zinc-100">{selectedOrder.captainName || '—'}</strong>
            </div>
            {capt?.phone && (
              <a href={`tel:${capt.phone}`} className="text-emerald-400 hover:underline">
                {capt.phone}
              </a>
            )}
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-400">عنوان التوصيل:</span>
              <strong className="text-zinc-100 truncate max-w-xs">
                {selectedOrder.deliveryAddress || 'عنوان العميل غير محدد'}
              </strong>
            </div>
            <span className="text-zinc-300 font-mono">
              {selectedOrder.total} ج.م
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            <span>عرض في جدول الطلبات</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
