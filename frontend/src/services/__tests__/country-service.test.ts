/**
 * Tests for CountryService.
 *
 * Mocks global `fetch` to verify search behavior,
 * query validation, and graceful error handling.
 */

import { CountryService } from "../country-service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("CountryService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // Input validation
    // =========================================================================

    it("should return empty array for empty query", async () => {
        const result = await CountryService.searchCountries("");
        expect(mockFetch).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it("should return empty array for queries <= 2 characters", async () => {
        const result = await CountryService.searchCountries("US");
        expect(mockFetch).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    // =========================================================================
    // Successful searches
    // =========================================================================

    it("should search countries with correct URL and params", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { name: { common: "France" }, flags: { png: "https://flags.com/fr.png" } },
                { name: { common: "French Guiana" }, flags: { png: "https://flags.com/gf.png" } },
            ],
        });

        const result = await CountryService.searchCountries("Fra");

        expect(mockFetch).toHaveBeenCalledWith(
            "https://restcountries.com/v3.1/name/Fra?fields=name,flags"
        );
        expect(result).toHaveLength(2);
        expect(result[0].name.common).toBe("France");
    });

    it("should limit results to 5", async () => {
        const manyCountries = Array.from({ length: 10 }, (_, i) => ({
            name: { common: `Country ${i}` },
            flags: { png: `https://flags.com/${i}.png` },
        }));

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => manyCountries,
        });

        const result = await CountryService.searchCountries("Country");
        expect(result).toHaveLength(5);
    });

    // =========================================================================
    // Error handling
    // =========================================================================

    it("should return empty array on non-ok response (e.g. 404)", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
        });

        const result = await CountryService.searchCountries("Zzz");
        expect(result).toEqual([]);
    });

    it("should return empty array on network error", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network offline"));

        const result = await CountryService.searchCountries("Japan");
        expect(result).toEqual([]);
    });

    it("should return empty array if API returns non-array", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 404, message: "Not Found" }),
        });

        const result = await CountryService.searchCountries("Xyz");
        expect(result).toEqual([]);
    });
});
