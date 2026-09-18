/**
 * Utilities for geolocation calculations and coordinate handling
 * for El Batal Express Live Map dashboard.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Extracts valid latitude and longitude from various Firestore data structures.
 * Supports:
 * - Firestore GeoPoint ({ latitude, longitude } or { _lat, _long })
 * - Nested objects: item.location, item.coordinates, item.coords, item.position
 * - Top level: item.lat & item.lng, item.latitude & item.longitude
 */
export function extractCoordinates(raw: any): Coordinates | null {
  if (!raw) return null;

  // Direct target or nested location
  const loc = raw.location || raw.coordinates || raw.coords || raw.position || raw.geo || raw;

  let lat: number | undefined;
  let lng: number | undefined;

  // Firestore GeoPoint instance or duck-typing
  if (loc && typeof loc === 'object') {
    if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      lat = loc.latitude;
      lng = loc.longitude;
    } else if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      lat = loc.lat;
      lng = loc.lng;
    } else if (typeof loc._lat === 'number' && typeof loc._long === 'number') {
      lat = loc._lat;
      lng = loc._long;
    } else if (Array.isArray(loc) && loc.length >= 2) {
      lat = Number(loc[0]);
      lng = Number(loc[1]);
    }
  }

  // Fallback to top-level latitude/longitude
  if (lat === undefined || isNaN(lat)) {
    if (typeof raw.lat === 'number' && typeof raw.lng === 'number') {
      lat = raw.lat;
      lng = raw.lng;
    } else if (typeof raw.latitude === 'number' && typeof raw.longitude === 'number') {
      lat = raw.latitude;
      lng = raw.longitude;
    }
  }

  if (
    lat !== undefined &&
    lng !== undefined &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    return { lat, lng };
  }

  return null;
}

/**
 * Calculates straight-line geographical distance between two points in kilometers
 * using the Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 100) / 100; // 2 decimal places
}

/**
 * Formats a distance in kilometers to a human-friendly Arabic string.
 * Example: 0.8 كم or 850 م
 */
export function formatDistanceArabic(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} م`;
  }
  return `${km.toFixed(1)} كم`;
}

/**
 * Evaluates whether a location timestamp is fresh based on a threshold (default: 3 minutes).
 */
export function isLocationFresh(
  rawTimestamp: any,
  thresholdMinutes: number = 3
): {
  isFresh: boolean;
  minutesAgo: number;
  formattedTime: string;
} {
  if (!rawTimestamp) {
    return {
      isFresh: false,
      minutesAgo: 9999,
      formattedTime: 'غير متوفر',
    };
  }

  let date: Date;

  if (typeof rawTimestamp === 'object' && typeof rawTimestamp.toDate === 'function') {
    date = rawTimestamp.toDate();
  } else if (rawTimestamp instanceof Date) {
    date = rawTimestamp;
  } else if (typeof rawTimestamp === 'number') {
    const ms = rawTimestamp < 10000000000 ? rawTimestamp * 1000 : rawTimestamp;
    date = new Date(ms);
  } else if (typeof rawTimestamp === 'string') {
    date = new Date(rawTimestamp);
  } else {
    return {
      isFresh: false,
      minutesAgo: 9999,
      formattedTime: 'غير معروف',
    };
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const minutesAgo = Math.floor(diffMs / 60000);
  const secondsAgo = Math.floor(diffMs / 1000);

  let formattedTime = '';
  if (secondsAgo < 60) {
    formattedTime = 'منذ ثوانٍ';
  } else if (minutesAgo < 60) {
    formattedTime = `منذ ${minutesAgo} دقيقة`;
  } else {
    const hoursAgo = Math.floor(minutesAgo / 60);
    formattedTime = `منذ ${hoursAgo} ساعة`;
  }

  return {
    isFresh: minutesAgo <= thresholdMinutes,
    minutesAgo,
    formattedTime,
  };
}
