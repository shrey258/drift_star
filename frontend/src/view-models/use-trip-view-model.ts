import { useState, useCallback, useEffect } from "react";
import { apiService, Itinerary, Activity } from "../services/api-service";

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
    updateActivity: (activityId: string, updates: Partial<Activity>) => void;
    deleteActivity: (activityId: string) => void;
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
            const itinerary = await apiService.getTrip(id);
            setState((s) => ({
                ...s,
                itinerary,
                isLoading: false,
                selectedDay: itinerary.days[0]?.day_number || 1,
            }));
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
        (activityId: string, updates: Partial<Activity>) => {
            setState((s) => {
                if (!s.itinerary) return s;

                const updatedDays = s.itinerary.days.map((day) => ({
                    ...day,
                    activities: day.activities.map((activity) =>
                        activity.id === activityId ? { ...activity, ...updates } : activity
                    ),
                }));

                return {
                    ...s,
                    itinerary: { ...s.itinerary, days: updatedDays },
                    editingActivity: null,
                };
            });
        },
        []
    );

    const deleteActivity = useCallback((activityId: string) => {
        setState((s) => {
            if (!s.itinerary) return s;

            const updatedDays = s.itinerary.days.map((day) => ({
                ...day,
                activities: day.activities.filter(
                    (activity) => activity.id !== activityId
                ),
            }));

            return {
                ...s,
                itinerary: { ...s.itinerary, days: updatedDays },
                editingActivity: null,
            };
        });
    }, []);

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
            enrichImages,
        },
    };
}
