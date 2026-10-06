export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
  country_code?: string;
  displayName: string;
}

/**
 * Searches for cities and locations worldwide using Open-Meteo Geocoding API.
 * Free, fast, and requires no API key.
 */
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
    const data = await res.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item: any) => {
      const parts = [item.name];
      if (item.admin1 && item.admin1 !== item.name) parts.push(item.admin1);
      if (item.country) parts.push(item.country);

      return {
        id: item.id,
        name: item.name,
        latitude: Math.round(item.latitude * 10000) / 10000,
        longitude: Math.round(item.longitude * 10000) / 10000,
        admin1: item.admin1,
        country: item.country,
        country_code: item.country_code,
        displayName: parts.join(', '),
      };
    });
  } catch (err) {
    console.warn('Geocoding search failed:', err);
    return [];
  }
}

/**
 * Reverse geocodes latitude/longitude coordinates to human-readable address.
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ name: string; location: string; code: string }> {
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLon = Math.round(lon * 1000) / 1000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'User-Agent': 'IndiaClimateIntel/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const cityName =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.county ||
        data.name ||
        'Local Area';

      const stateName = addr.state || addr.region || '';
      const countryName = addr.country || '';

      const locationParts = [cityName];
      if (stateName) locationParts.push(stateName);
      if (countryName) locationParts.push(countryName);

      const codePrefix = cityName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'LOC');
      const randomSuffix = Math.floor(10 + Math.random() * 90);

      return {
        name: `${cityName} Local Station`,
        location: locationParts.join(', '),
        code: `MY-${codePrefix}-${randomSuffix}`,
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding error or timeout, using coordinate fallback:', err);
  }

  // Fallback
  const codeSuffix = Math.floor(10 + Math.random() * 90);
  return {
    name: `Custom Location (${roundedLat}°, ${roundedLon}°)`,
    location: `Lat ${roundedLat}°, Lon ${roundedLon}°`,
    code: `MY-LOC-${codeSuffix}`,
  };
}
