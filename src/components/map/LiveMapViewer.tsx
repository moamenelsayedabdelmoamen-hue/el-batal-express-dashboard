import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Maximize2 } from 'lucide-react';
import { Restaurant, Captain, Order } from '../../types';
import { haversineDistanceKm, formatDistanceArabic, isLocationFresh } from '../../utils/geoUtils';

interface LiveMapViewerProps {
  restaurants: Restaurant[];
  captains: Captain[];
  activeOrders: Order[];
  selectedRestaurantId?: string | null;
  selectedCaptainId?: string | null;
  selectedOrderId?: string | null;
  filter: 'all' | 'restaurants' | 'captains' | 'available' | 'busy' | 'trips';
  showOfflineCaptains?: boolean;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onSelectCaptain: (captain: Captain) => void;
  onSelectOrder: (order: Order) => void;
  onFindNearestCaptain: (restaurant: Restaurant) => void;
}

export const LiveMapViewer: React.FC<LiveMapViewerProps> = ({
  restaurants,
  captains,
  activeOrders,
  selectedRestaurantId,
  selectedCaptainId,
  selectedOrderId,
  filter,
  showOfflineCaptains = false,
  onSelectRestaurant,
  onSelectCaptain,
  onSelectOrder,
  onFindNearestCaptain,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Keep references to existing markers & polylines to update positions without remounting
  const restaurantMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const captainMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const tripLinesRef = useRef<Map<string, L.Polyline>>(new Map());

  // Store callbacks in refs to prevent re-attaching listeners on every render
  const callbacksRef = useRef({
    onSelectRestaurant,
    onSelectCaptain,
    onSelectOrder,
    onFindNearestCaptain,
  });
  callbacksRef.current = {
    onSelectRestaurant,
    onSelectCaptain,
    onSelectOrder,
    onFindNearestCaptain,
  };

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on Egypt (Cairo: 30.0444, 31.2357)
    const map = L.map(mapContainerRef.current, {
      center: [30.0444, 31.2357],
      zoom: 12,
      zoomControl: false,
    });

    // Custom OpenStreetMap TileLayer with dark-friendly container
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    // Zoom control at bottom right for ergonomic RTL layout
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update Restaurant Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = restaurantMarkersRef.current;
    const shouldShow = filter === 'all' || filter === 'restaurants';

    const validRestaurants = restaurants.filter(
      (r) => r.coords && typeof r.coords.lat === 'number' && typeof r.coords.lng === 'number'
    );

    const validIds = new Set(validRestaurants.map((r) => r.id));

    // Remove markers that are no longer valid or filtered out
    currentMarkers.forEach((marker, id) => {
      if (!shouldShow || !validIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    if (!shouldShow) return;

    validRestaurants.forEach((restaurant) => {
      const { lat, lng } = restaurant.coords!;
      const isSelected = selectedRestaurantId === restaurant.id;

      // Custom HTML Marker for Restaurant
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-20'
        }">
          <div class="w-10 h-10 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 ${
            isSelected ? 'border-white ring-4 ring-amber-500/40' : 'border-zinc-900'
          }">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="absolute -bottom-5 bg-zinc-900/95 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/40 whitespace-nowrap shadow-md pointer-events-none max-w-[110px] truncate">
            ${restaurant.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-restaurant-marker',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      let marker = currentMarkers.get(restaurant.id);
      if (marker) {
        // Update existing marker position & icon smoothly without recreation
        marker.setLatLng([lat, lng]);
        marker.setIcon(customIcon);
      } else {
        // Create new marker
        marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          callbacksRef.current.onSelectRestaurant(restaurant);
        });
        currentMarkers.set(restaurant.id, marker);
      }
    });
  }, [restaurants, filter, selectedRestaurantId]);

  // 3. Update Captain Markers (Smooth Movement on GPS change)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = captainMarkersRef.current;

    const validCaptains = captains.filter((c) => {
      if (!c.coords || typeof c.coords.lat !== 'number' || typeof c.coords.lng !== 'number') {
        return false;
      }
      if (!showOfflineCaptains && c.status === 'offline' && !c.isOnline) {
        return false;
      }
      if (filter === 'all' || filter === 'captains') return true;
      if (filter === 'available') return c.status === 'available' || c.status === 'online';
      if (filter === 'busy') return c.status === 'busy';
      return false;
    });

    const validIds = new Set(validCaptains.map((c) => c.id));

    // Remove obsolete markers
    currentMarkers.forEach((marker, id) => {
      if (!validIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    validCaptains.forEach((captain) => {
      const { lat, lng } = captain.coords!;
      const isSelected = selectedCaptainId === captain.id;
      const isBusy = captain.status === 'busy';
      const isAvailable = captain.status === 'available' || captain.status === 'online';

      const freshness = isLocationFresh(captain.lastLocationUpdate);

      // Color scheme based on status
      const bgClass = isBusy
        ? 'bg-amber-600 text-white shadow-amber-600/30'
        : isAvailable
        ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/30'
        : 'bg-zinc-600 text-zinc-200 shadow-zinc-600/20';

      const pulseRing = isAvailable
        ? `<span class="animate-ping absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75"></span>`
        : isBusy
        ? `<span class="animate-pulse absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-400 opacity-75"></span>`
        : '';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-300 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-30'
        }">
          ${pulseRing}
          <div class="w-10 h-10 rounded-full ${bgClass} flex items-center justify-center shadow-lg border-2 ${
            isSelected ? 'border-white ring-4 ring-emerald-400/40' : 'border-zinc-900'
          }">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="absolute -bottom-5 bg-zinc-900/95 ${
            isBusy ? 'text-amber-400 border-amber-500/40' : 'text-emerald-400 border-emerald-500/40'
          } text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap shadow-md pointer-events-none max-w-[110px] truncate">
            ${captain.name} ${!freshness.isFresh ? '⏱️' : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-captain-marker',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      let marker = currentMarkers.get(captain.id);
      if (marker) {
        // SMOOTH MOVEMENT: Update coordinates directly without remounting
        marker.setLatLng([lat, lng]);
        marker.setIcon(customIcon);
      } else {
        marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          callbacksRef.current.onSelectCaptain(captain);
        });
        currentMarkers.set(captain.id, marker);
      }
    });
  }, [captains, filter, showOfflineCaptains, selectedCaptainId]);

  // 4. Update Trip Polyline Connections (Restaurant <---> Assigned Captain)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentLines = tripLinesRef.current;
    const shouldShow = filter === 'all' || filter === 'trips' || filter === 'busy';

    // Map restaurants and captains by ID for fast lookup
    const restMap = new Map<string, Restaurant>(restaurants.map((r) => [r.id, r]));
    const captMap = new Map<string, Captain>(captains.map((c) => [c.id, c]));

    const validTrips = activeOrders.filter((order) => {
      if (!order.restaurantId || !order.captainId) return false;
      const rest = restMap.get(order.restaurantId);
      const capt = captMap.get(order.captainId);
      return rest?.coords && capt?.coords;
    });

    const validOrderIds = new Set(validTrips.map((t) => t.id));

    // Remove dead lines
    currentLines.forEach((line, orderId) => {
      if (!shouldShow || !validOrderIds.has(orderId)) {
        line.remove();
        currentLines.delete(orderId);
      }
    });

    if (!shouldShow) return;

    validTrips.forEach((order) => {
      const rest = restMap.get(order.restaurantId!)!;
      const capt = captMap.get(order.captainId!)!;

      const isSelected = selectedOrderId === order.id;
      const latlngs: [number, number][] = [
        [rest.coords!.lat, rest.coords!.lng],
        [capt.coords!.lat, capt.coords!.lng],
      ];

      const distKm = haversineDistanceKm(
        rest.coords!.lat,
        rest.coords!.lng,
        capt.coords!.lat,
        capt.coords!.lng
      );

      let polyline = currentLines.get(order.id);
      if (polyline) {
        polyline.setLatLngs(latlngs);
        polyline.setStyle({
          color: isSelected ? '#f59e0b' : '#10b981',
          weight: isSelected ? 4 : 3,
          dashArray: '6, 8',
          opacity: isSelected ? 1 : 0.75,
        });
      } else {
        polyline = L.polyline(latlngs, {
          color: isSelected ? '#f59e0b' : '#10b981',
          weight: isSelected ? 4 : 3,
          dashArray: '6, 8',
          opacity: 0.8,
        }).addTo(map);

        polyline.bindTooltip(
          `<b>رحلة: ${order.orderNumber}</b><br/>المسافة: ${formatDistanceArabic(distKm)}`,
          { sticky: true, className: 'bg-zinc-900 text-zinc-100 border border-zinc-700' }
        );

        polyline.on('click', () => {
          callbacksRef.current.onSelectOrder(order);
        });

        currentLines.set(order.id, polyline);
      }
    });
  }, [activeOrders, restaurants, captains, filter, selectedOrderId]);

  // Center on Selected Item when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedRestaurantId) {
      const rest = restaurants.find((r) => r.id === selectedRestaurantId);
      if (rest?.coords) {
        map.flyTo([rest.coords.lat, rest.coords.lng], 15, { duration: 1.2 });
      }
    } else if (selectedCaptainId) {
      const capt = captains.find((c) => c.id === selectedCaptainId);
      if (capt?.coords) {
        map.flyTo([capt.coords.lat, capt.coords.lng], 15, { duration: 1.2 });
      }
    }
  }, [selectedRestaurantId, selectedCaptainId, restaurants, captains]);

  // Method to Fit Bounds of all visible entities
  const handleCenterAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const allPoints: [number, number][] = [];

    restaurants.forEach((r) => {
      if (r.coords) allPoints.push([r.coords.lat, r.coords.lng]);
    });

    captains.forEach((c) => {
      if (c.coords && (showOfflineCaptains || c.status !== 'offline' || c.isOnline)) {
        allPoints.push([c.coords.lat, c.coords.lng]);
      }
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.flyTo([30.0444, 31.2357], 12);
    }
  };

  return (
    <div className="relative w-full h-[640px] md:h-[720px] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl bg-[#090b10]">
      {/* Map DOM node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Action Buttons over Map (RTL friendly) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCenterAll}
          className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 font-bold text-xs border border-amber-500/30 hover:border-amber-400 shadow-xl backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
          title="عرض جميع المطاعم والكباتن على الخريطة"
        >
          <Maximize2 className="w-4 h-4" />
          <span>تركيز على الكل</span>
        </button>
      </div>

      {/* Modern Compact Map Legend at Bottom Left */}
      <div className="absolute bottom-4 left-4 z-20 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 rounded-xl p-3 shadow-xl max-w-xs text-xs">
        <div className="text-[11px] font-extrabold text-zinc-400 mb-2 uppercase tracking-wider">
          دليل الخريطة (Live Legend)
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0"></span>
            <span>مطعم مسجل</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
            <span>كابتن متاح</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-600 shrink-0"></span>
            <span>كابتن في رحلة</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 border-t-2 border-dashed border-emerald-400 shrink-0"></span>
            <span>مسار رحلة</span>
          </div>
        </div>
      </div>
    </div>
  );
};
