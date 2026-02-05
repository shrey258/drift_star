export interface CountrySuggestion {
    name: {
        common: string;
    };
    flags: {
        png: string;
    };
}

export class CountryService {
    private static BASE_URL = "https://restcountries.com/v3.1";

    static async searchCountries(query: string): Promise<CountrySuggestion[]> {
        if (!query || query.length <= 2) return [];

        try {
            const response = await fetch(
                `${this.BASE_URL}/name/${query}?fields=name,flags`
            );

            if (!response.ok) return [];

            const data = await response.json();
            return Array.isArray(data) ? data.slice(0, 5) : [];
        } catch (error) {
            console.error("CountryService search error:", error);
            return [];
        }
    }
}
