import Geonames from 'geonames.js';
import { env } from 'process';

if (!env.GEONAMES_USERNAME) {
  throw new Error('GEONAMES_USERNAME environment variable is required');
}

const geonames = new Geonames({
  username: env.GEONAMES_USERNAME,
  lan: 'en',
  encoding: 'JSON'
});

export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  countryName: string;
}

export async function validateAndGetLocation(location: string): Promise<LocationData | null> {
  try {
    const searchResults = await geonames.search({
      q: location,
      maxRows: 1,
      style: 'FULL'
    });

    if (searchResults.geonames && searchResults.geonames.length > 0) {
      const place = searchResults.geonames[0];
      return {
        name: `${place.name}, ${place.countryName}`,
        latitude: place.lat,
        longitude: place.lng,
        countryName: place.countryName
      };
    }
    return null;
  } catch (error) {
    console.error('GeoNames API error:', error);
    return null;
  }
}
