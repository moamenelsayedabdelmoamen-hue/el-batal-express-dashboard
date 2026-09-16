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
  // Extract real delivery fee added by restaurant in Firestore
  const rawDeliveryFee =
    data.deliveryFee !== undefined
      ? data.deliveryFee
      : data.delivery_fee !== undefined
      ? data.delivery_fee
      : data.deliveryPrice !== undefined
      ? data.deliveryPrice
      : data.delivery_price !== undefined
      ? data.delivery_price
      : data.deliveryCost !== undefined
      ? data.deliveryCost
      : data.delivery_cost !== undefined
      ? data.delivery_cost
      : data.shippingFee !== undefined
      ? data.shippingFee
      : data.shipping_fee !== undefined
      ? data.shipping_fee
      : data.fee !== undefined
      ? data.fee
      : data.captainFee !== undefined
      ? data.captainFee
      : data.captain_fee !== undefined
      ? data.captain_fee
      : data.deliveryAmount !== undefined
      ? data.deliveryAmount
      : data.delivery_amount !== undefined
      ? data.delivery_amount
      : typeof data.delivery === 'number'
      ? data.delivery
      : data.pricing?.deliveryFee !== undefined
      ? data.pricing.deliveryFee
      : data.pricing?.delivery_fee !== undefined
      ? data.pricing.delivery_fee
      : 0;

  const realDeliveryFee =
    typeof rawDeliveryFee === 'number'
      ? rawDeliveryFee
      : (parseFloat(String(rawDeliveryFee).replace(/[^\d.-]/g, '')) || 0);

  // Real order identifier in Firestore
  const realOrderNumber =
    data.orderNumber !== undefined && data.orderNumber !== null && data.orderNumber !== ''
      ? data.orderNumber
      : data.order_number !== undefined && data.order_number !== null && data.order_number !== ''
      ? data.order_number
      : data.orderId !== undefined && data.orderId !== null && data.orderId !== ''
      ? data.orderId
      : data.order_id !== undefined && data.order_id !== null && data.order_id !== ''
      ? data.order_id
      : data.orderNo !== undefined && data.orderNo !== null && data.orderNo !== ''
      ? data.orderNo
      : data.order_no !== undefined && data.order_no !== null && data.order_no !== ''
      ? data.order_no
      : data.code !== undefined && data.code !== null && data.code !== ''
      ? data.code
      : data.orderCode !== undefined && data.orderCode !== null && data.orderCode !== ''
      ? data.orderCode
      : data.number !== undefined && data.number !== null && data.number !== ''
      ? data.number
      : id;

  const realCaptainId = data.captainId || data.captain?.id || data.captain?.uid || '';
  const realCaptainName =
    data.captainName ||
    data.captain?.name ||
    data.captain?.displayName ||
    '';

    const rawCreatedAt =
      data.createdAt ||
      data.created_at ||
      data.orderDate ||
      data.order_date ||
      data.date ||
      data.timestamp ||
      data.time;

    let parsedCreatedAt = new Date().toISOString();
    if (rawCreatedAt) {
      if (typeof rawCreatedAt === 'object' && typeof rawCreatedAt.toDate === 'function') {
        parsedCreatedAt = rawCreatedAt.toDate().toISOString();
      } else if (rawCreatedAt instanceof Date) {
        parsedCreatedAt = rawCreatedAt.toISOString();
      } else if (typeof rawCreatedAt === 'number') {
        // could be seconds timestamp or ms
        const ms = rawCreatedAt < 10000000000 ? rawCreatedAt * 1000 : rawCreatedAt;
        parsedCreatedAt = new Date(ms).toISOString();
      } else if (typeof rawCreatedAt === 'string') {
        parsedCreatedAt = rawCreatedAt;
      }
    }

  return {
    id,
    orderNumber: String(realOrderNumber),
    restaurantId: data.restaurantId || data.restaurant?.id || '',
    restaurantName: data.restaurantName || data.restaurant?.name || 'مطعم غير محدد',
    customerName: data.customerName || data.customer?.name || 'عميل',
    customerPhone: data.customerPhone || data.customer?.phone || '',
    deliveryAddress: data.deliveryAddress || data.address || '',
    captainId: realCaptainId,
    captainName: realCaptainName,
    subtotal: typeof data.subtotal === 'number' ? data.subtotal : (typeof data.itemsTotal === 'number' ? data.itemsTotal : (data.total || 0)),
    deliveryFee: realDeliveryFee,
    total: typeof data.total === 'number' ? data.total : 0,
    status: (data.status as OrderStatus) || 'New',
    createdAt: parsedCreatedAt,
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
      let snapshot;
      try {
        const q = query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'));
        snapshot = await getDocs(q);
      } catch (err) {
        // Fallback if orderBy index is missing or field name varies
        snapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
      }

      if (snapshot.empty) {
        localOrdersCache = [];
        return { data: [], isLive: true };
      }

      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        list.push(mapDocToOrder(docSnap.id, docSnap.data()));
      });

      // Sort in-memory desc by createdAt
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
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
      order.id === orderId
        ? {
            ...order,
            captainId,
            captainName,
            status: order.status === 'New' ? 'Accepted' : order.status,
          }
        : order
    );

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
        await updateDoc(docRef, {
          captainId,
          captainName,
          captain: {
            id: captainId,
            name: captainName,
          },
          status: 'Accepted',
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

    const deliveryFee = Number(data.deliveryFee ?? 0);
    const subtotal = Number(data.subtotal ?? 0);
    const total = Number(data.total ?? (subtotal + deliveryFee));

    const newOrder: Order = {
      id: newId,
      orderNumber,
      restaurantId: data.restaurantId,
      restaurantName: data.restaurantName,
      captainId: data.captainId,
      captainName: data.captainName,
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      deliveryAddress: data.deliveryAddress || '',
      subtotal,
      deliveryFee,
      total,
      status: 'Accepted', // Dispatched directly by admin to captain
      createdAt: new Date().toISOString(),
      items: data.items && data.items.length > 0 ? data.items : [],
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
          orderId: orderNumber,
          restaurantId: data.restaurantId,
          restaurantName: data.restaurantName,
          captainId: data.captainId,
          captainName: data.captainName,
          captain: {
            id: data.captainId,
            name: data.captainName,
          },
          deliveryAddress: data.deliveryAddress || '',
          deliveryFee,
          delivery_fee: deliveryFee,
          deliveryPrice: deliveryFee,
          fee: deliveryFee,
          subtotal,
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
