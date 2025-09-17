// Geolocation service for smart matching
export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  accuracy?: number;
  timestamp: Date;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class GeolocationService {
  private static instance: GeolocationService;
  private currentLocation: LocationData | null = null;
  private watchId: number | null = null;

  private constructor() {}

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  // Check if geolocation is supported
  public isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Get current position
  public async getCurrentPosition(options?: GeolocationOptions): Promise<LocationData> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options,
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: await this.reverseGeocode(position.coords.latitude, position.coords.longitude),
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
          };
          
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        defaultOptions
      );
    });
  }

  // Watch position changes
  public watchPosition(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void,
    options?: GeolocationOptions
  ): number {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
      ...options,
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: await this.reverseGeocode(position.coords.latitude, position.coords.longitude),
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        };
        
        this.currentLocation = location;
        onLocationUpdate(location);
      },
      (error) => {
        const errorObj = new Error(`Geolocation error: ${error.message}`);
        onError?.(errorObj);
      },
      defaultOptions
    );

    return this.watchId;
  }

  // Stop watching position
  public clearWatch(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Get cached location
  public getCachedLocation(): LocationData | null {
    return this.currentLocation;
  }

  // Calculate distance between two points (Haversine formula)
  public calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Find nearby locations within radius
  public findNearbyLocations(
    centerLat: number,
    centerLng: number,
    locations: Array<{ lat: number; lng: number; [key: string]: any }>,
    radiusKm: number
  ): Array<{ lat: number; lng: number; distance: number; [key: string]: any }> {
    return locations
      .map(location => ({
        ...location,
        distance: this.calculateDistance(centerLat, centerLng, location.lat, location.lng),
      }))
      .filter(location => location.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  // Reverse geocoding to get address from coordinates
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Using a free reverse geocoding service (you might want to use Google Maps API or similar)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      
      const data = await response.json();
      return data.localityInfo?.administrative?.[0]?.name || 
             data.localityInfo?.locality?.[0]?.name || 
             `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Request location permission
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      // Check if we already have permission
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state === 'granted';
    } catch (error) {
      // Fallback: try to get position
      try {
        await this.getCurrentPosition({ timeout: 1000 });
        return true;
      } catch {
        return false;
      }
    }
  }
}

// Export singleton instance
export const geolocation = GeolocationService.getInstance();

// React hook for geolocation
export const useGeolocation = () => {
  return {
    getCurrentPosition: (options?: GeolocationOptions) => geolocation.getCurrentPosition(options),
    watchPosition: (
      onLocationUpdate: (location: LocationData) => void,
      onError?: (error: Error) => void,
      options?: GeolocationOptions
    ) => geolocation.watchPosition(onLocationUpdate, onError, options),
    clearWatch: () => geolocation.clearWatch(),
    getCachedLocation: () => geolocation.getCachedLocation(),
    calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => 
      geolocation.calculateDistance(lat1, lng1, lat2, lng2),
    findNearbyLocations: (
      centerLat: number,
      centerLng: number,
      locations: Array<{ lat: number; lng: number; [key: string]: any }>,
      radiusKm: number
    ) => geolocation.findNearbyLocations(centerLat, centerLng, locations, radiusKm),
    isSupported: () => geolocation.isSupported(),
    requestPermission: () => geolocation.requestPermission(),
  };
};
