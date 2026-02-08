import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { TextInput, Keyboard } from "react-native";
import { useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { CountryService, CountrySuggestion } from "../services/country-service";
import { apiService } from "../services/api-service";

export type FormStep = 0 | 1 | 2;

export interface TripFormState {
    destination: string;
    destinationFlag?: string;
    travelDate: Date;
    numberOfDays: number;
}

export const useHomeViewModel = () => {
    const router = useRouter();

    // Form state
    const [currentStep, setCurrentStep] = useState<FormStep>(0);
    const [destination, setDestination] = useState("");
    const [destinationFlag, setDestinationFlag] = useState<string | undefined>();
    const [travelDate, setTravelDate] = useState(new Date());
    const [numberOfDays, setNumberOfDays] = useState(3);

    // UI state
    const [isFocused, setIsFocused] = useState(false);
    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreGenerating, setIsPreGenerating] = useState(false); // Visual delay state
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const buttonScale = useSharedValue(1);

    // Debounce logic for country search
    useEffect(() => {
        if (currentStep !== 0) return;

        const timer = setTimeout(() => {
            if (destination.length > 2 && isFocused) {
                handleSearch(destination);
            } else {
                setCountries([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [destination, isFocused, currentStep]);

    const handleSearch = async (query: string) => {
        setIsLoading(true);
        const results = await CountryService.searchCountries(query);
        setCountries(results);
        setIsLoading(false);
    };

    const handleInputFocus = useCallback(() => {
        setIsFocused(true);
        if (process.env.EXPO_OS === "ios") {
            Haptics.selectionAsync();
        }
    }, []);

    const handleInputBlur = useCallback(() => {
        setTimeout(() => {
            setIsFocused(false);
        }, 200);
    }, []);

    const handleDestinationSelect = useCallback((name: string, flagUrl?: string) => {
        setDestination(name);
        setDestinationFlag(flagUrl);
        setCountries([]);
        if (process.env.EXPO_OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Keyboard.dismiss();
    }, []);

    const goToNextStep = useCallback(() => {
        if (currentStep < 2) {
            setCurrentStep((prev) => (prev + 1) as FormStep);
            if (process.env.EXPO_OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        }
    }, [currentStep]);

    const goToPreviousStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep((prev) => (prev - 1) as FormStep);
            if (process.env.EXPO_OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }
    }, [currentStep]);

    const handleSubmit = useCallback(async () => {
        buttonScale.value = withSpring(0.96, { damping: 15 }, () => {
            buttonScale.value = withSpring(1, { damping: 15 });
        });

        if (process.env.EXPO_OS === "ios") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        if (process.env.EXPO_OS === "ios") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // START VISUAL DELAY (1s)
        setIsPreGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsPreGenerating(false);
        setIsGenerating(true);
        setError(null);

        try {
            const itinerary = await apiService.generateItinerary(
                destination,
                numberOfDays,
                travelDate
            );

            // Navigate to trip screen with the generated trip ID
            router.push(`/trip/${itinerary.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate itinerary");
            if (process.env.EXPO_OS === "ios") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } finally {
            setIsGenerating(false);
        }
    }, [destination, travelDate, numberOfDays, router]);

    // Validation
    const isCurrentStepValid = useMemo(() => {
        switch (currentStep) {
            case 0:
                return destination.trim().length > 0;
            case 1:
                return travelDate instanceof Date;
            case 2:
                return numberOfDays >= 1 && numberOfDays <= 14;
            default:
                return false;
        }
    }, [currentStep, destination, travelDate, numberOfDays]);

    const isLastStep = currentStep === 2;

    // Summaries for completed steps
    const getStepSummary = useCallback(
        (step: FormStep): string => {
            switch (step) {
                case 0:
                    return destination || "Destination";
                case 1:
                    return travelDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    });
                case 2:
                    return `${numberOfDays} day${numberOfDays > 1 ? "s" : ""}`;
                default:
                    return "";
            }
        },
        [destination, travelDate, numberOfDays]
    );

    return {
        state: {
            currentStep,
            destination,
            destinationFlag,
            travelDate,
            numberOfDays,
            isFocused,
            countries,
            isLoading,
            isPreGenerating,
            isGenerating,
            error,
            showDatePicker,
            isCurrentStepValid,
            isLastStep,
        },
        refs: {
            inputRef,
        },
        animations: {
            buttonScale,
        },
        actions: {
            setDestination,
            setTravelDate,
            setNumberOfDays,
            setShowDatePicker,
            setCurrentStep,
            handleInputFocus,
            handleInputBlur,
            handleDestinationSelect,
            goToNextStep,
            goToPreviousStep,
            handleSubmit,
            getStepSummary,
        },
    };
};
