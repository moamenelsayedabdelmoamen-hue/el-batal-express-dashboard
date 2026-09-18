import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Bike,
  Store,
  Navigation,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  Phone,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { LiveMapViewer } from '../components/map/LiveMapViewer';
import { NearestCaptainsModal } from '../components/map/NearestCaptainsModal';
import { EntityDetailsPanel } from '../components/map/EntityDetailsPanel';
import { LiveMapService } from '../services/liveMapService';
import { Restaurant, Captain, Order } from '../types';

export const LiveMapPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'restaurants' | 'captains' | 'available' | 'busy' | 'trips'>('all');
  const [showOfflineCaptains, setShowOfflineCaptains] = useState(false);

  // Selected Entities
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCaptain, setSelectedCaptain] = useState<Captain | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modal for Nearest Captains
  const [nearestModalRestaurant, setNearestModalRestaurant] = useState<Restaurant | null>(null);

  // 1. Subscribe to real-time Firestore collections
  useEffect(() => {
    setIsLoading(true);

    const unsubCaptains = LiveMapService.subscribeCaptains(
      (data) => {
        setCaptains(data);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Captains live subscription notice:', err);
        setIsLoading(false);
      }
    );

    const unsubRestaurants = LiveMapService.subscribeRestaurants(
      (data) => {
        setRestaurants(data);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Restaurants live subscription notice:', err);
        setIsLoading(false);
      }
    );

    const unsubOrders = LiveMapService.subscribeActiveOrders(
      (data) => {
        setActiveOrders(data);
      },
      (err) => {
        console.warn('Active orders live subscription notice:', err);
      }
    );

    return () => {
      unsubCaptains();
      unsubRestaurants();
      unsubOrders();
    };
  }, []);

  // 2. Computed Live Statistics
  const stats = useMemo(() => {
    const restaurantsWithGps = restaurants.filter((r) => r.coords).length;
    const onlineCaptains = captains.filter((c) => c.isOnline || c.status === 'available' || c.status === 'busy');
    const availableCaptains = captains.filter((c) => c.status === 'available' || c.status === 'online');
    const busyCaptains = captains.filter((c) => c.status === 'busy');
    const activeTripsCount = activeOrders.length;

    return {
      restaurantsWithGps,
      totalRestaurants: restaurants.length,
      onlineCaptains: onlineCaptains.length,
      availableCaptains: availableCaptains.length,
      busyCaptains: busyCaptains.length,
      totalCaptains: captains.length,
      activeTripsCount,
    };
  }, [restaurants, captains, activeOrders]);

  // 3. Filtered Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { restaurants: [], captains: [] };
    const query = searchQuery.trim().toLowerCase();

    const matchedRestaurants = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        (r.phone && r.phone.includes(query)) ||
        (r.address && r.address.toLowerCase().includes(query))
    );

    const matchedCaptains = captains.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)) ||
        (c.vehicleType && c.vehicleType.toLowerCase().includes(query))
    );

    return {
      restaurants: matchedRestaurants.slice(0, 5),
      captains: matchedCaptains.slice(0, 5),
    };
  }, [searchQuery, restaurants, captains]);

  // Handlers for entity selection
  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedCaptain(null);
    setSelectedOrder(null);
  };

  const handleSelectCaptain = (captain: Captain) => {
    setSelectedCaptain(captain);
    setSelectedRestaurant(null);
    setSelectedOrder(null);
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setSelectedRestaurant(null);
    setSelectedCaptain(null);
  };

  const handleOpenNearestModal = (restaurant: Restaurant) => {
    setNearestModalRestaurant(restaurant);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Header & Real-time Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1017] p-5 rounded-2xl border border-zinc-800/80 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-zinc-100 tracking-wide">
                الخريطة الحية والمواقع (Live Map)
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                مباشر (Firestore onSnapshot)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              متابعة مواقع الكباتن والمطاعم والرحلات النشطة جغرافياً وتحديد أقرب كابتن متاح عبر OpenStreetMap و Leaflet
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOfflineCaptains(!showOfflineCaptains)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
              showOfflineCaptains
                ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="إظهار الكباتن غير المتصلين (Offline)"
          >
            {showOfflineCaptains ? (
              <Eye className="w-4 h-4 text-amber-400" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            <span>كباتن Offline</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0d1017] border border-zinc-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">المطاعم على الخريطة</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-zinc-100 font-mono">
              {stats.restaurantsWithGps}
            </span>
            <span className="text-[11px] text-zinc-500">من {stats.totalRestaurants}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0d1017] border border-zinc-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">الكباتن المتصلين</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-emerald-400 font-mono">
              {stats.onlineCaptains}
            </span>
            <span className="text-[11px] text-zinc-500">متصل الآن</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0d1017] border border-zinc-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">كباتن متاحين</span>
            <Bike className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-emerald-300 font-mono">
              {stats.availableCaptains}
            </span>
            <span className="text-[11px] text-zinc-500">جاهز للطلب</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0d1017] border border-zinc-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">في رحلات نشطة</span>
            <Navigation className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-amber-400 font-mono">
              {stats.busyCaptains}
            </span>
            <span className="text-[11px] text-zinc-500">مشغول حالياً</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-[#0d1017] border border-zinc-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">الرحلات الجارية</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-amber-300 font-mono">
              {stats.activeTripsCount}
            </span>
            <span className="text-[11px] text-zinc-500">طلب قيد التنفيذ</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d1017] border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث سريع باسم المطعم، اسم الكابتن، أو رقم الهاتف..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-amber-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs"
            >
              مسح
            </button>
          )}

          {/* Quick Search Dropdown Results */}
          {searchQuery.trim() && (searchResults.restaurants.length > 0 || searchResults.captains.length > 0) && (
            <div className="absolute top-full right-0 left-0 mt-2 z-30 bg-[#0d1017] border border-zinc-700 rounded-xl shadow-2xl p-2 space-y-1 max-h-64 overflow-y-auto">
              {searchResults.restaurants.map((rest) => (
                <button
                  key={rest.id}
                  type="button"
                  onClick={() => {
                    handleSelectRestaurant(rest);
                    setSearchQuery('');
                  }}
                  className="w-full text-right p-2 rounded-lg hover:bg-zinc-800 flex items-center justify-between text-xs text-zinc-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold">{rest.name}</span>
                    <span className="text-[10px] text-zinc-400">({rest.category || 'مطعم'})</span>
                  </div>
                  <span className="text-[10px] text-amber-400">عرض على الخريطة ←</span>
                </button>
              ))}

              {searchResults.captains.map((capt) => (
                <button
                  key={capt.id}
                  type="button"
                  onClick={() => {
                    handleSelectCaptain(capt);
                    setSearchQuery('');
                  }}
                  className="w-full text-right p-2 rounded-lg hover:bg-zinc-800 flex items-center justify-between text-xs text-zinc-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Bike className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold">{capt.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">({capt.phone})</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">عرض على الخريطة ←</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            الكل
          </button>

          <button
            type="button"
            onClick={() => setFilter('restaurants')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'restaurants'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            المطاعم
          </button>

          <button
            type="button"
            onClick={() => setFilter('available')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'available'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            الكباتن المتاحين
          </button>

          <button
            type="button"
            onClick={() => setFilter('busy')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'busy'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            الكباتن في رحلة
          </button>

          <button
            type="button"
            onClick={() => setFilter('trips')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'trips'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            مسارات الرحلات
          </button>
        </div>
      </div>

      {/* Main Interactive Map Viewer */}
      <LiveMapViewer
        restaurants={restaurants}
        captains={captains}
        activeOrders={activeOrders}
        filter={filter}
        showOfflineCaptains={showOfflineCaptains}
        selectedRestaurantId={selectedRestaurant?.id}
        selectedCaptainId={selectedCaptain?.id}
        selectedOrderId={selectedOrder?.id}
        onSelectRestaurant={handleSelectRestaurant}
        onSelectCaptain={handleSelectCaptain}
        onSelectOrder={handleSelectOrder}
        onFindNearestCaptain={handleOpenNearestModal}
      />

      {/* Floating or Docked Entity Details Panel */}
      <EntityDetailsPanel
        selectedRestaurant={selectedRestaurant}
        selectedCaptain={selectedCaptain}
        selectedOrder={selectedOrder}
        restaurants={restaurants}
        captains={captains}
        activeOrders={activeOrders}
        onClose={() => {
          setSelectedRestaurant(null);
          setSelectedCaptain(null);
          setSelectedOrder(null);
        }}
        onFindNearestCaptain={handleOpenNearestModal}
      />

      {/* Nearest Captains Modal */}
      <NearestCaptainsModal
        isOpen={Boolean(nearestModalRestaurant)}
        restaurant={nearestModalRestaurant}
        captains={captains}
        onClose={() => setNearestModalRestaurant(null)}
      />
    </div>
  );
};
