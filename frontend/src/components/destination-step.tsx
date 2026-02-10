import React, { useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
    withSpring,
    useSharedValue,
    interpolate,
    interpolateColor,
    FadeIn,
    FadeOut,
    Layout,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { colors } from "../constants/colors";
import { SUGGESTIONS } from "../constants/suggestions";

interface DestinationStepProps {
    isActive: boolean;
    isCompleted: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    onNext: () => void;
    onEdit: () => void;
    suggestions: any[]; // Replace 'any' with your CountrySuggestion type if exported
    onSelectSuggestion: (name: string, flag?: string) => void;
    isLoading: boolean;
    inputRef: React.RefObject<TextInput | null>;
}

export function DestinationStep({
    isActive,
    isCompleted,
    value,
    onChangeText,
    onFocus,
    onBlur,
    onNext,
    onEdit,
    suggestions,
    onSelectSuggestion,
    isLoading,
    inputRef,
}: DestinationStepProps) {
    // 0 = active, 1 = completed
    const completionProgress = useSharedValue(isCompleted ? 1 : 0);

    useEffect(() => {
        completionProgress.value = withSpring(isCompleted ? 1 : 0, {
            mass: 1,
            damping: 30, // Higher damping = less bounce, smoother stop
            stiffness: 250, // Higher stiffness = tighter handling
            overshootClamping: false, // Allow slight overshoot for organic feel
        });
    }, [isCompleted]);

    // Main container styles - transforms from input box to summary pill
    const containerAnimatedStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            completionProgress.value,
            [0, 1],
            [
                isActive ? colors.regalNavy : colors.borderLight, // Active border
                colors.borderLight, // Completed border
            ]
        );

        const paddingVertical = interpolate(
            completionProgress.value,
            [0, 1],
            [18, 14] // Input padding vs Pill padding
        );

        const paddingHorizontal = interpolate(
            completionProgress.value,
            [0, 1],
            [18, 0] // Remove horizontal padding when it becomes text
        );

        const backgroundColor = interpolateColor(
            completionProgress.value,
            [0, 1],
            [colors.white, "rgba(255, 255, 255, 0)"]
        );

        return {
            borderColor,
            paddingVertical,
            paddingHorizontal,
            backgroundColor,
            borderWidth: isCompleted ? 0 : 1.5,
            // Animate shadow opacity to 0 to remove card effect
            shadowOpacity: interpolate(completionProgress.value, [0, 1], [0.06, 0]),
            shadowRadius: interpolate(completionProgress.value, [0, 1], [8, 0]),
            elevation: interpolate(completionProgress.value, [0, 1], [2, 0]),
            marginBottom: 12, // Always keep some margin
        };
    });

    // Animated style for elements that should disappear (Title, Suggestions)
    // We use opacity + height collapse
    const disappearingContentStyle = useAnimatedStyle(() => {
        return {
            opacity: 1 - completionProgress.value,
            height: isCompleted ? 0 : "auto",
            overflow: "hidden",
            marginBottom: interpolate(completionProgress.value, [0, 1], [14, 0]),
        };
    }, [isCompleted]); // Re-run when state changes for layout updates

    // Dot style (only visible when completed)
    const dotStyle = useAnimatedStyle(() => {
        return {
            opacity: completionProgress.value,
            transform: [{ scale: completionProgress.value }],
            width: interpolate(completionProgress.value, [0, 1], [0, 6]),
            marginRight: interpolate(completionProgress.value, [0, 1], [0, 10]),
        };
    });

    return (
        <View style={{ width: "100%" }}>
            {/* Title - fades out */}
            <Animated.View style={disappearingContentStyle}>
                <Text style={styles.title}>Where to?</Text>
            </Animated.View>

            {/* Main Input/Summary Box */}
            {/* We wrap everything in Pressable to handle taps when completed */}
            <Pressable onPress={isCompleted ? onEdit : undefined} disabled={!isCompleted}>
                <Animated.View
                    style={[styles.box, containerAnimatedStyle]}
                    layout={Layout.duration(250)}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {/* Dot for summary state */}
                        <Animated.View
                            style={[
                                {
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: colors.regalNavy,
                                },
                                dotStyle,
                            ]}
                        />

                        {/* Input / Text Field */}
                        {/* When completed, we disable the input pointer events but keep it visible? 
                Actually, simpler to swap them or use TextInput as display. 
                Let's use TextInput for both but make it readOnly when completed.
            */}
                        <TextInput
                            ref={inputRef}
                            value={value}
                            onChangeText={onChangeText}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            placeholder="Enter a destination..."
                            placeholderTextColor={colors.paleOak}
                            editable={!isCompleted}
                            style={[
                                styles.input,
                                {
                                    paddingVertical: 0, // Remove internal padding as container handles it
                                    paddingHorizontal: 0,
                                    margin: 0,
                                    // When completed, it looks like text
                                    color: colors.carbonBlack,
                                    fontWeight: isCompleted ? "600" : "400",
                                    fontSize: isCompleted ? 24 : 17,
                                }
                            ]}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="next"
                            onSubmitEditing={onNext}
                        />

                        {/* Loading Spinner */}
                        {isLoading && !isCompleted && (
                            <ActivityIndicator
                                size="small"
                                color={colors.regalNavy}
                                style={{ marginLeft: 10 }}
                            />
                        )}
                    </View>
                </Animated.View>
            </Pressable>

            {/* Suggestions - disappear when completed */}
            {!isCompleted && (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                    {/* Autocomplete List */}
                    {suggestions.length > 0 && (
                        <View
                            style={{
                                marginTop: 8,
                                backgroundColor: colors.white,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                                boxShadow: "0 8px 24px rgba(27, 27, 27, 0.12)",
                                overflow: "hidden",
                            }}
                        >
                            {suggestions.map((country, index) => (
                                <Pressable
                                    key={country.name.common}
                                    onPress={() => onSelectSuggestion(country.name.common, country.flags.png)}
                                    style={({ pressed }) => ({
                                        flexDirection: "row",
                                        alignItems: "center",
                                        padding: 14,
                                        backgroundColor: pressed ? colors.primaryLight : "transparent",
                                        borderBottomWidth: index === suggestions.length - 1 ? 0 : 1,
                                        borderBottomColor: colors.borderLight,
                                    })}
                                >
                                    <Image
                                        source={{ uri: country.flags.png }}
                                        style={{
                                            width: 24,
                                            height: 16,
                                            borderRadius: 2,
                                            marginRight: 12,
                                        }}
                                        contentFit="cover"
                                    />
                                    <Text style={{ fontSize: 16, color: colors.carbonBlack }}>
                                        {country.name.common}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {/* Quick Suggestions */}
                    <View style={{ marginTop: 16 }}>
                        <Text style={styles.sectionTitle}>Popular</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                            {SUGGESTIONS.map((item) => {
                                const isSelected = value === item.name;
                                return (
                                    <Pressable
                                        key={item.name}
                                        onPress={() => onSelectSuggestion(item.name)}
                                        style={({ pressed }) => ({
                                            backgroundColor: isSelected ? colors.primaryLight : colors.white,
                                            borderRadius: 8,
                                            borderCurve: "continuous",
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderWidth: 1,
                                            borderColor: isSelected ? colors.regalNavy : colors.borderLight,
                                            opacity: pressed ? 0.7 : 1,
                                        })}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontWeight: "500",
                                                color: isSelected ? colors.regalNavy : colors.carbonBlack,
                                            }}
                                        >
                                            {item.emoji} {item.name}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        borderRadius: 16,
        borderCurve: "continuous",
        shadowColor: "rgb(27, 27, 27)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        overflow: "visible", // for shadow
    },
    title: {
        fontSize: 13,
        fontWeight: "800",
        color: colors.regalNavy,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        opacity: 0.8,
    },
    input: {
        fontSize: 18,
        color: colors.carbonBlack,
        flex: 1,
        letterSpacing: -0.2,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "800",
        color: colors.ashBrown,
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 12,
        opacity: 0.7,
    },
});
