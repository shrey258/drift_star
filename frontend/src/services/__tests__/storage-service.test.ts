/**
 * Tests for StorageService.
 *
 * Uses a manual __mocks__ approach for AsyncStorage.
 */

import { Itinerary } from "../api-service";

// ─── In-memory AsyncStorage mock ────────────────────────────────────────────
const store: Record<string, string> = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: {
        getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
            return Promise.resolve();
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
            return Promise.resolve();
        }),
        multiRemove: jest.fn((keys: string[]) => {
            keys.forEach((k) => delete store[k]);
            return Promise.resolve();
        }),
        getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
        clear: jest.fn(() => {
            Object.keys(store).forEach((k) => delete store[k]);
            return Promise.resolve();
        }),
    },
}));

// Re-import the mocked module to get a reference to the mock methods
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageService } from "../storage-service";

const mockItinerary: Itinerary = {
    id: "trip-123",
    trip_title: "3-Day Paris Adventure",
    destination: "Paris",
    start_date: "2026-03-15",
    end_date: "2026-03-17",
    days: [
        {
            day_number: 1,
            theme_title: "Classic Paris",
            activities: [
                {
                    id: "act-1",
                    name: "Eiffel Tower",
                    description: "Visit the iconic landmark",
                    start_time: "09:00",
                    duration_minutes: 120,
                    location_name: "Champ de Mars",
                    image_keyword: "Eiffel Tower Paris",
                },
            ],
        },
    ],
};

describe("StorageService", () => {
    let service: StorageService;

    beforeEach(() => {
        service = new StorageService();
        // Clear the in-memory store
        Object.keys(store).forEach((k) => delete store[k]);
        jest.clearAllMocks();
    });

    // =========================================================================
    // Itinerary CRUD
    // =========================================================================

    describe("saveItinerary", () => {
        it("should save an itinerary with the correct key prefix", async () => {
            await service.saveItinerary("trip-123", mockItinerary);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                "@drift_star:trip:trip-123",
                JSON.stringify(mockItinerary)
            );
            // Verify it's actually in the store
            expect(store["@drift_star:trip:trip-123"]).toBeDefined();
        });

        it("should throw when AsyncStorage fails", async () => {
            (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
                new Error("Disk full")
            );

            await expect(
                service.saveItinerary("trip-123", mockItinerary)
            ).rejects.toThrow("Disk full");
        });
    });

    describe("getItinerary", () => {
        it("should return the parsed itinerary when found", async () => {
            store["@drift_star:trip:trip-123"] = JSON.stringify(mockItinerary);

            const result = await service.getItinerary("trip-123");
            expect(result).toEqual(mockItinerary);
        });

        it("should return null when no itinerary is found", async () => {
            const result = await service.getItinerary("nonexistent");
            expect(result).toBeNull();
        });

        it("should return null on read errors", async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
                new Error("Read error")
            );

            const result = await service.getItinerary("trip-123");
            expect(result).toBeNull();
        });
    });

    describe("deleteItinerary", () => {
        it("should remove both itinerary and calendar mapping keys", async () => {
            await service.deleteItinerary("trip-123");

            expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
                "@drift_star:trip:trip-123",
                "@drift_star:calendar_events:trip-123",
            ]);
        });

        it("should throw when AsyncStorage fails", async () => {
            (AsyncStorage.multiRemove as jest.Mock).mockRejectedValueOnce(
                new Error("Delete failed")
            );

            await expect(service.deleteItinerary("trip-123")).rejects.toThrow(
                "Delete failed"
            );
        });
    });

    describe("hasLocalCopy", () => {
        it("should return true when itinerary exists", async () => {
            store["@drift_star:trip:trip-123"] = "{}";

            const result = await service.hasLocalCopy("trip-123");
            expect(result).toBe(true);
        });

        it("should return false when itinerary does not exist", async () => {
            const result = await service.hasLocalCopy("trip-123");
            expect(result).toBe(false);
        });
    });

    // =========================================================================
    // Trip listing
    // =========================================================================

    describe("getAllTripIds", () => {
        it("should filter only trip keys and strip prefix", async () => {
            store["@drift_star:trip:trip-1"] = "{}";
            store["@drift_star:trip:trip-2"] = "{}";
            store["@drift_star:calendar_events:trip-1"] = "[]";
            store["@some_other_key"] = "x";

            const ids = await service.getAllTripIds();
            expect(ids).toEqual(
                expect.arrayContaining(["trip-1", "trip-2"])
            );
            expect(ids).toHaveLength(2);
        });

        it("should return empty array on error", async () => {
            (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValueOnce(
                new Error("Keys error")
            );

            const ids = await service.getAllTripIds();
            expect(ids).toEqual([]);
        });
    });

    describe("getAllTrips", () => {
        it("should return trips sorted by start_date (most recent first)", async () => {
            const tripA = { ...mockItinerary, id: "a", start_date: "2026-01-01" };
            const tripB = { ...mockItinerary, id: "b", start_date: "2026-06-15" };

            store["@drift_star:trip:a"] = JSON.stringify(tripA);
            store["@drift_star:trip:b"] = JSON.stringify(tripB);

            const trips = await service.getAllTrips();

            expect(trips).toHaveLength(2);
            expect(trips[0].id).toBe("b"); // Most recent first
            expect(trips[1].id).toBe("a");
        });
    });

    // =========================================================================
    // Calendar event mapping
    // =========================================================================

    describe("saveCalendarEvents", () => {
        it("should save event IDs with the correct key prefix", async () => {
            const eventIds = ["evt-1", "evt-2", "evt-3"];
            await service.saveCalendarEvents("trip-123", eventIds);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                "@drift_star:calendar_events:trip-123",
                JSON.stringify(eventIds)
            );
        });
    });

    describe("getCalendarEvents", () => {
        it("should return parsed event IDs", async () => {
            store["@drift_star:calendar_events:trip-123"] = JSON.stringify([
                "evt-1",
                "evt-2",
            ]);

            const ids = await service.getCalendarEvents("trip-123");
            expect(ids).toEqual(["evt-1", "evt-2"]);
        });

        it("should return empty array when no mapping exists", async () => {
            const ids = await service.getCalendarEvents("trip-123");
            expect(ids).toEqual([]);
        });

        it("should return empty array on error", async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
                new Error("Read error")
            );

            const ids = await service.getCalendarEvents("trip-123");
            expect(ids).toEqual([]);
        });
    });
});
