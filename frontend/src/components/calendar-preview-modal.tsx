import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { colors } from '../constants/colors';
import { Itinerary, Activity } from '../services/api-service';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface CalendarPreviewModalProps {
    visible: boolean;
    itinerary: Itinerary | null;
    onConfirm: () => void;
    onCancel: () => void;
}

function formatEventDate(tripStartDate: string, dayNumber: number, startTime: string): string {
    const baseDate = new Date(tripStartDate);
    const activityDate = new Date(baseDate);
    activityDate.setDate(baseDate.getDate() + (dayNumber - 1));

    const [hours, minutes] = startTime.split(':').map(Number);
    activityDate.setHours(hours, minutes, 0, 0);

    // Format: "Mon, Mar 15 at 9:00 AM"
    const dateStr = activityDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
    const timeStr = activityDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return `${dateStr} at ${timeStr}`;
}

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function CalendarPreviewModal({ visible, itinerary, onConfirm, onCancel }: CalendarPreviewModalProps) {
    if (!itinerary) return null;

    const totalActivities = itinerary.days.reduce((acc, day) => acc + day.activities.length, 0);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onCancel}
        >
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                {/* Header */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                    }}
                >
                    <Pressable onPress={onCancel}>
                        <Text style={{ fontSize: 17, color: colors.primary }}>Cancel</Text>
                    </Pressable>
                    <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
                        Export to Calendar
                    </Text>
                    <Pressable
                        onPress={() => {
                            if (Platform.OS === 'ios') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }
                            onConfirm();
                        }}
                    >
                        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.primary }}>
                            Export
                        </Text>
                    </Pressable>
                </View>

                {/* Summary */}
                <View
                    style={{
                        padding: 20,
                        backgroundColor: colors.primaryLight,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                    }}
                >
                    <Text style={{ fontSize: 15, color: colors.text, marginBottom: 4 }}>
                        📅 {totalActivities} events will be added to your calendar
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                        Each event includes location, description, and a 1-hour reminder
                    </Text>
                </View>

                {/* Event List */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
                    {itinerary.days.map((day) => (
                        <View key={day.day_number}>
                            {/* Day Header */}
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: '700',
                                    color: colors.textSecondary,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    marginBottom: 8,
                                    marginTop: day.day_number > 1 ? 12 : 0,
                                }}
                            >
                                Day {day.day_number}
                            </Text>

                            {/* Activities */}
                            {day.activities.map((activity) => (
                                <View
                                    key={activity.id}
                                    style={{
                                        backgroundColor: colors.white,
                                        borderRadius: 12,
                                        borderCurve: 'continuous',
                                        padding: 16,
                                        marginBottom: 8,
                                        borderWidth: 1,
                                        borderColor: colors.borderLight,
                                    }}
                                >
                                    {/* Activity Name */}
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontWeight: '600',
                                            color: colors.text,
                                            marginBottom: 6,
                                        }}
                                    >
                                        {activity.name}
                                    </Text>

                                    {/* Date/Time */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                                            🕐 {formatEventDate(itinerary.start_date!, day.day_number, activity.start_time)}
                                        </Text>
                                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>•</Text>
                                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                                            {formatDuration(activity.duration_minutes)}
                                        </Text>
                                    </View>

                                    {/* Location */}
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: colors.textSecondary,
                                        }}
                                    >
                                        📍 {activity.location_name}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
}
