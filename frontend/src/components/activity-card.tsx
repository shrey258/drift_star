import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Image } from "expo-image";
import { colors } from "../constants/colors";
import * as Haptics from "expo-haptics";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from "expo-blur";

interface Activity {
    id: string;
    name: string;
    description: string;
    start_time: string;
    duration_minutes: number;
    location_name: string;
    image_url?: string;
}

interface ActivityCardProps {
    activity: Activity;
    index: number;
    onEdit?: () => void;
    onDelete?: () => void;
    onAddToCalendar?: () => void;
}

function formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? "PM" : "AM";
    const displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${suffix}`;
}

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function ActivityCard({ activity, index, onEdit, onDelete, onAddToCalendar }: ActivityCardProps) {
    return (
        <Animated.View entering={FadeIn.duration(300).delay(index * 60)}>
            <Pressable
                onPress={() => {
                    if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    onEdit?.();
                }}
                onLongPress={() => {
                    if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }

                    // Show action sheet on long press
                    if (Platform.OS === 'ios') {
                        // iOS: Use ActionSheetIOS
                        const ActionSheetIOS = require('react-native').ActionSheetIOS;
                        ActionSheetIOS.showActionSheetWithOptions(
                            {
                                options: ['Cancel', 'Edit', 'Add to Calendar', 'Delete'],
                                destructiveButtonIndex: 3,
                                cancelButtonIndex: 0,
                            },
                            (buttonIndex: number) => {
                                if (buttonIndex === 1) {
                                    onEdit?.();
                                } else if (buttonIndex === 2) {
                                    onAddToCalendar?.();
                                } else if (buttonIndex === 3) {
                                    onDelete?.();
                                }
                            }
                        );
                    } else {
                        // Android: Just trigger edit for now (can add Android menu later)
                        onEdit?.();
                    }
                }}
                style={({ pressed }) => ({
                    backgroundColor: colors.white,
                    borderRadius: 20,
                    borderCurve: "continuous",
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: pressed ? colors.borderPressed : colors.borderLight,
                    boxShadow: pressed
                        ? colors.pressedShadow
                        : colors.softShadow,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                })}
            >
                {/* Image */}
                {activity.image_url && (
                    <View style={{ position: "relative", overflow: 'hidden' }}>
                        <Image
                            source={{ uri: activity.image_url }}
                            style={{ width: "100%", height: 200, backgroundColor: colors.paleOak }}
                            contentFit="cover"
                            transition={300}
                        />
                        {/* Smooth gradient overlay for better text contrast */}
                        <LinearGradient
                            colors={['transparent', colors.darkOverlay]}
                            style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 80,
                            }}
                            pointerEvents="none"
                        />

                        {/* Glassmorphic Time Badge over Image */}
                        <BlurView
                            intensity={Platform.OS === 'ios' ? 40 : 100}
                            tint="light"
                            style={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                borderRadius: 8,
                                overflow: 'hidden',
                                borderWidth: 1,
                                borderColor: colors.glassBorder,
                            }}
                        >
                            <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.glassOverlay }}>
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: "800",
                                        color: colors.coral,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    {formatTime(activity.start_time)}
                                </Text>
                            </View>
                        </BlurView>
                    </View>
                )}

                {/* Content */}
                <View style={{ padding: 20 }}>
                    {!activity.image_url && (
                        <View
                            style={{
                                backgroundColor: colors.primaryLight,
                                alignSelf: 'flex-start',
                                borderRadius: 8,
                                borderCurve: "continuous",
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                marginBottom: 12,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontWeight: "800",
                                    color: colors.coral,
                                    letterSpacing: 0.5,
                                }}
                            >
                                {formatTime(activity.start_time)}
                            </Text>
                        </View>
                    )}

                    {/* Name */}
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "800",
                            color: colors.carbonBlack,
                            marginBottom: 8,
                            letterSpacing: -0.5,
                        }}
                        numberOfLines={2}
                    >
                        {activity.name}
                    </Text>

                    {/* Description */}
                    <Text
                        style={{
                            fontSize: 15,
                            color: colors.ashBrown,
                            lineHeight: 22,
                            marginBottom: 16,
                            fontWeight: "400",
                        }}
                        numberOfLines={3}
                    >
                        {activity.description}
                    </Text>

                    {/* Footer: Location & Duration */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                            <Text style={{ fontSize: 14 }}>📍</Text>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: "600",
                                    color: colors.carbonBlack,
                                }}
                                numberOfLines={1}
                            >
                                {activity.location_name}
                            </Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={{ fontSize: 12, opacity: 0.6 }}>⏱</Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: "700",
                                    color: colors.ashBrown,
                                }}
                            >
                                {formatDuration(activity.duration_minutes)}
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}
