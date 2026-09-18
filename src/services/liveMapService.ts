import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import { COLLECTIONS } from './collections';
import { Captain, Restaurant, Order, NearestCaptainResult, CaptainStatus } from '../types';
import { extractCoordinates, haversineDistanceKm, formatDistanceArabic, isLocationFresh } from '../utils/geoUtils';

/**
 * Service for managing real-time map data from Firestore.
 * Conforms to performance constraints:
 * - Single collection listener per entity type (no individual listeners per captain)
 * - Reads only (never mutates captain GPS from dashboard)
 * - Error handling using handleFirestoreError
 */

export function mapDocToLiveCaptain(id: string, data: Record<string, any>): Captain {
  const coords = extractCoordinates(data);
  const rawStatus = data.status || (data.isOnline ? 'online' : 'offline');

  // Normalize status
  let status: CaptainStatus = 'offline';
  if (rawStatus === 'busy' || data.isBusy || data.currentOrderId) {
    status = 'busy';
  } else if (rawStatus === 'available' || rawStatus === 'online' || data.isOnline === true) {
    status = 'available';
  } else {
    status = 'offline';
  }

  const isOnline = Boolean(data.isOnline ?? (status === 'available' || status === 'busy'));

  return {
    id,
    name: data.name || data.fullName || data.captainName || 'كابتن بدون اسم',
    phone: data.phone || data.mobile || data.phoneNumber || '—',
    status,
    isOnline,
    ordersCount: typeof data.ordersCount === 'number' ? data.ordersCount : (data.totalDeliveries || 0),
    rating: typeof data.rating === 'number' ? data.rating : 5.0,
    vehicleType: data.vehicleType || data.vehicle || 'دراجة نارية',
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    location: data.location || data.coordinates || data.coords,
    coords,
    lastLocationUpdate: data.lastLocationUpdate || data.lastUpdate || data.updatedAt || data.locationUpdatedAt,
    currentOrderId: data.currentOrderId || data.activeOrderId || data.orderId,
    raw: data,
  };
}

export function mapDocToLiveRestaurant(id: string, data: Record<string, any>): Restaurant {
  const coords = extractCoordinates(data);

  return {
    id,
    name: data.name || data.nameAr || data.restaurantName || data.title || 'بدون اسم',
    category: data.category || data.cuisine || data.type || 'عام',
    phone: data.phone || data.phoneNumber || data.contact || '—',
    rating: typeof data.rating === 'number' ? data.rating : 5.0,
    subscriptionStatus: data.subscriptionStatus || 'Active',
    isActive: typeof data.isActive === 'boolean' ? data.isActive : (data.status === 'active' || data.status === 'نشط'),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    address: data.address || data.addressAr || data.locationName || '—',
    ownerEmail: data.ownerEmail || data.email || '—',
    logo: data.logo || data.logoUrl || data.image || data.imageUrl || data.avatar,
    location: data.location || data.coordinates || data.coords,
    coords,
    status: data.status || (data.isActive ? 'active' : 'inactive'),
    raw: data,
  };
}

