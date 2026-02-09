import React from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors } from "../constants/colors";
import { Day } from "../services/api-service";
import { ActivityCard } from "./activity-card";

interface DaySectionProps {
    day: Day;
    dayIndex: number;
    onEditActivity?: (activityId: string) => void;
}

export function DaySection({ day, dayIndex, onEditActivity }: DaySectionProps) {
    return (
        <Animated.View
            entering={FadeInDown.duration(400).delay(dayIndex * 100)}
            style={{ marginBottom: 32 }}
        >
            {/* Day Header */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                    paddingHorizontal: 24,
                }}
            >
                <View
                    style={{
                        backgroundColor: colors.regalNavy,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        marginRight: 12,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: colors.white,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                        }}
                    >
                        Day {day.day_number}
                    </Text>
                </View>
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: colors.carbonBlack,
                        flex: 1,
                    }}
                    numberOfLines={1}
                >
                    {day.theme_title.replace(/^Day \d+:\s*/, "")}
                </Text>
            </View>

            {/* Activities */}
            <View style={{ paddingHorizontal: 24, gap: 12 }}>
                {day.activities.map((activity, index) => (
                    <ActivityCard
                        key={activity.id}
                        activity={activity}
                        index={index}
                        onEdit={onEditActivity ? () => onEditActivity(activity.id) : undefined}
                    />
                ))}
            </View>

            {/* Empty State */}
            {day.activities.length === 0 && (
                <View
                    style={{
                        paddingHorizontal: 24,
                        paddingVertical: 32,
                        alignItems: "center",
                    }}
                >
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🗓️</Text>
                    <Text
                        style={{
                            fontSize: 14,
                            color: colors.ashBrown,
                        }}
                    >
                        No activities planned for this day
                    </Text>
                </View>
            )}
        </Animated.View>
    );
}
