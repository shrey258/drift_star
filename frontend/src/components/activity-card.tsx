import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Image } from "expo-image";
import { colors } from "../constants/colors";
import * as Haptics from "expo-haptics";

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

export function ActivityCard({ activity, index, onEdit, onDelete }: ActivityCardProps) {
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
                                options: ['Cancel', 'Edit', 'Delete'],
                                destructiveButtonIndex: 2,
                                cancelButtonIndex: 0,
                            },
                            (buttonIndex: number) => {
                                if (buttonIndex === 1) {
                                    onEdit?.();
                                } else if (buttonIndex === 2) {
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
                    borderRadius: 16,
                    borderCurve: "continuous",
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: pressed ? 'rgba(0, 0, 0, 0.12)' : colors.borderLight,
                    boxShadow: pressed
                        ? "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)"
                        : "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
            >
                {/* Image */}
                {activity.image_url && (
                    <View style={{ position: "relative" }}>
                        <Image
                            source={{ uri: activity.image_url }}
                            style={{ width: "100%", height: 180 }}
                            contentFit="cover"
                            transition={300}
                        />
                        {/* Gradient overlay for better text contrast */}
                        <View
                            style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 60,
                                backgroundColor: "rgba(0,0,0,0.15)",
                                pointerEvents: "none",
                            }}
                        />
                    </View>
                )}

                {/* Content */}
                <View style={{ padding: 18 }}>
                    {/* Time & Duration Row */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 12,
                            gap: 10,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: colors.primaryLight,
                                borderRadius: 7,
                                borderCurve: "continuous",
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontWeight: "800",
                                    color: colors.regalNavy,
                                    letterSpacing: 0.3,
                                }}
                            >
                                {formatTime(activity.start_time)}
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={{ fontSize: 12, color: colors.ashBrown }}>⏱</Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: "600",
                                    color: colors.ashBrown,
                                }}
                            >
                                {formatDuration(activity.duration_minutes)}
                            </Text>
                        </View>
                    </View>

                    {/* Name */}
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: "700",
                            color: colors.carbonBlack,
                            marginBottom: 8,
                            letterSpacing: -0.3,
                        }}
                        numberOfLines={2}
                    >
                        {activity.name}
                    </Text>

                    {/* Description */}
                    <Text
                        style={{
                            fontSize: 14,
                            color: colors.ashBrown,
                            lineHeight: 21,
                            marginBottom: 12,
                            fontWeight: "400",
                        }}
                        numberOfLines={2}
                    >
                        {activity.description}
                    </Text>

                    {/* Location */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
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
                </View>
            </Pressable>
        </Animated.View>
    );
}