export const LiveMapService = {
  /**
   * Subscribes to the captains collection in real-time.
   */
  subscribeCaptains(
    onUpdate: (captains: Captain[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!isFirebaseConfigured) {
      onUpdate([]);
      return () => {};
    }

    try {
      const q = query(collection(db, COLLECTIONS.CAPTAINS));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Captain[] = [];
          snapshot.forEach((docSnap) => {
            list.push(mapDocToLiveCaptain(docSnap.id, docSnap.data()));
          });
          onUpdate(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, COLLECTIONS.CAPTAINS);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.CAPTAINS);
      return () => {};
    }
  },

  /**
   * Subscribes to the restaurants collection in real-time.
   */
  subscribeRestaurants(
    onUpdate: (restaurants: Restaurant[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!isFirebaseConfigured) {
      onUpdate([]);
      return () => {};
    }

    try {
      const q = query(collection(db, COLLECTIONS.RESTAURANTS));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Restaurant[] = [];
          snapshot.forEach((docSnap) => {
            list.push(mapDocToLiveRestaurant(docSnap.id, docSnap.data()));
          });
          onUpdate(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, COLLECTIONS.RESTAURANTS);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.RESTAURANTS);
      return () => {};
    }
  },

  /**
   * Subscribes to active orders/trips in real-time.
   */
  subscribeActiveOrders(
    onUpdate: (orders: Order[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!isFirebaseConfigured) {
      onUpdate([]);
      return () => {};
    }

    try {
      const q = query(collection(db, COLLECTIONS.ORDERS));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Order[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const status = String(data.status || '').toLowerCase();
            // Active orders are not delivered and not cancelled
            const isCompleted = status === 'delivered' || status === 'cancelled' || status === 'ملغي' || status === 'تم التوصيل';
            if (!isCompleted) {
              list.push({
                id: docSnap.id,
                orderNumber: data.orderNumber || data.orderId || docSnap.id,
                restaurantId: data.restaurantId || data.restaurant?.id || '',
                restaurantName: data.restaurantName || data.restaurant?.name || 'مطعم غير محدد',
                customerName: data.customerName || 'عميل',
                customerPhone: data.customerPhone || '',
                deliveryAddress: data.deliveryAddress || data.address || '',
                captainId: data.captainId || data.captain?.id || '',
                captainName: data.captainName || data.captain?.name || '',
                subtotal: Number(data.subtotal || 0),
                deliveryFee: Number(data.deliveryFee || data.delivery_fee || 0),
                total: Number(data.total || 0),
                status: data.status || 'Accepted',
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
                raw: data,
              });
            }
          });
          onUpdate(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, COLLECTIONS.ORDERS);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.ORDERS);
      return () => {};
    }
  },

  /**
   * Finds and sorts nearest available captains to a specific origin coordinate.
   * Algorithm:
   * 1. Filters only available captains (isOnline === true, status !== 'offline', status !== 'busy')
   * 2. Excludes captains without valid GPS coordinates
   * 3. Excludes captains with stale locations (lastLocationUpdate > thresholdMinutes, if threshold is enforced)
   * 4. Calculates Haversine distance in kilometers
   * 5. Sorts ascending by distance
   */
  findNearestCaptains(
    originLat: number,
    originLng: number,
    captains: Captain[],
    options: {
      thresholdMinutes?: number;
      requireFreshLocation?: boolean;
      maxResults?: number;
    } = {}
  ): NearestCaptainResult[] {
    const {
      thresholdMinutes = 3,
      requireFreshLocation = false,
      maxResults = 10,
    } = options;

    const available = captains.filter((captain) => {
      // Must have valid coordinates
      if (!captain.coords) return false;

      // Must be online / available
      const isOnline = captain.isOnline !== false;
      const isAvailable = captain.status === 'available' || captain.status === 'online';
      if (!isOnline || !isAvailable) return false;

      // Check freshness
      if (requireFreshLocation) {
        const freshCheck = isLocationFresh(captain.lastLocationUpdate, thresholdMinutes);
        if (!freshCheck.isFresh) return false;
      }

      return true;
    });

    const withDistance: NearestCaptainResult[] = available.map((captain) => {
      const dist = haversineDistanceKm(
        originLat,
        originLng,
        captain.coords!.lat,
        captain.coords!.lng
      );
      const freshness = isLocationFresh(captain.lastLocationUpdate, thresholdMinutes);

      return {
        captain,
        distanceKm: dist,
        formattedDistance: formatDistanceArabic(dist),
        isFresh: freshness.isFresh,
        minutesAgo: freshness.minutesAgo,
        formattedTime: freshness.formattedTime,
      };
    });

    // Sort ascending by distance
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance.slice(0, maxResults);
  },
};
