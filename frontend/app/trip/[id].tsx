import { View, Text, Pressable, ActivityIndicator, SectionList, Platform, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn, useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolate } from "react-native-reanimated";
import { useEffect, useState } from "react";
import { colors } from "../../src/constants/colors";
import { useTripViewModel } from "../../src/view-models/use-trip-view-model";
import { ActivityCard } from "../../src/components/activity-card";
import { Day, Activity } from "../../src/services/api-service";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { EditActivitySheet } from "../../src/components/edit-activity-sheet";
import { calendarService } from "../../src/services/calendar-service";
import { CalendarPreviewModal } from "../../src/components/calendar-preview-modal";
import { storageService } from "../../src/services/storage-service";

export default function TripScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { state, actions } = useTripViewModel(id);
    const scrollY = useSharedValue(0);
    const [editingActivity, setEditingActivity] = useState<{ activity: Activity; dayNumber: number } | null>(null);
    const [showCalendarPreview, setShowCalendarPreview] = useState(false);

    // Enrich images once trip is loaded
    useEffect(() => {
        if (state.itinerary && !state.isLoading) {
            actions.enrichImages();
        }
    }, [state.itinerary?.id]);

    // Scroll handler for animations
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

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
                <Animated.View entering={FadeIn.duration(400)}>
                    <ActivityIndicator size="large" color={colors.regalNavy} />
                    <Text style={{ marginTop: 16, color: colors.ashBrown, fontSize: 15, fontWeight: "500" }}>
                        Loading your trip...
                    </Text>
                </Animated.View>
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
                <Animated.Text
                    entering={FadeInDown.springify().damping(15).stiffness(150)}
                    style={{ fontSize: 48, marginBottom: 16 }}
                >
                    😕
                </Animated.Text>
                <Animated.View entering={FadeInDown.duration(400).delay(100)}>
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
                </Animated.View>
                <Animated.View entering={FadeInDown.duration(400).delay(200)}>
                    <Pressable
                        onPress={() => {
                            if (Platform.OS === 'ios') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }
                            router.back();
                        }}
                        style={({ pressed }) => ({
                            backgroundColor: colors.regalNavy,
                            paddingHorizontal: 24,
                            paddingVertical: 14,
                            borderRadius: 12,
                            borderCurve: "continuous",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            transform: [{ scale: pressed ? 0.97 : 1 }],
                        })}
                    >
                        <Text style={{ color: colors.white, fontWeight: "600", fontSize: 15 }}>
                            Go Back
                        </Text>
                    </Pressable>
                </Animated.View>
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
                renderSectionHeader={({ section: { day } }: { section: { day: Day } }) => (
                    <BlurView
                        intensity={Platform.OS === 'ios' ? 90 : 0}
                        tint="light"
                        style={{
                            paddingTop: Platform.OS === 'ios' ? insets.top : 12,
                            paddingBottom: 14,
                            paddingHorizontal: 24,
                            backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.92)' : colors.background,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(0,0,0,0.08)',
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        }}
                    >
                        <Animated.View
                            entering={FadeIn.duration(300)}
                            style={{ flexDirection: "row", alignItems: "center" }}
                        >
                            <View
                                style={{
                                    backgroundColor: colors.regalNavy,
                                    borderRadius: 7,
                                    borderCurve: "continuous",
                                    paddingHorizontal: 9,
                                    paddingVertical: 5,
                                    marginRight: 12,
                                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: "800",
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
                                    fontSize: 17,
                                    fontWeight: "700",
                                    color: colors.carbonBlack,
                                    flex: 1,
                                    letterSpacing: -0.2,
                                }}
                                numberOfLines={1}
                            >
                                {day.theme_title.replace(/^Day \d+:\s*/, "")}
                            </Text>
                        </Animated.View>
                    </BlurView>
                )}
                // List Item (Activity Card)
                renderItem={({ item, index, section }) => (
                    <Animated.View
                        entering={FadeInDown.duration(400).delay(index * 80).springify().damping(20).stiffness(90)}
                        style={{ paddingHorizontal: 24, paddingTop: 16 }}
                    >
                        <ActivityCard
                            activity={item}
                            index={index}
                            onEdit={() => {
                                if (Platform.OS === 'ios') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                                setEditingActivity({ activity: item, dayNumber: section.day.day_number });
                            }}
                            onDelete={() => {
                                if (Platform.OS === 'ios') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }

                                Alert.alert(
                                    "Delete Activity",
                                    `Are you sure you want to delete "${item.name}"?`,
                                    [
                                        {
                                            text: "Cancel",
                                            style: "cancel",
                                        },
                                        {
                                            text: "Delete",
                                            style: "destructive",
                                            onPress: () => {
                                                actions.deleteActivity(section.day.day_number, item.id);
                                            },
                                        },
                                    ]
                                );
                            }}
                            onAddToCalendar={async () => {
                                if (Platform.OS === 'ios') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                                if (state.itinerary?.start_date) {
                                    await calendarService.addActivityToCalendar(
                                        item,
                                        state.itinerary.start_date,
                                        section.day.day_number
                                    );
                                } else {
                                    Alert.alert('Error', 'Trip start date is missing.');
                                }
                            }}
                        />
                    </Animated.View>
                )}
                // Page Header (Trip Info)
                ListHeaderComponent={
                    <View>
                        {/* Header with Back + Export Buttons */}
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingHorizontal: 24,
                                paddingTop: 16 + insets.top,
                                paddingBottom: 16,
                            }}
                        >
                            {/* Back Button */}
                            <Pressable
                                onPress={() => {
                                    if (Platform.OS === 'ios') {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }
                                    router.back();
                                }}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                                }}
                            >
                                <Text style={{ fontSize: 20, color: colors.regalNavy }}>←</Text>
                            </Pressable>

                            {/* Export to Calendar Button */}
                            <Pressable
                                onPress={() => {
                                    if (Platform.OS === 'ios') {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }
                                    setShowCalendarPreview(true);
                                }}
                                style={({ pressed }) => ({
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 20,
                                    backgroundColor: pressed ? colors.regalNavy : "rgba(255, 255, 255, 0.9)",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                })}
                            >
                                <Text style={{ fontSize: 18 }}>📅</Text>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: "600",
                                        color: colors.regalNavy,
                                    }}
                                >
                                    Export
                                </Text>
                            </Pressable>
                        </View>

                        {/* Trip Title & Metadata */}
                        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                            <View
                                style={{
                                    paddingHorizontal: 24,
                                    paddingBottom: 8,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginBottom: 10,
                                        gap: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            backgroundColor: colors.primaryLight,
                                            borderRadius: 8,
                                            borderCurve: "continuous",
                                            paddingHorizontal: 12,
                                            paddingVertical: 5,
                                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontWeight: "800",
                                                color: colors.regalNavy,
                                                textTransform: "uppercase",
                                                letterSpacing: 0.5,
                                            }}
                                        >
                                            📍 {itinerary.destination}
                                        </Text>
                                    </View>
                                    {formatDateRange() && (
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                color: colors.ashBrown,
                                                fontWeight: "500",
                                            }}
                                        >
                                            {formatDateRange()}
                                        </Text>
                                    )}
                                </View>

                                <Text
                                    style={{
                                        fontSize: 32,
                                        fontWeight: "800",
                                        color: colors.carbonBlack,
                                        lineHeight: 40,
                                        letterSpacing: -0.5,
                                        marginBottom: 4,
                                    }}
                                >
                                    {itinerary.trip_title}
                                </Text>

                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: colors.ashBrown,
                                            fontWeight: "500",
                                        }}
                                    >
                                        {itinerary.days.length} days
                                    </Text>
                                    <Text style={{ fontSize: 14, color: colors.ashBrown }}>•</Text>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: colors.ashBrown,
                                            fontWeight: "500",
                                        }}
                                    >
                                        {itinerary.days.reduce((acc, day) => acc + day.activities.length, 0)} activities
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                    </View>
                }
                // Empty Section Footer (spacing)
                renderSectionFooter={() => <View style={{ height: 12 }} />}
            />

            {/* Edit Activity Modal */}
            <Modal
                visible={editingActivity !== null}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setEditingActivity(null)}
            >
                {editingActivity && (
                    <EditActivitySheet
                        activity={editingActivity.activity}
                        onSave={(updates) => {
                            actions.updateActivity(
                                editingActivity.dayNumber,
                                editingActivity.activity.id,
                                updates
                            );
                            setEditingActivity(null);
                        }}
                        onCancel={() => setEditingActivity(null)}
                    />
                )}
            </Modal>

            {/* Calendar Preview Modal */}
            <CalendarPreviewModal
                visible={showCalendarPreview}
                itinerary={state.itinerary}
                onConfirm={async () => {
                    setShowCalendarPreview(false);
                    if (state.itinerary) {
                        const eventIds = await calendarService.exportAllActivities(state.itinerary);
                        if (eventIds.length > 0) {
                            await storageService.saveCalendarEvents(state.itinerary.id, eventIds);
                        }
                    }
                }}
                onCancel={() => setShowCalendarPreview(false)}
            />
        </View >
    );
}
