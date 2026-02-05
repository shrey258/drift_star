import { useState, useRef, useEffect, useCallback } from "react";
import { TextInput, Keyboard } from "react-native";
import { useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { CountryService, CountrySuggestion } from "../services/country-service";

export const useHomeViewModel = () => {
    const [destination, setDestination] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const buttonScale = useSharedValue(1);

    // Debounce logic for country search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (destination.length > 2 && isFocused) {
                handleSearch(destination);
            } else {
                setCountries([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [destination, isFocused]);

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
        // Small timeout to allow suggestion press to trigger before blur clears list
        setTimeout(() => {
            setIsFocused(false);
        }, 200);
    }, []);

    const handleSuggestionPress = useCallback((name: string) => {
        setDestination(name);
        setCountries([]);
        if (process.env.EXPO_OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Keyboard.dismiss();
    }, []);

    const handleExplorePress = useCallback(() => {
        if (!destination.trim()) return;

        buttonScale.value = withSpring(0.96, { damping: 15 }, () => {
            buttonScale.value = withSpring(1, { damping: 15 });
        });

        if (process.env.EXPO_OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        console.log("Exploring:", destination);
        // TODO: Add navigation logic here
    }, [destination]);

    return {
        state: {
            destination,
            isFocused,
            countries,
            isLoading,
        },
        refs: {
            inputRef,
        },
        animations: {
            buttonScale,
        },
        actions: {
            setDestination,
            handleInputFocus,
            handleInputBlur,
            handleSuggestionPress,
            handleExplorePress,
        },
    };
};
