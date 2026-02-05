import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { colors } from "../constants/colors";

const SPRING_CONFIG = {
    damping: 18,
    stiffness: 120,
    mass: 1,
};

type FormStepState = "active" | "completed" | "future";

interface FormStepProps {
    stepIndex: number;
    currentStep: number;
    title: string;
    completedSummary?: string;
    children: React.ReactNode;
}

export function FormStep({
    stepIndex,
    currentStep,
    title,
    completedSummary,
    children,
}: FormStepProps) {
    const { width } = useWindowDimensions();

    const getState = (): FormStepState => {
        if (stepIndex === currentStep) return "active";
        if (stepIndex < currentStep) return "completed";
        return "future";
    };

    const state = getState();

    const containerAnimatedStyle = useAnimatedStyle(() => {
        let translateY = 0;
        let scale = 1;
        let opacity = 1;

        if (state === "active") {
            translateY = 0;
            scale = 1;
            opacity = 1;
        } else if (state === "completed") {
            // Slight upward shift for stacking feel, but kept in-flow
            translateY = -10;
            scale = 0.98;
            opacity = 1;
        } else {
            translateY = 30;
            scale = 0.95;
            opacity = 0;
        }

        return {
            transform: [
                { translateY: withSpring(translateY, SPRING_CONFIG) },
                { scale: withSpring(scale, SPRING_CONFIG) },
            ],
            opacity: withTiming(opacity, { duration: 250 }),
        };
    }, [state]);

    const contentAnimatedStyle = useAnimatedStyle(() => {
        const isActive = state === "active";
        return {
            opacity: withTiming(isActive ? 1 : 0, { duration: 200 }),
            height: withTiming(isActive ? "auto" : 0, { duration: 250 }),
            marginTop: isActive ? 8 : 0,
        };
    }, [state]);

    const summaryAnimatedStyle = useAnimatedStyle(() => {
        const isCompleted = state === "completed";
        return {
            opacity: withTiming(isCompleted ? 1 : 0, { duration: 200 }),
            height: withTiming(isCompleted ? "auto" : 0, { duration: 250 }),
            marginBottom: isCompleted ? 16 : 0,
        };
    }, [state]);

    return (
        <Animated.View
            style={[
                {
                    width: "100%",
                    alignSelf: "center",
                },
                containerAnimatedStyle,
            ]}
        >
            {/* Completed Summary Pill */}
            <Animated.View
                style={[
                    {
                        backgroundColor: colors.white,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        flexDirection: "row",
                        alignItems: "center",
                        boxShadow: "0 2px 8px rgba(27, 27, 27, 0.04)",
                        overflow: "hidden",
                        borderCurve: "continuous",
                    },
                    summaryAnimatedStyle,
                ]}
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
                <Text
                    style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: colors.paleOak,
                        textTransform: "uppercase",
                    }}
                >
                    Edit
                </Text>
            </Animated.View>

            {/* Active Content */}
            <Animated.View style={[{ overflow: "hidden" }, contentAnimatedStyle]}>
                <View style={{ marginBottom: 12 }}>
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: colors.burntPeach,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                        }}
                    >
                        {title}
                    </Text>
                </View>
                {children}
            </Animated.View>
        </Animated.View>
    );
}
