import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    interpolate,
    FadeIn,
    FadeOut,
} from "react-native-reanimated";
import { colors } from "../constants/colors";

const { width } = Dimensions.get("window");

interface GeneratingOverlayProps {
    visible: boolean;
    destination: string;
}

const LOADING_MESSAGES = [
    "Planning your adventure...",
    "Finding hidden gems...",
    "Crafting perfect moments...",
    "Mapping local favorites...",
    "Building your itinerary...",
];

export function GeneratingOverlay({ visible, destination }: GeneratingOverlayProps) {
    const [messageIndex, setMessageIndex] = useState(0);

    // Pulsing animation for the main orb
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0.6);
    const rotation = useSharedValue(0);

    // Dots animation
    const dot1 = useSharedValue(0);
    const dot2 = useSharedValue(0);
    const dot3 = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            // Start pulse animation
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );

            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000 }),
                    withTiming(0.6, { duration: 1000 })
                ),
                -1,
                false
            );

            // Rotation for the ring
            rotation.value = withRepeat(
                withTiming(360, { duration: 4000, easing: Easing.linear }),
                -1,
                false
            );

            // Bouncing dots
            dot1.value = withRepeat(
                withSequence(
                    withTiming(-8, { duration: 300 }),
                    withTiming(0, { duration: 300 })
                ),
                -1,
                false
            );
            dot2.value = withDelay(
                100,
                withRepeat(
                    withSequence(
                        withTiming(-8, { duration: 300 }),
                        withTiming(0, { duration: 300 })
                    ),
                    -1,
                    false
                )
            );
            dot3.value = withDelay(
                200,
                withRepeat(
                    withSequence(
                        withTiming(-8, { duration: 300 }),
                        withTiming(0, { duration: 300 })
                    ),
                    -1,
                    false
                )
            );

            // Cycle through messages
            const interval = setInterval(() => {
                setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
            }, 2500);

            return () => clearInterval(interval);
        }
    }, [visible]);

    const orbStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const dot1Style = useAnimatedStyle(() => ({
        transform: [{ translateY: dot1.value }],
    }));
    const dot2Style = useAnimatedStyle(() => ({
        transform: [{ translateY: dot2.value }],
    }));
    const dot3Style = useAnimatedStyle(() => ({
        transform: [{ translateY: dot3.value }],
    }));

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.overlay}
        >
            <View style={styles.content}>
                {/* Animated Orb */}
                <View style={styles.orbContainer}>
                    {/* Rotating ring */}
                    <Animated.View style={[styles.ring, ringStyle]}>
                        <View style={styles.ringDot} />
                    </Animated.View>

                    {/* Pulsing orb */}
                    <Animated.View style={[styles.orb, orbStyle]}>
                        <Text style={styles.orbEmoji}>✈️</Text>
                    </Animated.View>
                </View>

                {/* Destination */}
                <Text style={styles.destination}>{destination}</Text>

                {/* Loading message with dots */}
                <Animated.View
                    key={messageIndex}
                    entering={FadeIn.duration(300)}
                    style={styles.messageContainer}
                >
                    <Text style={styles.message}>{LOADING_MESSAGES[messageIndex]}</Text>
                </Animated.View>

                {/* Bouncing dots */}
                <View style={styles.dotsContainer}>
                    <Animated.View style={[styles.dot, dot1Style]} />
                    <Animated.View style={[styles.dot, dot2Style]} />
                    <Animated.View style={[styles.dot, dot3Style]} />
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
    },
    content: {
        alignItems: "center",
        paddingHorizontal: 32,
    },
    orbContainer: {
        width: 120,
        height: 120,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 32,
    },
    orb: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.regalNavy,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    orbEmoji: {
        fontSize: 36,
    },
    ring: {
        position: "absolute",
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 2,
        borderColor: colors.regalNavy,
        borderStyle: "dashed",
        opacity: 0.3,
    },
    ringDot: {
        position: "absolute",
        top: -4,
        left: "50%",
        marginLeft: -4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.regalNavy,
    },
    destination: {
        fontSize: 28,
        fontWeight: "700",
        color: colors.carbonBlack,
        marginBottom: 8,
        textAlign: "center",
    },
    messageContainer: {
        height: 24,
        justifyContent: "center",
    },
    message: {
        fontSize: 16,
        fontWeight: "500",
        color: colors.ashBrown,
        textAlign: "center",
    },
    dotsContainer: {
        flexDirection: "row",
        gap: 6,
        marginTop: 24,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.regalNavy,
    },
});
