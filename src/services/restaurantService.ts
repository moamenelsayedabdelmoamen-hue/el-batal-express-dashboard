import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import { COLLECTIONS } from './collections';
import { Restaurant, SubscriptionStatus } from '../types';

// Local cache for real data fetched from Firestore
let localRestaurantsCache: Restaurant[] = [];

function mapDocToRestaurant(id: string, data: Record<string, any>): Restaurant {
  return {
    id,
    name: data.name || data.nameAr || data.restaurantName || data.title || 'بدون اسم',
    category: data.category || data.cuisine || data.type || 'عام',
    phone: data.phone || data.phoneNumber || data.contact || '—',
    rating: typeof data.rating === 'number' ? data.rating : (typeof data.stars === 'number' ? data.stars : 5.0),
    subscriptionStatus: (data.subscriptionStatus as SubscriptionStatus) || (data.subscription?.status as SubscriptionStatus) || 'Active',
    isActive: typeof data.isActive === 'boolean' ? data.isActive : (data.status === 'active' || data.status === 'نشط'),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    address: data.address || data.location || data.addressAr || '—',
    ownerEmail: data.ownerEmail || data.email || '—',
    raw: data,
  };
}

export const RestaurantService = {
  async getAll(): Promise<{ data: Restaurant[]; isLive: boolean }> {
    if (!isFirebaseConfigured) {
      return { data: localRestaurantsCache, isLive: false };
    }

    try {
      const q = query(collection(db, COLLECTIONS.RESTAURANTS), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        localRestaurantsCache = [];
        return { data: [], isLive: true };
      }

      const list: Restaurant[] = [];
      snapshot.forEach((docSnap) => {
        list.push(mapDocToRestaurant(docSnap.id, docSnap.data()));
      });

      localRestaurantsCache = list;
      return { data: list, isLive: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.RESTAURANTS);
      // Fallback gracefully to empty array or previously fetched data
      return { data: localRestaurantsCache, isLive: false };
    }
  },

  async getById(id: string): Promise<Restaurant | null> {
    if (!isFirebaseConfigured) {
      return localRestaurantsCache.find((r) => r.id === id) || null;
    }

    try {
      const docRef = doc(db, COLLECTIONS.RESTAURANTS, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return localRestaurantsCache.find((r) => r.id === id) || null;
      }
      return mapDocToRestaurant(snap.id, snap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.RESTAURANTS}/${id}`);
      return localRestaurantsCache.find((r) => r.id === id) || null;
    }
  },

  async toggleActive(id: string, currentStatus: boolean): Promise<boolean> {
    const newStatus = !currentStatus;
    
    // Update local cache
    localRestaurantsCache = localRestaurantsCache.map((r) =>
      r.id === id ? { ...r, isActive: newStatus } : r
    );

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.RESTAURANTS, id);
        await updateDoc(docRef, {
          isActive: newStatus,
          status: newStatus ? 'active' : 'inactive',
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.RESTAURANTS}/${id}`);
      }
    }
    return newStatus;
  },

  async update(id: string, updates: Partial<Restaurant>): Promise<void> {
    localRestaurantsCache = localRestaurantsCache.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.RESTAURANTS, id);
        await updateDoc(docRef, {
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.category ? { category: updates.category } : {}),
          ...(updates.phone ? { phone: updates.phone } : {}),
          ...(updates.address ? { address: updates.address } : {}),
          ...(updates.subscriptionStatus ? { subscriptionStatus: updates.subscriptionStatus } : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.RESTAURANTS}/${id}`);
      }
    }
  },

  async create(data: Omit<Restaurant, 'id'>): Promise<Restaurant> {
    const newId = `rest_${Date.now()}`;
    const newRestaurant: Restaurant = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    localRestaurantsCache = [newRestaurant, ...localRestaurantsCache];

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.RESTAURANTS, newId);
        await setDoc(docRef, {
          name: data.name,
          category: data.category || 'عام',
          phone: data.phone || '',
          rating: data.rating || 5.0,
          subscriptionStatus: data.subscriptionStatus || 'Active',
          isActive: data.isActive,
          address: data.address || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.RESTAURANTS}/${newId}`);
      }
    }

    return newRestaurant;
  },

  async delete(id: string): Promise<void> {
    localRestaurantsCache = localRestaurantsCache.filter((r) => r.id !== id);

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.RESTAURANTS, id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.RESTAURANTS}/${id}`);
      }
    }
  },
};
