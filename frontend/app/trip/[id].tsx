import { View, Text, Pressable, ActivityIndicator, SectionList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useEffect } from "react";
import { colors } from "../../src/constants/colors";
import { useTripViewModel } from "../../src/view-models/use-trip-view-model";
import { ActivityCard } from "../../src/components/activity-card";
import { Day, Activity } from "../../src/services/api-service";
import { BlurView } from "expo-blur";

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

    // Loading State
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

    // Error State
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

    const { itinerary } = state;

    // Helper: Format date range
    const formatDateRange = () => {
        if (!itinerary.start_date) return null;
        const start = new Date(itinerary.start_date);
        const end = itinerary.end_date ? new Date(itinerary.end_date) : start;
        const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
        return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
    };

    // Prepare Sections for SectionList
    const sections = itinerary.days.map((day) => ({
        day: day, // Keep ref to full day object
        data: day.activities, // Items for this section
    }));

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <SectionList
                sections={sections}
                keyExtractor={(item: Activity) => item.id}
                stickySectionHeadersEnabled={true}
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 32,
                }}
                showsVerticalScrollIndicator={false}
                // Sticky Header Component (Day Title)
                renderSectionHeader={({ section: { day } }) => (
                    <BlurView
                        intensity={Platform.OS === 'ios' ? 80 : 0}
                        tint="light"
                        style={{
                            paddingTop: Platform.OS === 'ios' ? insets.top : 12, // Add safe area for iOS sticky state
                            paddingBottom: 12,
                            paddingHorizontal: 24,
                            // Fallback background for Android or non-blur
                            backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : colors.background,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(0,0,0,0.05)',
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View
                                style={{
                                    backgroundColor: colors.regalNavy,
                                    borderRadius: 6,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    marginRight: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: "700",
                                        color: colors.white,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Day {day.day_number}
                                </Text>
                            </View>
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontWeight: "700",
                                    color: colors.carbonBlack,
                                    flex: 1,
                                }}
                                numberOfLines={1}
                            >
                                {day.theme_title.replace(/^Day \d+:\s*/, "")}
                            </Text>
                        </View>
                    </BlurView>
                )}
                // List Item (Activity Card)
                renderItem={({ item, index }) => (
                    <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
                        <ActivityCard
                            activity={item}
                            index={index}
                            onEdit={() => {
                                // TODO: Edit action
                                console.log("Edit:", item.id);
                            }}
                        />
                    </View>
                )}
                // Page Header (Trip Info)
                ListHeaderComponent={
                    <View
                        style={{
                            paddingTop: insets.top + 16,
                            paddingHorizontal: 24,
                            paddingBottom: 8, // Reduced from 24 to avoid huge gap before Day 1
                            backgroundColor: colors.background, // Ensure opaque background
                        }}
                    >
                        {/* Back Button */}
                        <Pressable
                            onPress={() => router.back()}
                            style={({ pressed }) => ({
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 20,
                                alignSelf: 'flex-start',
                                opacity: pressed ? 0.6 : 1,
                            })}
                        >
                            <Text style={{ fontSize: 15, color: colors.ashBrown }}>← Back</Text>
                        </Pressable>

                        {/* Trip Title & Metadata */}
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

                            <Text
                                style={{
                                    fontSize: 14,
                                    color: colors.ashBrown,
                                    marginTop: 8,
                                }}
                            >
                                {itinerary.days.length} days • {itinerary.days.reduce((acc, day) => acc + day.activities.length, 0)} activities
                            </Text>
                        </Animated.View>
                    </View>
                }
                // Empty Section Footer (spacing)
                renderSectionFooter={() => <View style={{ height: 12 }} />}
            />
        </View>
    );
}
