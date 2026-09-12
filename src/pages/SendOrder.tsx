import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Search,
  UtensilsCrossed,
  Bike,
  Check,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Restaurant, Captain } from '../types';
import { RestaurantService } from '../services/restaurantService';
import { CaptainService } from '../services/captainService';
import { OrderService } from '../services/orderService';
import { useToast } from '../contexts/ToastContext';

export const SendOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  // Data sources
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Selected entities
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCaptain, setSelectedCaptain] = useState<Captain | null>(null);

  // Search queries & dropdown states
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [isRestaurantDropdownOpen, setIsRestaurantDropdownOpen] = useState(false);

  const [captainSearch, setCaptainSearch] = useState('');
  const [isCaptainDropdownOpen, setIsCaptainDropdownOpen] = useState(false);

  // Form fields
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number | ''>(25);
  const [notes, setNotes] = useState('');

  // Dropdown refs
  const restaurantRef = useRef<HTMLDivElement>(null);
  const captainRef = useRef<HTMLDivElement>(null);

  // Load restaurants & captains
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [resRest, resCapt] = await Promise.all([
          RestaurantService.getAll(),
          CaptainService.getAll(),
        ]);
        if (isMounted) {
          setRestaurants(resRest.data);
          setCaptains(resCapt.data);
        }
      } catch (err) {
        console.error('Error fetching data for send order:', err);
        toastError('فشل تحميل بيانات المطاعم أو الكباتن');
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (restaurantRef.current && !restaurantRef.current.contains(e.target as Node)) {
        setIsRestaurantDropdownOpen(false);
      }
      if (captainRef.current && !captainRef.current.contains(e.target as Node)) {
        setIsCaptainDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered restaurants for instant search
  const filteredRestaurants = useMemo(() => {
    const query = restaurantSearch.trim().toLowerCase();
    if (!query) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        (r.category && r.category.toLowerCase().includes(query)) ||
        (r.phone && r.phone.includes(query)) ||
        (r.address && r.address.toLowerCase().includes(query))
    );
  }, [restaurants, restaurantSearch]);

  // Filtered captains for instant search
  const filteredCaptains = useMemo(() => {
    const query = captainSearch.trim().toLowerCase();
    if (!query) return captains;
    return captains.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)) ||
        (c.vehicleType && c.vehicleType.toLowerCase().includes(query)) ||
        (c.status && c.status.toLowerCase().includes(query))
    );
  }, [captains, captainSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRestaurant) {
      toastError('يرجى اختيار المطعم المطلوب إرسال الطلب منه');
      return;
    }

    if (!selectedCaptain) {
      toastError('يرجى اختيار كابتن التوصيل المستلم للطلب');
      return;
    }

    setSubmitting(true);
    try {
      const fee = typeof deliveryFee === 'number' ? deliveryFee : 25;
      const createdOrder = await OrderService.create({
        restaurantId: selectedRestaurant.id,
        restaurantName: selectedRestaurant.name,
        captainId: selectedCaptain.id,
        captainName: selectedCaptain.name,
        deliveryAddress: deliveryAddress.trim() || (selectedRestaurant.address ? `توصيل من ${selectedRestaurant.name}` : 'غير محدد'),
        deliveryFee: fee,
        subtotal: 0,
        total: fee,
        notes: notes.trim(),
      });

      success(`تم إرسال الطلب ${createdOrder.orderNumber} بنجاح إلى الكابتن ${selectedCaptain.name}!`);
      navigate('/orders');
    } catch (err) {
      console.error('Failed to dispatch order:', err);
      toastError('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs">
              لوحة تحكم المسؤول
            </span>
            <span className="text-xs text-zinc-500">• إرسال وإسناد فوري</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Send className="w-6 h-6 text-amber-400 -rotate-45" />
            إرسال طلب إلى كابتن التوصيل
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            تحديد المطعم المسجل وإرسال الطلب مباشرة إلى كابتن التوصيل المسجل في قاعدة البيانات مع ميزة البحث الفوري
          </p>
        </div>

        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <span>عرض كل الطلبات</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
      </div>

      {/* Main Card Form */}
      <div className="bg-[#11141c] border border-zinc-800/90 rounded-3xl p-5 sm:p-7 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick instructions banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-300">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block mb-0.5">خاصية الإسناد المباشر:</span>
              اختر المطعم المسجل وحدد الكابتن المتاح عبر البحث السريع. يتم تسجيل الطلب في قاعدة البيانات بحالة <span className="font-bold underline">مقبول (Accepted)</span> وإسناده فوراً للكابتن.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Restaurant Selector */}
            <div className="space-y-2.5" ref={restaurantRef}>
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                  المطعم المسجل <span className="text-rose-400">*</span>
                </span>
                {selectedRestaurant && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRestaurant(null);
                      setRestaurantSearch('');
                    }}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    تغيير المطعم
                  </button>
                )}
              </label>

              {selectedRestaurant ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{selectedRestaurant.name}</h4>
                      <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>{selectedRestaurant.category || 'مطعم'}</span>
                        {selectedRestaurant.phone && <span>• {selectedRestaurant.phone}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    تم التحديد
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={restaurantSearch}
                      onChange={(e) => {
                        setRestaurantSearch(e.target.value);
                        setIsRestaurantDropdownOpen(true);
                      }}
                      onFocus={() => setIsRestaurantDropdownOpen(true)}
                      placeholder="ابحث باسم المطعم المسجل، التصنيف..."
                      className="w-full bg-[#0a0c12] border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    {restaurantSearch && (
                      <button
                        type="button"
                        onClick={() => setRestaurantSearch('')}
                        className="absolute left-3 top-3 text-zinc-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isRestaurantDropdownOpen && (
                    <div className="absolute z-30 right-0 left-0 mt-1.5 max-h-60 overflow-y-auto bg-[#131722] border border-zinc-700 rounded-2xl shadow-2xl p-1.5 space-y-1">
                      {loadingData ? (
                        <div className="p-4 text-center text-xs text-zinc-400">
                          جاري جلب المطاعم المسجلة...
                        </div>
                      ) : filteredRestaurants.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-400">
                          لا يوجد مطعم مسجل بهذا الاسم "{restaurantSearch}"
                        </div>
                      ) : (
                        filteredRestaurants.map((restaurant) => (
                          <button
                            key={restaurant.id}
                            type="button"
                            onClick={() => {
                              setSelectedRestaurant(restaurant);
                              setIsRestaurantDropdownOpen(false);
                              setRestaurantSearch(restaurant.name);
                            }}
                            className="w-full text-right p-2.5 rounded-xl hover:bg-zinc-800/80 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-amber-400">
                                <UtensilsCrossed className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-zinc-200 group-hover:text-white">
                                  {restaurant.name}
                                </div>
                                <div className="text-[11px] text-zinc-500">
                                  {restaurant.category || 'عام'} {restaurant.phone ? `• ${restaurant.phone}` : ''}
                                </div>
                              </div>
                            </div>
                            {restaurant.isActive && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                نشط
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Captain Selector */}
            <div className="space-y-2.5" ref={captainRef}>
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-amber-400" />
                  كابتن التوصيل المسجل <span className="text-rose-400">*</span>
                </span>
                {selectedCaptain && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCaptain(null);
                      setCaptainSearch('');
                    }}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    تغيير الكابتن
                  </button>
                )}
              </label>

              {selectedCaptain ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{selectedCaptain.name}</h4>
                      <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>{selectedCaptain.vehicleType || 'دراجة نارية'}</span>
                        {selectedCaptain.phone && <span>• {selectedCaptain.phone}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    تم التعيين
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={captainSearch}
                      onChange={(e) => {
                        setCaptainSearch(e.target.value);
                        setIsCaptainDropdownOpen(true);
                      }}
                      onFocus={() => setIsCaptainDropdownOpen(true)}
                      placeholder="ابحث باسم الكابتن المسجل، رقم الهاتف..."
                      className="w-full bg-[#0a0c12] border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    {captainSearch && (
                      <button
                        type="button"
                        onClick={() => setCaptainSearch('')}
                        className="absolute left-3 top-3 text-zinc-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isCaptainDropdownOpen && (
                    <div className="absolute z-30 right-0 left-0 mt-1.5 max-h-60 overflow-y-auto bg-[#131722] border border-zinc-700 rounded-2xl shadow-2xl p-1.5 space-y-1">
                      {loadingData ? (
                        <div className="p-4 text-center text-xs text-zinc-400">
                          جاري جلب الكباتن المسجلين...
                        </div>
                      ) : filteredCaptains.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-400">
                          لا يوجد كابتن مسجل مطابق لبحثك "{captainSearch}"
                        </div>
                      ) : (
                        filteredCaptains.map((captain) => (
                          <button
                            key={captain.id}
                            type="button"
                            onClick={() => {
                              setSelectedCaptain(captain);
                              setIsCaptainDropdownOpen(false);
                              setCaptainSearch(captain.name);
                            }}
                            className="w-full text-right p-2.5 rounded-xl hover:bg-zinc-800/80 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-amber-400">
                                <Bike className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-zinc-200 group-hover:text-white">
                                  {captain.name}
                                </div>
                                <div className="text-[11px] text-zinc-500">
                                  {captain.phone} {captain.vehicleType ? `• ${captain.vehicleType}` : ''}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                captain.status === 'online'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : captain.status === 'busy'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {captain.status === 'online' ? 'متاح' : captain.status === 'busy' ? 'مشغول' : 'غير متصل'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: Delivery Details & Fee */}
          <div className="border-t border-zinc-800/80 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              تفاصيل التوصيل
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  عنوان التوصيل
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="مثال: شارع النصر، برج الرواد، الدور الرابع، شقة 8"
                    className="w-full bg-[#0a0c12] border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 rounded-xl pr-9 pl-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  رسوم التوصيل للكابتن (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#0a0c12] border border-zinc-700/80 text-zinc-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                ملاحظات أو تعليمات خاصة للكابتن
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: استلام الطلب من المطعم فوراً، تسليم للعميل في الدور الرابع..."
                className="w-full bg-[#0a0c12] border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-zinc-800/80 pt-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs sm:text-sm font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedRestaurant || !selectedCaptain}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                  <span>جاري إرسال الطلب وحفظه...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 -rotate-45" />
                  <span>إرسال الطلب للكابتن الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
