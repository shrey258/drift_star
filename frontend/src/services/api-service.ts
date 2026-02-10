/**
 * API service for Drift Star backend.
 */

const API_BASE_URL = "https://drift-star-backend.fly.dev";

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
    hero_image_url?: string;
}

import { MOCK_TOKYO_ITINERARY } from "../constants/mock-trip";

export class ApiService {
    private baseUrl: string;
    // Simulation mode is now destination-specific (Tokyo only)
    private SIMULATION_MODE = false;

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
        // Use simulation ONLY for Tokyo
        const isTokyo = destination.toLowerCase().includes("tokyo");

        if (isTokyo) {
            console.log("[API] SIMULATION MODE ACTIVE FOR TOKYO");
            await new Promise((resolve) => setTimeout(resolve, 2500)); // Simulate generation delay

            // Return mock ID
            return {
                ...MOCK_TOKYO_ITINERARY,
                id: "mock-trip-tokyo",
                destination: destination || MOCK_TOKYO_ITINERARY.destination,
            };
        }

        const url = `${this.baseUrl}/api/v1/generate`;
        const body = {
            destination,
            days,
            start_date: startDate.toISOString().split("T")[0], // YYYY-MM-DD
        };

        console.log("[API] Generating itinerary...");
        console.log("[API] URL:", url);
        console.log("[API] Body:", JSON.stringify(body, null, 2));

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            console.log("[API] Response status:", response.status);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error("[API] Error response:", error);
                throw new Error(error.detail || `API error: ${response.status}`);
            }

            const data = await response.json();
            console.log("[API] Success! Trip ID:", data.id);
            return data;
        } catch (err) {
            console.error("[API] Network error:", err);
            throw err;
        }
    }

    /**
     * Enrich activities with images.
     */
    async enrichImages(keywords: string[]): Promise<Record<string, string>> {
        // No simulation for images anymore, or add more specific check if needed
        // For now, let's keep it real unless we explicitly need mock images
        const isSimulation = keywords.some(k => k.toLowerCase().includes("tokyo")) && this.SIMULATION_MODE;

        if (isSimulation) {
            console.log("[API] SIMULATION: Returning mock images");
            return {};
        }

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
        if (tripId === "mock-trip-tokyo") {
            console.log("[API] SIMULATION: Returning mock trip for", tripId);
            await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate fetch delay
            return MOCK_TOKYO_ITINERARY;
        }

        const response = await fetch(`${this.baseUrl}/api/v1/trips/${tripId}`);

        if (!response.ok) {
            throw new Error(`Trip not found: ${tripId}`);
        }

        return response.json();
    }
}

// Default singleton instance
export const apiService = new ApiService();
