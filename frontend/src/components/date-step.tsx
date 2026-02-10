import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Pressable,
    Platform,
    StyleSheet,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
    useSharedValue,
    interpolate,
    interpolateColor,
    FadeIn,
    FadeOut,
    Layout,
    withSpring,
    withDelay,
} from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "../constants/colors";

interface DateStepProps {
    isActive: boolean;
    isCompleted: boolean;
    date: Date;
    onChange: (date: Date) => void;
    onNext: () => void;
    onEdit: () => void;
}

export function DateStep({
    isActive,
    isCompleted,
    date,
    onChange,
    onNext,
    onEdit,
}: DateStepProps) {
    // 0 = active, 1 = completed
    const textProgress = useSharedValue(isCompleted ? 1 : 0);
    const containerProgress = useSharedValue(isCompleted ? 1 : 0);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        // Text animates immediately
        textProgress.value = withSpring(isCompleted ? 1 : 0, {
            mass: 1,
            damping: 30,
            stiffness: 250,
            overshootClamping: false,
        });

        // Container animates with delay when completing (to let text settle)
        // Animates immediately when going back to active
        if (isCompleted) {
            containerProgress.value = withDelay(200, withSpring(1, {
                mass: 1,
                damping: 30,
                stiffness: 250,
                overshootClamping: false,
            }));
        } else {
            containerProgress.value = withSpring(0, {
                mass: 1,
                damping: 30,
                stiffness: 250,
                overshootClamping: false,
            });
        }
    }, [isCompleted]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false); // Close dialog on Android
        }

        if (selectedDate) {
            onChange(selectedDate);
        }
    };

    // Main container styles - uses delayed progress
    const containerAnimatedStyle = useAnimatedStyle(() => {
        // Transparent background when completed
        const backgroundColor = interpolateColor(
            containerProgress.value,
            [0, 1],
            [colors.white, "rgba(255, 255, 255, 0)"]
        );

        // Fade out border
        const borderColor = interpolateColor(
            containerProgress.value,
            [0, 1],
            [
                isActive ? colors.regalNavy : colors.borderLight,
                colors.borderLight, // Completed border (invisible due to width 0)
            ]
        );

        return {
            borderColor,
            backgroundColor,
            borderWidth: interpolate(containerProgress.value, [0, 1], [1.5, 0]),
            paddingHorizontal: interpolate(containerProgress.value, [0, 1], [0, 0]), // Explicitly handle padding if needed
            shadowOpacity: interpolate(containerProgress.value, [0, 1], [0.06, 0]),
            elevation: interpolate(containerProgress.value, [0, 1], [2, 0]),
            shadowRadius: interpolate(containerProgress.value, [0, 1], [8, 0]),
            marginBottom: 12,
            overflow: "hidden",
        };
    });

    // Title styles
    const disappearingContentStyle = useAnimatedStyle(() => {
        return {
            opacity: 1 - textProgress.value,
            height: isCompleted ? 0 : "auto",
            overflow: "hidden",
            marginBottom: interpolate(textProgress.value, [0, 1], [14, 0]),
        };
    }, [isCompleted]);

    // Dot style - uses text progress (appears with text change)
    const dotStyle = useAnimatedStyle(() => {
        return {
            opacity: textProgress.value,
            transform: [{ scale: textProgress.value }],
            width: interpolate(textProgress.value, [0, 1], [0, 6]),
            marginRight: interpolate(textProgress.value, [0, 1], [0, 10]),
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.regalNavy,
        };
    });

    const textAnimatedStyle = useAnimatedStyle(() => {
        return {
            fontSize: interpolate(textProgress.value, [0, 1], [17, 24]),
            color: interpolateColor(textProgress.value, [0, 1], [colors.regalNavy, colors.carbonBlack]),
        };
    });

    const formattedDate = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const togglePicker = () => {
        setShowPicker(!showPicker);
    }

    if (!isActive && !isCompleted) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeIn.duration(500).delay(300)}
            exiting={FadeOut.duration(300)}
            style={{ width: "100%" }}
        >
            {/* Title */}
            <Animated.View style={disappearingContentStyle}>
                <Text style={styles.title}>When?</Text>
            </Animated.View>

            <Pressable
                onPress={isCompleted ? onEdit : undefined}
                disabled={!isCompleted}
            >
                <Animated.View
                    style={[styles.box, containerAnimatedStyle]}
                    layout={Layout.duration(250)}
                >
                    <Animated.View
                        layout={Layout.duration(250)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: isCompleted ? 0 : 18,
                        }}
                    >
                        {/* Left side: Dot + Date Text */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            {/* Dot - Scale in when completed */}
                            <Animated.View style={dotStyle} />

                            {/* The Date Text */}
                            <Animated.Text
                                layout={Layout.duration(250)}
                                style={[styles.baseDateText, textAnimatedStyle]}
                            >
                                {formattedDate}
                            </Animated.Text>
                        </View>

                        {/* Change Button - Fade out when completed */}
                        {!isCompleted && (
                            <Animated.View exiting={FadeOut.duration(200)}>
                                <Pressable
                                    onPress={togglePicker}
                                    style={({ pressed }) => ({
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        backgroundColor: pressed ? colors.background : colors.white,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: colors.borderLight,
                                    })}
                                >
                                    <Text style={styles.changeButtonText}>
                                        {showPicker ? "Hide Calendar" : "Change Date"}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                        )}
                    </Animated.View>

                    {/* Picker Area */}
                    {!isCompleted && showPicker && (
                        <Animated.View
                            entering={FadeIn}
                            exiting={FadeOut}
                            style={{ width: '100%', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.background }}
                        >
                            {Platform.OS === 'ios' && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="spinner"
                                    minimumDate={new Date()}
                                    themeVariant="light"
                                    onChange={handleDateChange}
                                    style={{ height: 180, width: "100%" }}
                                />
                            )}
                            {Platform.OS === 'android' && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="default"
                                    minimumDate={new Date()}
                                    onChange={handleDateChange}
                                />
                            )}
                        </Animated.View>
                    )}

                </Animated.View>
            </Pressable>
        </Animated.View>
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
        backgroundColor: colors.white,
    },
    title: {
        fontSize: 13,
        fontWeight: "800",
        color: colors.regalNavy,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        opacity: 0.8,
    },
    summaryText: {
        fontSize: 24,
        fontWeight: "800",
        color: colors.carbonBlack,
        letterSpacing: -0.5,
    },
    baseDateText: {
        fontWeight: '700',
    },
    activeDateText: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.regalNavy,
        letterSpacing: -0.5,
    },
    changeButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.regalNavy,
    }
});
