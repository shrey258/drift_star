import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
} from "react-native-reanimated";
import { colors } from "../constants/colors";

interface FormStepProps {
    stepIndex: number;
    currentStep: number;
    title: string;
    completedSummary?: string;
    onEdit?: () => void;
    children: React.ReactNode;
}

export function FormStep({
    stepIndex,
    currentStep,
    title,
    completedSummary,
    onEdit,
    children,
}: FormStepProps) {
    const isActive = stepIndex === currentStep;
    const isCompleted = stepIndex < currentStep;
    const isFuture = stepIndex > currentStep;

    // Don't render future steps at all
    if (isFuture) return null;

    return (
        <Animated.View
            layout={LinearTransition.springify().damping(18).stiffness(120)}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ width: "100%" }}
        >
            {/* Completed: Show summary pill */}
            {isCompleted && (
                <Pressable
                    onPress={onEdit}
                    style={({ pressed }) => ({
                        backgroundColor: colors.white,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                        boxShadow: "0 1px 4px rgba(27, 27, 27, 0.04)",
                        borderCurve: "continuous",
                        opacity: pressed ? 0.8 : 1,
                    })}
                >
                    <View
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: colors.regalNavy,
                            marginRight: 10,
                        }}
                    />
                    <Text
                        style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: colors.carbonBlack,
                            flex: 1,
                        }}
                        numberOfLines={1}
                    >
                        {completedSummary || title}
                    </Text>
                    {onEdit && (
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: colors.ashBrown,
                                textTransform: "uppercase",
                            }}
                        >
                            Edit
                        </Text>
                    )}
                </Pressable>
            )}

            {/* Active: Show full content */}
            {isActive && (
                <Animated.View
                    entering={FadeIn.duration(300).delay(100)}
                >
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: colors.burntPeach,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            marginBottom: 14,
                        }}
                    >
                        {title}
                    </Text>
                    {children}
                </Animated.View>
            )}
        </Animated.View>
    );
}
