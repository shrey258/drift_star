/**
 * Tests for ApiService.
 *
 * Mocks global `fetch` to verify request formatting, response parsing,
 * simulation mode for Tokyo, and error handling.
 */

import { ApiService } from "../api-service";

// Mock the mock-trip module
jest.mock("../../constants/mock-trip", () => ({
    MOCK_TOKYO_ITINERARY: {
        id: "mock-trip-tokyo",
        trip_title: "5-Day Tokyo Adventure",
        destination: "Tokyo",
        days: [
            {
                day_number: 1,
                theme_title: "Classic Tokyo",
                activities: [],
            },
        ],
    },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("ApiService", () => {
    let service: ApiService;

    beforeEach(() => {
        service = new ApiService("https://test-api.example.com");
        jest.clearAllMocks();
    });

    // =========================================================================
    // Generate Itinerary
    // =========================================================================

    describe("generateItinerary", () => {
        it("should use simulation mode for Tokyo destinations", async () => {
            const result = await service.generateItinerary(
                "Tokyo",
                5,
                new Date("2026-04-01")
            );

            // Should NOT call fetch for Tokyo (simulation mode)
            expect(mockFetch).not.toHaveBeenCalled();

            expect(result.id).toBe("mock-trip-tokyo");
            expect(result.destination).toBe("Tokyo");
        });

        it("should match Tokyo case-insensitively", async () => {
            const result = await service.generateItinerary(
                "tokyo, japan",
                3,
                new Date("2026-04-01")
            );

            expect(mockFetch).not.toHaveBeenCalled();
            expect(result.id).toBe("mock-trip-tokyo");
        });

        it("should call the API for non-Tokyo destinations", async () => {
            const mockResponse = {
                id: "trip-paris",
                trip_title: "3-Day Paris Adventure",
                destination: "Paris",
                days: [],
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await service.generateItinerary(
                "Paris",
                3,
                new Date("2026-05-15")
            );

            expect(mockFetch).toHaveBeenCalledWith(
                "https://test-api.example.com/api/v1/generate",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        destination: "Paris",
                        days: 3,
                        start_date: "2026-05-15",
                    }),
                })
            );

            expect(result.id).toBe("trip-paris");
        });

        it("should format start_date as YYYY-MM-DD", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "test", days: [] }),
            });

            await service.generateItinerary(
                "Berlin",
                2,
                new Date("2026-12-25")
            );

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.start_date).toBe("2026-12-25");
        });

        it("should throw on API error with detail message", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ detail: "AI service unavailable" }),
            });

            await expect(
                service.generateItinerary("Paris", 3, new Date())
            ).rejects.toThrow("AI service unavailable");
        });

        it("should throw with status code if no detail in error", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                json: async () => ({}),
            });

            await expect(
                service.generateItinerary("Paris", 3, new Date())
            ).rejects.toThrow("API error: 503");
        });

        it("should throw on network failure", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network request failed"));

            await expect(
                service.generateItinerary("Paris", 3, new Date())
            ).rejects.toThrow("Network request failed");
        });
    });

    // =========================================================================
    // Enrich Images
    // =========================================================================

    describe("enrichImages", () => {
        it("should POST keywords and return image map", async () => {
            const mockImages = {
                Paris: "https://example.com/paris.jpg",
                "Eiffel Tower": "https://example.com/eiffel.jpg",
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ images: mockImages }),
            });

            const result = await service.enrichImages(["Paris", "Eiffel Tower"]);

            expect(mockFetch).toHaveBeenCalledWith(
                "https://test-api.example.com/api/v1/enrich-images",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({
                        keywords: ["Paris", "Eiffel Tower"],
                    }),
                })
            );

            expect(result).toEqual(mockImages);
        });

        it("should throw on API failure", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
            });

            await expect(
                service.enrichImages(["Paris"])
            ).rejects.toThrow("Failed to enrich images: 429");
        });
    });

    // =========================================================================
    // Get Trip
    // =========================================================================

    describe("getTrip", () => {
        it("should return mock trip for mock-trip-tokyo", async () => {
            const result = await service.getTrip("mock-trip-tokyo");

            expect(mockFetch).not.toHaveBeenCalled();
            expect(result.destination).toBe("Tokyo");
        });

        it("should fetch from API for real trip IDs", async () => {
            const mockTrip = {
                id: "real-trip",
                destination: "Rome",
                days: [],
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockTrip,
            });

            const result = await service.getTrip("real-trip");

            expect(mockFetch).toHaveBeenCalledWith(
                "https://test-api.example.com/api/v1/trips/real-trip"
            );
            expect(result.destination).toBe("Rome");
        });

        it("should throw when trip is not found", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            await expect(service.getTrip("nonexistent")).rejects.toThrow(
                "Trip not found: nonexistent"
            );
        });
    });
});
