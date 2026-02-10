/**
 * Local storage service for persisting itinerary edits.
 * Uses AsyncStorage to save user modifications.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Itinerary } from './api-service';

const STORAGE_PREFIX = '@drift_star:trip:';

export class StorageService {
    /**
     * Save an itinerary to local storage.
     */
    async saveItinerary(tripId: string, itinerary: Itinerary): Promise<void> {
        try {
            const key = `${STORAGE_PREFIX}${tripId}`;
            const value = JSON.stringify(itinerary);
            await AsyncStorage.setItem(key, value);
            console.log('[Storage] Saved itinerary:', tripId);
        } catch (error) {
            console.error('[Storage] Failed to save itinerary:', error);
            throw error;
        }
    }

    /**
     * Load an itinerary from local storage.
     * Returns null if not found or on error.
     */
    async getItinerary(tripId: string): Promise<Itinerary | null> {
        try {
            const key = `${STORAGE_PREFIX}${tripId}`;
            const value = await AsyncStorage.getItem(key);

            if (value === null) {
                console.log('[Storage] No local copy found for:', tripId);
                return null;
            }

            const itinerary = JSON.parse(value) as Itinerary;
            console.log('[Storage] Loaded itinerary:', tripId);
            return itinerary;
        } catch (error) {
            console.error('[Storage] Failed to load itinerary:', error);
            return null;
        }
    }

    /**
     * Delete an itinerary from local storage.
     */
    async deleteItinerary(tripId: string): Promise<void> {
        try {
            const key = `${STORAGE_PREFIX}${tripId}`;
            await AsyncStorage.removeItem(key);
            console.log('[Storage] Deleted itinerary:', tripId);
        } catch (error) {
            console.error('[Storage] Failed to delete itinerary:', error);
            throw error;
        }
    }

    /**
     * Check if a local copy exists for a trip.
     */
    async hasLocalCopy(tripId: string): Promise<boolean> {
        try {
            const key = `${STORAGE_PREFIX}${tripId}`;
            const value = await AsyncStorage.getItem(key);
            return value !== null;
        } catch (error) {
            console.error('[Storage] Failed to check local copy:', error);
            return false;
        }
    }

    /**
     * Get all trip IDs that have been saved.
     */
    async getAllTripIds(): Promise<string[]> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const tripKeys = allKeys.filter(key => key.startsWith(STORAGE_PREFIX));
            const tripIds = tripKeys.map(key => key.replace(STORAGE_PREFIX, ''));
            console.log('[Storage] Found trip IDs:', tripIds);
            return tripIds;
        } catch (error) {
            console.error('[Storage] Failed to get trip IDs:', error);
            return [];
        }
    }

    /**
     * Get all saved itineraries.
     */
    async getAllTrips(): Promise<Itinerary[]> {
        try {
            const tripIds = await this.getAllTripIds();
            const trips: Itinerary[] = [];

            for (const tripId of tripIds) {
                const trip = await this.getItinerary(tripId);
                if (trip) {
                    trips.push(trip);
                }
            }

            // Sort by most recent first
            trips.sort((a, b) => {
                if (a.start_date && b.start_date) {
                    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                }
                return 0;
            });

            console.log('[Storage] Loaded all trips:', trips.length);
            return trips;
        } catch (error) {
            console.error('[Storage] Failed to get all trips:', error);
            return [];
        }
    }
}

// Default singleton instance
export const storageService = new StorageService();
