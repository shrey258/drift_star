import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { useEffect } from "react";
import { colors } from "../../src/constants/colors";
import { DayTabBar } from "../../src/components/day-tab-bar";
import { ActivityCard } from "../../src/components/activity-card";
import { useTripViewModel } from "../../src/view-models/use-trip-view-model";

export default function TripScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { state, actions } = useTripViewModel(id);

    // Enrich images once trip is loaded
    useEffect(() => {
        if (state.itinerary && !state.isLoading) {
            actions.enrichImages();
        }
    }, [state.itinerary?.id]);

    if (state.isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color={colors.regalNavy} />
                <Text style={{ marginTop: 16, color: colors.ashBrown, fontSize: 15 }}>
                    Loading your trip...
                </Text>
            </View>
        );
    }

    if (state.error || !state.itinerary) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 24,
                }}
            >
                <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: colors.carbonBlack,
                        textAlign: "center",
                        marginBottom: 8,
                    }}
                >
                    Trip not found
                </Text>
                <Text
                    style={{
                        fontSize: 15,
                        color: colors.ashBrown,
                        textAlign: "center",
                        marginBottom: 24,
                    }}
                >
                    {state.error || "This trip doesn't exist or has been deleted."}
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.regalNavy,
                        paddingHorizontal: 24,
                        paddingVertical: 14,
                        borderRadius: 12,
                    }}
                >
                    <Text style={{ color: colors.white, fontWeight: "600", fontSize: 15 }}>
                        Go Back
                    </Text>
                </Pressable>
            </View>
        );
    }

    const { itinerary, currentDay, days, selectedDay } = state;

    // Format date range
    const formatDateRange = () => {
        if (!itinerary.start_date) return null;
        const start = new Date(itinerary.start_date);
        const end = itinerary.end_date ? new Date(itinerary.end_date) : start;
        const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
        return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 24,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View
                    style={{
                        paddingTop: insets.top + 16,
                        paddingHorizontal: 24,
                        paddingBottom: 20,
                    }}
                >
                    {/* Back Button */}
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 20,
                            opacity: pressed ? 0.6 : 1,
                        })}
                    >
                        <Text style={{ fontSize: 15, color: colors.ashBrown }}>← Back</Text>
                    </Pressable>

                    {/* Trip Title */}
                    <Animated.View entering={FadeInDown.duration(400)}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 8,
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: colors.primaryLight,
                                    borderRadius: 8,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: "700",
                                        color: colors.regalNavy,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {itinerary.destination}
                                </Text>
                            </View>
                            {formatDateRange() && (
                                <Text
                                    style={{
                                        marginLeft: 10,
                                        fontSize: 13,
                                        color: colors.ashBrown,
                                    }}
                                >
                                    {formatDateRange()}
                                </Text>
                            )}
                        </View>

                        <Text
                            style={{
                                fontSize: 28,
                                fontWeight: "700",
                                color: colors.carbonBlack,
                                lineHeight: 36,
                            }}
                        >
                            {itinerary.trip_title}
                        </Text>
                    </Animated.View>
                </View>

                {/* Day Tabs */}
                <DayTabBar
                    days={days}
                    selectedDay={selectedDay}
                    onSelectDay={actions.selectDay}
                />

                {/* Current Day Header */}
                {currentDay && (
                    <Animated.View
                        entering={FadeIn.duration(300)}
                        style={{ paddingHorizontal: 24, marginBottom: 20 }}
                    >
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: "700",
                                color: colors.carbonBlack,
                                marginBottom: 4,
                            }}
                        >
                            {currentDay.theme_title}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.ashBrown }}>
                            {currentDay.activities.length} activities planned
                        </Text>
                    </Animated.View>
                )}

                {/* Activities Timeline */}
                <View style={{ paddingHorizontal: 24 }}>
                    {currentDay?.activities.map((activity, index) => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            index={index}
                            onEdit={() => actions.openEditSheet(activity)}
                        />
                    ))}
                </View>

                {/* Empty State */}
                {currentDay?.activities.length === 0 && (
                    <View
                        style={{
                            paddingHorizontal: 24,
                            paddingVertical: 48,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>🗓️</Text>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: colors.carbonBlack,
                                marginBottom: 4,
                            }}
                        >
                            No activities yet
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.ashBrown }}>
                            Add activities to this day
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
