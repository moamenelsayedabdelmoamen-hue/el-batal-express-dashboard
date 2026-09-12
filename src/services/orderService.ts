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
import { COLLECTIONS } from './collections';
import { Order, OrderStatus } from '../types';

let localOrdersCache: Order[] = [];

function mapDocToOrder(id: string, data: Record<string, any>): Order {
  return {
    id,
    orderNumber: data.orderNumber || data.code || `#${id.slice(0, 6).toUpperCase()}`,
    restaurantId: data.restaurantId || data.restaurant?.id || '',
    restaurantName: data.restaurantName || data.restaurant?.name || 'مطعم غير محدد',
    customerName: data.customerName || data.customer?.name || 'عميل',
    customerPhone: data.customerPhone || data.customer?.phone || '',
    deliveryAddress: data.deliveryAddress || data.address || '',
    captainId: data.captainId || data.captain?.id || '',
    captainName: data.captainName || data.captain?.name || 'لم يُعيّن كابتن بعد',
    subtotal: typeof data.subtotal === 'number' ? data.subtotal : (typeof data.itemsTotal === 'number' ? data.itemsTotal : (data.total || 0)),
    deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 25,
    total: typeof data.total === 'number' ? data.total : 0,
    status: (data.status as OrderStatus) || 'New',
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    items: data.items || [],
    raw: data,
  };
}

export const OrderService = {
  async getAll(): Promise<{ data: Order[]; isLive: boolean }> {
    if (!isFirebaseConfigured) {
      return { data: localOrdersCache, isLive: false };
    }

    try {
      const q = query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        localOrdersCache = [];
        return { data: [], isLive: true };
      }

      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        list.push(mapDocToOrder(docSnap.id, docSnap.data()));
      });

      localOrdersCache = list;
      return { data: list, isLive: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ORDERS);
      return { data: localOrdersCache, isLive: false };
    }
  },

  async updateStatus(id: string, newStatus: OrderStatus): Promise<void> {
    localOrdersCache = localOrdersCache.map((order) =>
      order.id === id ? { ...order, status: newStatus } : order
    );

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.ORDERS, id);
        await updateDoc(docRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.ORDERS}/${id}`);
      }
    }
  },

  async assignCaptain(orderId: string, captainId: string, captainName: string): Promise<void> {
    localOrdersCache = localOrdersCache.map((order) =>
      order.id === orderId ? { ...order, captainId, captainName, status: order.status === 'New' ? 'Accepted' : order.status } : order
    );

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
        await updateDoc(docRef, {
          captainId,
          captainName,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.ORDERS}/${orderId}`);
      }
    }
  },

  async create(data: {
    restaurantId: string;
    restaurantName: string;
    captainId: string;
    captainName: string;
    deliveryAddress?: string;
    deliveryFee?: number;
    notes?: string;
    customerName?: string;
    customerPhone?: string;
    subtotal?: number;
    total?: number;
    items?: { name: string; quantity: number; price: number }[];
  }): Promise<Order> {
    const timestamp = Date.now();
    const newId = `ord_${timestamp}`;
    const orderNumber = `#ELB-${Math.floor(1000 + Math.random() * 9000)}`;

    const deliveryFee = Number(data.deliveryFee ?? 25);
    const subtotal = Number(data.subtotal ?? 0);
    const total = Number(data.total ?? (subtotal + deliveryFee));

    const newOrder: Order = {
      id: newId,
      orderNumber,
      restaurantId: data.restaurantId,
      restaurantName: data.restaurantName,
      captainId: data.captainId,
      captainName: data.captainName,
      customerName: data.customerName || 'عميل المحل',
      customerPhone: data.customerPhone || '',
      deliveryAddress: data.deliveryAddress || 'عنوان العميل',
      subtotal,
      deliveryFee,
      total,
      status: 'Accepted', // Dispatched directly by admin to captain
      createdAt: new Date().toISOString(),
      items: data.items && data.items.length > 0 ? data.items : [
        {
          name: 'طلب توصيل مطعم',
          quantity: 1,
          price: subtotal,
        },
      ],
      raw: {
        ...data,
        notes: data.notes || '',
        orderNumber,
        status: 'Accepted',
        dispatchedBy: 'admin',
      },
    };

    localOrdersCache = [newOrder, ...localOrdersCache];

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.ORDERS, newId);
        await setDoc(docRef, {
          orderNumber,
          restaurantId: data.restaurantId,
          restaurantName: data.restaurantName,
          captainId: data.captainId,
          captainName: data.captainName,
          customerName: data.customerName || 'عميل المحل',
          customerPhone: data.customerPhone || '',
          deliveryAddress: data.deliveryAddress || 'عنوان العميل',
          subtotal,
          deliveryFee,
          total,
          status: 'Accepted',
          notes: data.notes || '',
          items: newOrder.items,
          dispatchedBy: 'admin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.ORDERS}/${newId}`);
      }
    }

    return newOrder;
  },
};
