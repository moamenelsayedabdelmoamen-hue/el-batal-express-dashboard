import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import { COLLECTIONS } from './collections';
import { Payment, PaymentMethod, PaymentStatus } from '../types';

let localPaymentsCache: Payment[] = [];

function mapDocToPayment(id: string, data: Record<string, any>): Payment {
  const txnId = data.transactionId || data.transactionNumber || data.reference || data.txnId || `#TXN-${id.slice(0, 6).toUpperCase()}`;
  return {
    id,
    transactionId: txnId,
    transactionNumber: txnId,
    restaurantId: data.restaurantId || '',
    restaurantName: data.restaurantName || 'مطعم غير محدد',
    amount: typeof data.amount === 'number' ? data.amount : 0,
    paymentMethod: (data.paymentMethod as PaymentMethod) || (data.method === 'card' ? 'Visa' : 'Mobile Wallet'),
    status: (data.status as PaymentStatus) || 'success',
    date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    notes: data.notes || '',
    raw: data,
  };
}

export const PaymentService = {
  async getAll(): Promise<{ data: Payment[]; isLive: boolean }> {
    if (!isFirebaseConfigured) {
      return { data: localPaymentsCache, isLive: false };
    }

    try {
      const q = query(collection(db, COLLECTIONS.PAYMENTS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        localPaymentsCache = [];
        return { data: [], isLive: true };
      }

      const list: Payment[] = [];
      snapshot.forEach((docSnap) => {
        list.push(mapDocToPayment(docSnap.id, docSnap.data()));
      });

      localPaymentsCache = list;
      return { data: list, isLive: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PAYMENTS);
      return { data: localPaymentsCache, isLive: false };
    }
  },

  async create(data: Omit<Payment, 'id' | 'transactionId'> & { transactionId?: string }): Promise<Payment> {
    const newId = `pay_${Date.now()}`;
    const txnId = data.transactionId || `#TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPayment: Payment = {
      ...data,
      id: newId,
      transactionId: txnId,
      transactionNumber: txnId,
      createdAt: new Date().toISOString(),
    };

    localPaymentsCache = [newPayment, ...localPaymentsCache];
    return newPayment;
  },
};
