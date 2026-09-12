import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import { COLLECTIONS } from './collections';
import { Captain, CaptainStatus } from '../types';

let localCaptainsCache: Captain[] = [];

function mapDocToCaptain(id: string, data: Record<string, any>): Captain {
  return {
    id,
    name: data.name || data.fullName || 'كابتن بدون اسم',
    phone: data.phone || data.mobile || '—',
    status: (data.status as CaptainStatus) || (data.isOnline ? 'online' : 'offline'),
    ordersCount: typeof data.ordersCount === 'number' ? data.ordersCount : (data.totalDeliveries || 0),
    rating: typeof data.rating === 'number' ? data.rating : 5.0,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    vehicleType: data.vehicleType || data.vehicle || 'دراجة نارية',
    raw: data,
  };
}

export const CaptainService = {
  async getAll(): Promise<{ data: Captain[]; isLive: boolean }> {
    if (!isFirebaseConfigured) {
      return { data: localCaptainsCache, isLive: false };
    }

    try {
      const q = query(collection(db, COLLECTIONS.CAPTAINS), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        localCaptainsCache = [];
        return { data: [], isLive: true };
      }

      const list: Captain[] = [];
      snapshot.forEach((docSnap) => {
        list.push(mapDocToCaptain(docSnap.id, docSnap.data()));
      });

      localCaptainsCache = list;
      return { data: list, isLive: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CAPTAINS);
      return { data: localCaptainsCache, isLive: false };
    }
  },

  async updateStatus(id: string, status: CaptainStatus): Promise<void> {
    localCaptainsCache = localCaptainsCache.map((c) =>
      c.id === id ? { ...c, status } : c
    );

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.CAPTAINS, id);
        await updateDoc(docRef, {
          status,
          isOnline: status === 'online',
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.CAPTAINS}/${id}`);
      }
    }
  },

  async create(data: Omit<Captain, 'id'>): Promise<Captain> {
    const newId = `capt_${Date.now()}`;
    const newCaptain: Captain = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    localCaptainsCache = [newCaptain, ...localCaptainsCache];

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.CAPTAINS, newId);
        await setDoc(docRef, {
          name: data.name,
          phone: data.phone,
          status: data.status,
          ordersCount: data.ordersCount || 0,
          rating: data.rating || 5.0,
          vehicleType: data.vehicleType || 'دراجة نارية',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.CAPTAINS}/${newId}`);
      }
    }

    return newCaptain;
  },

  async delete(id: string): Promise<void> {
    localCaptainsCache = localCaptainsCache.filter((c) => c.id !== id);

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.CAPTAINS, id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.CAPTAINS}/${id}`);
      }
    }
  },
};
