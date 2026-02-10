import { useState, useCallback, useEffect } from "react";
import { apiService, Itinerary, Activity } from "../services/api-service";
import { storageService } from "../services/storage-service";

interface TripViewModelState {
    itinerary: Itinerary | null;
    isLoading: boolean;
    error: string | null;
    selectedDay: number;
    editingActivity: Activity | null;
}

interface TripViewModelActions {
    fetchTrip: (tripId: string) => Promise<void>;
    selectDay: (dayNumber: number) => void;
    openEditSheet: (activity: Activity) => void;
    closeEditSheet: () => void;
    updateActivity: (dayNumber: number, activityId: string, updates: Partial<Activity>) => Promise<void>;
    deleteActivity: (dayNumber: number, activityId: string) => Promise<void>;
    updateTripMetadata: (updates: Partial<Pick<Itinerary, 'trip_title' | 'start_date' | 'end_date'>>) => Promise<void>;
    enrichImages: () => Promise<void>;
}

export function useTripViewModel(tripId?: string) {
    const [state, setState] = useState<TripViewModelState>({
        itinerary: null,
        isLoading: false,
        error: null,
        selectedDay: 1,
        editingActivity: null,
    });

    const fetchTrip = useCallback(async (id: string) => {
        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
            // First, check if we have a local edited copy
            const localCopy = await storageService.getItinerary(id);

            if (localCopy) {
                console.log('[ViewModel] Using local edited copy');
                setState((s) => ({
                    ...s,
                    itinerary: localCopy,
                    isLoading: false,
                    selectedDay: localCopy.days[0]?.day_number || 1,
                }));
            } else {
                // No local copy, fetch from API
                const itinerary = await apiService.getTrip(id);
                setState((s) => ({
                    ...s,
                    itinerary,
                    isLoading: false,
                    selectedDay: itinerary.days[0]?.day_number || 1,
                }));

                // Auto-save to local storage so it appears in "My Trips"
                storageService.saveItinerary(id, itinerary).catch(err => {
                    console.error('[ViewModel] Failed to auto-save API trip:', err);
                });
            }
        } catch (err) {
            setState((s) => ({
                ...s,
                isLoading: false,
                error: err instanceof Error ? err.message : "Failed to load trip",
            }));
        }
    }, []);

    const selectDay = useCallback((dayNumber: number) => {
        setState((s) => ({ ...s, selectedDay: dayNumber }));
    }, []);

    const openEditSheet = useCallback((activity: Activity) => {
        setState((s) => ({ ...s, editingActivity: activity }));
    }, []);

    const closeEditSheet = useCallback(() => {
        setState((s) => ({ ...s, editingActivity: null }));
    }, []);

    const updateActivity = useCallback(
        async (dayNumber: number, activityId: string, updates: Partial<Activity>) => {
            setState((s) => {
                if (!s.itinerary) return s;

                const updatedDays = s.itinerary.days.map((day) => ({
                    ...day,
                    activities: day.activities.map((activity) =>
                        activity.id === activityId ? { ...activity, ...updates } : activity
                    ),
                }));

                const updatedItinerary = { ...s.itinerary, days: updatedDays };

                // Save to local storage
                storageService.saveItinerary(s.itinerary.id, updatedItinerary).catch((err) => {
                    console.error('[ViewModel] Failed to save after update:', err);
                });

                return {
                    ...s,
                    itinerary: updatedItinerary,
                    editingActivity: null,
                };
            });
        },
        []
    );

    const deleteActivity = useCallback(async (dayNumber: number, activityId: string) => {
        setState((s) => {
            if (!s.itinerary) return s;

            const updatedDays = s.itinerary.days.map((day) => ({
                ...day,
                activities: day.activities.filter(
                    (activity) => activity.id !== activityId
                ),
            }));

            const updatedItinerary = { ...s.itinerary, days: updatedDays };

            // Save to local storage
            storageService.saveItinerary(s.itinerary.id, updatedItinerary).catch((err) => {
                console.error('[ViewModel] Failed to save after delete:', err);
            });

            return {
                ...s,
                itinerary: updatedItinerary,
                editingActivity: null,
            };
        });
    }, []);

    const updateTripMetadata = useCallback(
        async (updates: Partial<Pick<Itinerary, 'trip_title' | 'start_date' | 'end_date'>>) => {
            setState((s) => {
                if (!s.itinerary) return s;

                const updatedItinerary = { ...s.itinerary, ...updates };

                // Save to local storage
                storageService.saveItinerary(s.itinerary.id, updatedItinerary).catch((err) => {
                    console.error('[ViewModel] Failed to save metadata:', err);
                });

                return {
                    ...s,
                    itinerary: updatedItinerary,
                };
            });
        },
        []
    );

    const enrichImages = useCallback(async () => {
        if (!state.itinerary) return;

        // Collect all image keywords that need enrichment
        const keywords: string[] = [];
        state.itinerary.days.forEach((day) => {
            day.activities.forEach((activity) => {
                if (!activity.image_url && activity.image_keyword) {
                    keywords.push(activity.image_keyword);
                }
            });
        });

        if (keywords.length === 0) return;

        try {
            const images = await apiService.enrichImages(keywords);

            setState((s) => {
                if (!s.itinerary) return s;

                const updatedDays = s.itinerary.days.map((day) => ({
                    ...day,
                    activities: day.activities.map((activity) => ({
                        ...activity,
                        image_url:
                            activity.image_url || images[activity.image_keyword] || undefined,
                    })),
                }));

                return { ...s, itinerary: { ...s.itinerary, days: updatedDays } };
            });
        } catch (err) {
            console.error("Failed to enrich images:", err);
        }
    }, [state.itinerary]);

    // Auto-fetch trip if tripId provided
    useEffect(() => {
        if (tripId) {
            fetchTrip(tripId);
        }
    }, [tripId, fetchTrip]);

    // Get current day's activities
    const currentDay = state.itinerary?.days.find(
        (d) => d.day_number === state.selectedDay
    );

    return {
        state: {
            ...state,
            currentDay,
            days: state.itinerary?.days || [],
        },
        actions: {
            fetchTrip,
            selectDay,
            openEditSheet,
            closeEditSheet,
            updateActivity,
            deleteActivity,
            updateTripMetadata,
            enrichImages,
        },
    };
}
