import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import { COLLECTIONS, SUBSCRIPTION_PLANS } from './collections';
import { Subscription, SubscriptionStatus } from '../types';

let localSubscriptionsCache: Subscription[] = [];

function mapDocToSubscription(id: string, data: Record<string, any>): Subscription {
  return {
    id,
    restaurantId: data.restaurantId || data.restaurant?.id || '',
    restaurantName: data.restaurantName || data.restaurant?.name || 'مطعم غير محدد',
    plan: data.plan || `${data.captainsCount || 2} Captains`,
    captainsCount: typeof data.captainsCount === 'number' ? data.captainsCount : 2,
    price: typeof data.price === 'number' ? data.price : 400,
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: (data.status as SubscriptionStatus) || 'Active',
    raw: data,
  };
}

export const SubscriptionService = {
  plans: SUBSCRIPTION_PLANS,

  async getAll(): Promise<{ data: Subscription[]; isLive: boolean }> {
    if (!isFirebaseConfigured) {
      return { data: localSubscriptionsCache, isLive: false };
    }

    try {
      const q = query(collection(db, COLLECTIONS.SUBSCRIPTIONS), orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        localSubscriptionsCache = [];
        return { data: [], isLive: true };
      }

      const list: Subscription[] = [];
      snapshot.forEach((docSnap) => {
        list.push(mapDocToSubscription(docSnap.id, docSnap.data()));
      });

      localSubscriptionsCache = list;
      return { data: list, isLive: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.SUBSCRIPTIONS);
      return { data: localSubscriptionsCache, isLive: false };
    }
  },

  async updateStatus(id: string, status: SubscriptionStatus): Promise<void> {
    localSubscriptionsCache = localSubscriptionsCache.map((sub) =>
      sub.id === id ? { ...sub, status } : sub
    );

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, id);
        await updateDoc(docRef, {
          status,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.SUBSCRIPTIONS}/${id}`);
      }
    }
  },

  async updatePlan(id: string, captainsCount: number, price: number): Promise<void> {
    const planName = `${captainsCount} Captains`;
    localSubscriptionsCache = localSubscriptionsCache.map((sub) =>
      sub.id === id ? { ...sub, captainsCount, price, plan: planName } : sub
    );

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, id);
        await updateDoc(docRef, {
          captainsCount,
          price,
          plan: planName,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.SUBSCRIPTIONS}/${id}`);
      }
    }
  },

  async create(data: Omit<Subscription, 'id'>): Promise<Subscription> {
    const newId = `sub_${Date.now()}`;
    const newSub: Subscription = {
      ...data,
      id: newId,
    };

    localSubscriptionsCache = [newSub, ...localSubscriptionsCache];

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, newId);
        await setDoc(docRef, {
          restaurantId: data.restaurantId,
          restaurantName: data.restaurantName,
          plan: data.plan,
          captainsCount: data.captainsCount,
          price: data.price,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.SUBSCRIPTIONS}/${newId}`);
      }
    }

    return newSub;
  },

  async renew(id: string, days: number = 30): Promise<void> {
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + days);
    const formattedEndDate = newEndDate.toISOString().split('T')[0];

    localSubscriptionsCache = localSubscriptionsCache.map((sub) =>
      sub.id === id ? { ...sub, status: 'Active', endDate: formattedEndDate } : sub
    );

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, id);
        await updateDoc(docRef, {
          status: 'Active',
          endDate: formattedEndDate,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.SUBSCRIPTIONS}/${id}`);
      }
    }
  },
};
