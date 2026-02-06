/**
 * API service for Drift Star backend.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export interface GenerateItineraryRequest {
    destination: string;
    days: number;
    start_date: string; // ISO format: YYYY-MM-DD
}

export interface Activity {
    id: string;
    name: string;
    description: string;
    start_time: string;
    duration_minutes: number;
    location_name: string;
    image_keyword: string;
    image_url?: string;
}

export interface Day {
    day_number: number;
    theme_title: string;
    activities: Activity[];
}

export interface Itinerary {
    id: string;
    trip_title: string;
    destination: string;
    start_date?: string;
    end_date?: string;
    days: Day[];
}

export class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Generate a new travel itinerary.
     */
    async generateItinerary(
        destination: string,
        days: number,
        startDate: Date
    ): Promise<Itinerary> {
        const response = await fetch(`${this.baseUrl}/api/v1/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                destination,
                days,
                start_date: startDate.toISOString().split("T")[0], // YYYY-MM-DD
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Enrich activities with images.
     */
    async enrichImages(keywords: string[]): Promise<Record<string, string>> {
        const response = await fetch(`${this.baseUrl}/api/v1/enrich-images`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ keywords }),
        });

        if (!response.ok) {
            throw new Error(`Failed to enrich images: ${response.status}`);
        }

        const data = await response.json();
        return data.images;
    }

    /**
     * Get a saved trip by ID.
     */
    async getTrip(tripId: string): Promise<Itinerary> {
        const response = await fetch(`${this.baseUrl}/api/v1/trips/${tripId}`);

        if (!response.ok) {
            throw new Error(`Trip not found: ${tripId}`);
        }

        return response.json();
    }
}

// Default singleton instance
export const apiService = new ApiService();
