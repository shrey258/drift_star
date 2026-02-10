import React, { useEffect } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    interpolate,
    interpolateColor,
    FadeIn,
    FadeOut,
    Layout,
    withDelay,
} from "react-native-reanimated";
import { colors } from "../constants/colors";

interface DaysStepProps {
    isActive: boolean;
    isCompleted: boolean;
    days: number;
    onChange: (days: number) => void;
    onNext: () => void;
    onEdit: () => void;
}

export function DaysStep({
    isActive,
    isCompleted,
    days,
    onChange,
    onNext,
    onEdit,
}: DaysStepProps) {
    // 0 = active, 1 = completed
    const completionProgress = useSharedValue(isCompleted ? 1 : 0);

    useEffect(() => {
        completionProgress.value = withSpring(isCompleted ? 1 : 0, {
            mass: 1,
            damping: 30,
            stiffness: 250,
            overshootClamping: false,
        });
    }, [isCompleted]);

    // Container Style - morphs from white box to transparent summary
    const containerAnimatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            completionProgress.value,
            [0, 1],
            [colors.white, "rgba(255, 255, 255, 0)"]
        );

        const borderColor = interpolateColor(
            completionProgress.value,
            [0, 1],
            [colors.borderLight, "rgba(229, 231, 235, 0)"]
        );

        return {
            backgroundColor,
            borderColor,
            borderWidth: interpolate(completionProgress.value, [0, 1], [1.5, 0]),
            shadowOpacity: interpolate(completionProgress.value, [0, 1], [0.06, 0]),
            elevation: interpolate(completionProgress.value, [0, 1], [2, 0]),
            marginBottom: 12, // Maintain spacing
        };
    });

    // Title - Fades out
    const disappearingContentStyle = useAnimatedStyle(() => {
        return {
            opacity: 1 - completionProgress.value,
            height: isCompleted ? 0 : "auto",
            overflow: "hidden",
            marginBottom: interpolate(completionProgress.value, [0, 1], [14, 0]),
        };
    }, [isCompleted]);

    // Dot Style - Scales in
    const dotStyle = useAnimatedStyle(() => {
        return {
            opacity: completionProgress.value,
            transform: [{ scale: completionProgress.value }],
            width: interpolate(completionProgress.value, [0, 1], [0, 6]),
            marginRight: interpolate(completionProgress.value, [0, 1], [0, 10]),
        };
    });

    // Text Animations
    const numberTextStyle = useAnimatedStyle(() => {
        return {
            fontSize: interpolate(completionProgress.value, [0, 1], [56, 24]),
            color: interpolateColor(
                completionProgress.value,
                [0, 1],
                [colors.regalNavy, colors.carbonBlack]
            ),
            lineHeight: interpolate(completionProgress.value, [0, 1], [64, 32]),
        };
    });

    const labelTextStyle = useAnimatedStyle(() => {
        return {
            fontSize: interpolate(completionProgress.value, [0, 1], [15, 24]),
            color: interpolateColor(
                completionProgress.value,
                [0, 1],
                [colors.ashBrown, colors.carbonBlack]
            ),
            // Align baseline with number
            marginBottom: interpolate(completionProgress.value, [0, 1], [6, 0]),
            marginTop: interpolate(completionProgress.value, [0, 1], [-6, 0]),
        };
    });

    if (!isActive && !isCompleted) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(500).delay(300)}
            exiting={FadeOut.duration(300)}
            style={{ width: "100%" }}
        >
            {/* Title */}
            <Animated.View style={disappearingContentStyle}>
                <Text style={styles.title}>How long?</Text>
            </Animated.View>

            {/* Main Container */}
            <Animated.View
                layout={Layout.duration(250)}
                style={[
                    {
                        paddingVertical: isCompleted ? 0 : 32,
                        paddingHorizontal: isCompleted ? 0 : 24,
                        borderRadius: 16,
                        overflow: 'hidden',
                    },
                    containerAnimatedStyle
                ]}
            >
                <Animated.View
                    layout={Layout.duration(250)}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: isCompleted ? "flex-start" : "center",
                    }}
                >
                    {/* Dot Indicator */}
                    <Animated.View
                        style={[
                            {
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: colors.regalNavy,
                            },
                            dotStyle
                        ]}
                    />

                    {/* Left Button */}
                    {!isCompleted && (
                        <Animated.View exiting={FadeOut.duration(200)} style={{ marginRight: 32 }}>
                            <Pressable
                                onPress={() => onChange(Math.max(1, days - 1))}
                                style={({ pressed }) => ({
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    backgroundColor: pressed ? colors.primaryLight : colors.white,
                                    borderWidth: 1.5,
                                    borderColor: colors.borderLight,
                                    justifyContent: "center",
                                    alignItems: "center",
                                })}
                            >
                                <Text style={styles.buttonText}>−</Text>
                            </Pressable>
                        </Animated.View>
                    )}

                    {/* Number & Label Wrapper */}
                    <Animated.View
                        layout={Layout.duration(250)}
                        style={{
                            alignItems: isCompleted ? "center" : "center",
                            flexDirection: isCompleted ? "row" : "column",
                            // When completed, remove minWidth to let it collapse to text width
                            minWidth: isCompleted ? 0 : 90,
                            gap: isCompleted ? 5 : 0,
                        }}
                    >
                        <Animated.Text
                            style={[
                                { fontWeight: "700", fontVariant: ["tabular-nums"] },
                                numberTextStyle
                            ]}
                        >
                            {days}
                        </Animated.Text>
                        <Animated.Text
                            style={[
                                { fontWeight: "500" },
                                labelTextStyle
                            ]}
                        >
                            {days === 1 ? "day" : "days"}
                        </Animated.Text>
                    </Animated.View>

                    {/* Right Button */}
                    {!isCompleted && (
                        <Animated.View exiting={FadeOut.duration(200)} style={{ marginLeft: 32 }}>
                            <Pressable
                                onPress={() => onChange(Math.min(14, days + 1))}
                                style={({ pressed }) => ({
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    backgroundColor: pressed ? colors.primaryLight : colors.white,
                                    borderWidth: 1.5,
                                    borderColor: colors.borderLight,
                                    justifyContent: "center",
                                    alignItems: "center",
                                })}
                            >
                                <Text style={styles.buttonText}>+</Text>
                            </Pressable>
                        </Animated.View>
                    )}
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 13,
        fontWeight: "800",
        color: colors.regalNavy,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        opacity: 0.8,
    },
    buttonText: {
        fontSize: 28,
        fontWeight: "500",
        color: colors.regalNavy,
        marginTop: -2,
    }
});
