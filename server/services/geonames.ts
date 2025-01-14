import axios from "axios";
import { env } from "process";

if (!env.GEONAMES_USERNAME) {
  throw new Error("GEONAMES_USERNAME environment variable is required");
}

const GEONAMES_API_URL = "http://api.geonames.org/searchJSON";

export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  countryName: string;
}

export interface LocationSuggestion {
  name: string;
  fullName: string;
  latitude: number;
  longitude: number;
}

export async function getSuggestions(query: string): Promise<LocationSuggestion[]> {
  console.log('getSuggestions called with query:', query); // Add this line
  if (!query || query.length < 2) return [];

  try {
    const response = await axios.get(GEONAMES_API_URL, {
      params: {
        q: query,
        maxRows: 5,
        username: env.GEONAMES_USERNAME,
        style: 'FULL',
        featureClass: 'P',
        orderby: 'population',
        cities: 'cities1000'
      }
    });

    console.log('GeoNames API Response:', response.data); // Log the response

    if (!response.data?.geonames) return [];

    return response.data.geonames
      .filter((place: any) => place.name && place.countryName)
      .map((place: any) => ({
        name: place.name,
        fullName: `${place.name}, ${place.countryName}`,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lng)
      }));
  } catch (error) {
    console.error('GeoNames API error:', error);
    return [];
  }
}

export async function validateAndGetLocation(
  location: string,
): Promise<LocationData | null> {
  try {
    const response = await axios.get(GEONAMES_API_URL, {
      params: {
        q: location,
        maxRows: 1,
        username: env.GEONAMES_USERNAME,
        style: "FULL",
      },
    });

    const data = response.data;
    if (data.geonames && data.geonames.length > 0) {
      const place = data.geonames[0];
      return {
        name: `${place.name}, ${place.countryName}`,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lng),
        countryName: place.countryName,
      };
    }
    return null;
  } catch (error) {
    console.error("GeoNames API error:", error);
    return null;
  }
}
