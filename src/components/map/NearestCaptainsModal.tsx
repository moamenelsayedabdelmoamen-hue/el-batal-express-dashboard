import React, { useState, useMemo } from 'react';
import { X, Navigation, Phone, Bike, Clock, CheckCircle, ExternalLink, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Restaurant, Captain, NearestCaptainResult } from '../../types';
import { LiveMapService } from '../../services/liveMapService';

interface NearestCaptainsModalProps {
  isOpen: boolean;
  restaurant: Restaurant | null;
  captains: Captain[];
  onClose: () => void;
  onAssignToOrder?: (captain: Captain) => void;
}

export const NearestCaptainsModal: React.FC<NearestCaptainsModalProps> = ({
  isOpen,
  restaurant,
  captains,
  onClose,
  onAssignToOrder,
}) => {
  const navigate = useNavigate();
  const [requireFreshLocation, setRequireFreshLocation] = useState(false);
  const [freshnessMinutes, setFreshnessMinutes] = useState(3);

  const nearestCaptains: NearestCaptainResult[] = useMemo(() => {
    if (!restaurant?.coords) return [];

    return LiveMapService.findNearestCaptains(
      restaurant.coords.lat,
      restaurant.coords.lng,
      captains,
      {
        thresholdMinutes: freshnessMinutes,
        requireFreshLocation,
        maxResults: 15,
      }
    );
  }, [restaurant, captains, requireFreshLocation, freshnessMinutes]);

  if (!isOpen || !restaurant) return null;

  const handleCreateOrderWithCaptain = (captain: Captain) => {
    onClose();
    // Pre-fill /send-order page
    navigate(
      `/send-order?restaurantId=${restaurant.id}&restaurantName=${encodeURIComponent(
        restaurant.name
      )}&captainId=${captain.id}&captainName=${encodeURIComponent(captain.name)}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#0d1017] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-100">
                أقرب كباتن متاحين للمطعم
              </h3>
              <p className="text-xs text-zinc-400">
                المطعم:{' '}
                <span className="font-bold text-amber-400">{restaurant.name}</span>
                {restaurant.address && ` (${restaurant.address})`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="p-4 bg-zinc-950/50 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-zinc-300">خيارات التصفية:</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-300">
            <input
              type="checkbox"
              checked={requireFreshLocation}
              onChange={(e) => setRequireFreshLocation(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500/30 bg-zinc-900"
            />
            <span>استبعاد المواقع غير المحدثة (خلال {freshnessMinutes} دقائق)</span>
          </label>
        </div>

        {/* List of Nearest Captains */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {nearestCaptains.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                <Bike className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-zinc-200 text-sm">
                لا يوجد كباتن متاحين حالياً بالقرب من هذا المطعم
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {requireFreshLocation
                  ? 'جرب إلغاء تفعيل شرط تحديث الموقع خلال 3 دقائق لعرض الكباتن المسجلين.'
                  : 'تأكد من وجود كباتن متصلين (Online) ومتاحين ولديهم إحداثيات GPS مسجلة.'}
              </p>
            </div>
          ) : (
            nearestCaptains.map((item, index) => {
              const { captain, distanceKm, formattedDistance, isFresh, formattedTime } = item;

              return (
                <div
                  key={captain.id}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 font-extrabold text-xs flex items-center justify-center shrink-0 group-hover:border-amber-500/50 group-hover:text-amber-400">
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-zinc-100 truncate">
                          {captain.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          متاح
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1 font-mono text-zinc-300">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          {captain.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5 text-zinc-500" />
                          {captain.vehicleType || 'دراجة نارية'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Distance & Freshness Badges + Action Buttons */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                    <div className="text-left sm:text-right">
                      <div className="font-extrabold text-sm text-amber-400 flex items-center gap-1">
                        <span>{formattedDistance}</span>
                        <span className="text-[10px] font-normal text-zinc-400">(مباشر)</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className={isFresh ? 'text-emerald-400' : 'text-amber-400/80'}>
                          {formattedTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${captain.phone}`}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-colors"
                        title="اتصال بالكابتن"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCreateOrderWithCaptain(captain)}
                        className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="إسناد وإرسال طلب لهذا الكابتن"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>إسناد طلب</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>تم حساب المسافات باستخدام صيغة Haversine الجغرافية المباشرة.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
