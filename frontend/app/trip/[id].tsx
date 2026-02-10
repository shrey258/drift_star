import { View, Text, Pressable, ActivityIndicator, SectionList, Platform, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
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
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

export default function TripScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { state, actions } = useTripViewModel(id);
    const [editingActivity, setEditingActivity] = useState<{ activity: Activity; dayNumber: number } | null>(null);
    const [showCalendarPreview, setShowCalendarPreview] = useState(false);

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
        return `${start.toLocaleDateString("en-US", options)} – ${end.toLocaleDateString("en-US", options)}`;
    };

    const heroImageUrl = itinerary.hero_image_url || itinerary.days[0]?.activities[0]?.image_url;
    const totalActivities = itinerary.days.reduce((acc, day) => acc + day.activities.length, 0);

    // Prepare Sections for SectionList
    const sections = itinerary.days.map((day) => ({
        day: day,
        data: day.activities,
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

                // ─── Hero Header ───────────────────────────────────────
                ListHeaderComponent={
                    <View>
                        {/* Hero Image */}
                        {heroImageUrl && (
                            <View style={{ height: 280, overflow: 'hidden' }}>
                                <Image
                                    source={{ uri: heroImageUrl }}
                                    style={{ width: '100%', height: '100%', backgroundColor: colors.paleOak }}
                                    contentFit="cover"
                                    transition={500}
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(255,255,255,0.6)', colors.background]}
                                    locations={[0.3, 0.7, 1]}
                                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
                                />
                                {/* Back button overlaid on hero image */}
                                <View style={{ position: 'absolute', top: insets.top + 8, left: 16 }}>
                                    <Pressable
                                        onPress={() => {
                                            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.back();
                                        }}
                                        style={({ pressed }) => ({
                                            width: 40,
                                            height: 40,
                                            borderRadius: 20,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            opacity: pressed ? 0.7 : 1,
                                        })}
                                    >
                                        <BlurView
                                            intensity={Platform.OS === 'ios' ? 60 : 0}
                                            tint="light"
                                            style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                borderRadius: 20,
                                                overflow: 'hidden',
                                                backgroundColor: Platform.OS !== 'ios' ? 'rgba(255,255,255,0.9)' : undefined,
                                            }}
                                        />
                                        <Text style={{ fontSize: 20, color: colors.carbonBlack }}>←</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}

                        {/* No-image fallback header */}
                        {!heroImageUrl && (
                            <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 24, paddingBottom: 16 }}>
                                <Pressable
                                    onPress={() => {
                                        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.back();
                                    }}
                                    style={({ pressed }) => ({
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: colors.primaryLight,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        opacity: pressed ? 0.7 : 1,
                                    })}
                                >
                                    <Text style={{ fontSize: 20, color: colors.regalNavy }}>←</Text>
                                </Pressable>
                            </View>
                        )}

                        {/* Trip Info */}
                        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                            <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
                                {/* Metadata badges */}
                                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                    <View
                                        style={{
                                            backgroundColor: colors.primaryLight,
                                            borderRadius: 8,
                                            borderCurve: "continuous",
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontWeight: "700",
                                                color: colors.regalNavy,
                                                letterSpacing: 0.3,
                                            }}
                                        >
                                            📍 {itinerary.destination}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: 'rgba(213, 122, 92, 0.12)',
                                            borderRadius: 8,
                                            borderCurve: "continuous",
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontWeight: "700",
                                                color: colors.burntPeach,
                                                letterSpacing: 0.3,
                                            }}
                                        >
                                            {itinerary.days.length} {itinerary.days.length === 1 ? 'day' : 'days'} · {totalActivities} activities
                                        </Text>
                                    </View>
                                    {formatDateRange() && (
                                        <View
                                            style={{
                                                backgroundColor: 'rgba(108, 134, 187, 0.12)',
                                                borderRadius: 8,
                                                borderCurve: "continuous",
                                                paddingHorizontal: 10,
                                                paddingVertical: 4,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: "700",
                                                    color: colors.glaucous,
                                                    letterSpacing: 0.3,
                                                }}
                                            >
                                                🗓 {formatDateRange()}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Title */}
                                <Text
                                    style={{
                                        fontSize: 30,
                                        fontWeight: "800",
                                        color: colors.carbonBlack,
                                        lineHeight: 36,
                                        letterSpacing: -0.5,
                                        marginBottom: 16,
                                    }}
                                    numberOfLines={3}
                                >
                                    {itinerary.trip_title}
                                </Text>

                                {/* Export CTA */}
                                <Pressable
                                    onPress={() => {
                                        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        setShowCalendarPreview(true);
                                    }}
                                    style={({ pressed }) => ({
                                        alignSelf: 'flex-start',
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 6,
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 10,
                                        borderCurve: "continuous",
                                        borderWidth: 1,
                                        borderColor: colors.borderLight,
                                        backgroundColor: pressed ? colors.primaryLight : colors.white,
                                        boxShadow: colors.softShadow,
                                        transform: [{ scale: pressed ? 0.97 : 1 }],
                                    })}
                                >
                                    <Text style={{ fontSize: 15 }}>📅</Text>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontWeight: "600",
                                            color: colors.regalNavy,
                                        }}
                                    >
                                        Export to Calendar
                                    </Text>
                                </Pressable>
                            </View>
                        </Animated.View>
                    </View>
                }

                // ─── Day Section Header (Sticky) ──────────────────────
                renderSectionHeader={({ section: { day } }: { section: { day: Day } }) => (
                    <BlurView
                        intensity={Platform.OS === 'ios' ? 90 : 0}
                        tint="light"
                        style={{
                            paddingTop: Platform.OS === 'ios' ? insets.top + 4 : 14,
                            paddingBottom: 12,
                            paddingHorizontal: 24,
                            backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.92)' : colors.background,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(0,0,0,0.06)',
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View
                                style={{
                                    backgroundColor: colors.regalNavy,
                                    borderRadius: 7,
                                    borderCurve: "continuous",
                                    paddingHorizontal: 9,
                                    paddingVertical: 4,
                                    marginRight: 10,
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
                                    fontSize: 16,
                                    fontWeight: "700",
                                    color: colors.carbonBlack,
                                    flex: 1,
                                    letterSpacing: -0.2,
                                }}
                                numberOfLines={1}
                            >
                                {day.theme_title.replace(/^Day \d+:\s*/, "")}
                            </Text>
                        </View>
                    </BlurView>
                )}

                // ─── Activity Card ─────────────────────────────────────
                renderItem={({ item, index, section }) => (
                    <Animated.View
                        entering={FadeInDown.duration(400).delay(index * 80).springify().damping(20).stiffness(90)}
                        style={{ paddingHorizontal: 20, paddingTop: 14 }}
                    >
                        <ActivityCard
                            activity={item}
                            index={index}
                            onEdit={() => {
                                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setEditingActivity({ activity: item, dayNumber: section.day.day_number });
                            }}
                            onDelete={() => {
                                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                Alert.alert(
                                    "Delete Activity",
                                    `Are you sure you want to delete "${item.name}"?`,
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Delete",
                                            style: "destructive",
                                            onPress: () => actions.deleteActivity(section.day.day_number, item.id),
                                        },
                                    ]
                                );
                            }}
                            onAddToCalendar={async () => {
                                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

                // ─── Section Footer (spacing) ─────────────────────────
                renderSectionFooter={() => <View style={{ height: 8 }} />}

                // ─── List Footer ───────────────────────────────────────
                ListFooterComponent={
                    <Animated.View
                        entering={FadeIn.duration(400).delay(300)}
                        style={{
                            alignItems: 'center',
                            paddingTop: 32,
                            paddingBottom: 16,
                            paddingHorizontal: 24,
                        }}
                    >
                        <View
                            style={{
                                width: 40,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: colors.borderLight,
                                marginBottom: 16,
                            }}
                        />
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: colors.paleOak,
                                textAlign: 'center',
                            }}
                        >
                            {totalActivities} activities across {itinerary.days.length} days
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                color: colors.paleOak,
                                textAlign: 'center',
                                marginTop: 4,
                            }}
                        >
                            Long press any activity for more options
                        </Text>
                    </Animated.View>
                }
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
        </View>
    );
}
