import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Image } from "expo-image";
import { colors } from "../constants/colors";

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

export function ActivityCard({ activity, index, onEdit }: ActivityCardProps) {
    return (
        <Animated.View entering={FadeIn.duration(300).delay(index * 60)}>
            <Pressable
                onPress={onEdit}
                style={({ pressed }) => ({
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    borderCurve: "continuous",
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    shadowColor: "rgb(27, 27, 27)",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                    opacity: pressed ? 0.95 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
            >
                {/* Image */}
                {activity.image_url && (
                    <Image
                        source={{ uri: activity.image_url }}
                        style={{ width: "100%", height: 160 }}
                        contentFit="cover"
                        transition={300}
                    />
                )}

                {/* Content */}
                <View style={{ padding: 16 }}>
                    {/* Time & Duration Row */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 10,
                            gap: 8,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: colors.primaryLight,
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontWeight: "700",
                                    color: colors.regalNavy,
                                }}
                            >
                                {formatTime(activity.start_time)}
                            </Text>
                        </View>
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: "500",
                                color: colors.ashBrown,
                            }}
                        >
                            • {formatDuration(activity.duration_minutes)}
                        </Text>
                    </View>

                    {/* Name */}
                    <Text
                        style={{
                            fontSize: 17,
                            fontWeight: "700",
                            color: colors.carbonBlack,
                            marginBottom: 6,
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
                            lineHeight: 20,
                            marginBottom: 10,
                        }}
                        numberOfLines={2}
                    >
                        {activity.description}
                    </Text>

                    {/* Location */}
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 14 }}>📍</Text>
                        <Text
                            style={{
                                fontSize: 13,
                                fontWeight: "500",
                                color: colors.carbonBlack,
                                marginLeft: 4,
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
