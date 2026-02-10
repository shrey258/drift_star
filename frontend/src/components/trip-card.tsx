import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../constants/colors';
import { Itinerary } from '../services/api-service';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface TripCardProps {
    trip: Itinerary;
    index: number;
}

function formatDateRange(startDate?: string, days?: number): string {
    if (!startDate || !days) return '';

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days - 1);

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${startStr} - ${endStr}`;
}

export function TripCard({ trip, index }: TripCardProps) {
    const router = useRouter();

    // Get first activity image or use placeholder
    const imageUrl = trip.days[0]?.activities[0]?.image_url;

    return (
        <Animated.View entering={FadeIn.duration(300).delay(index * 80)}>
            <Pressable
                onPress={() => {
                    if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    router.push(`/trip/${trip.id}`);
                }}
                style={({ pressed }) => ({
                    width: 160,
                    height: 200,
                    borderRadius: 16,
                    borderCurve: 'continuous',
                    overflow: 'hidden',
                    marginRight: 12,
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    boxShadow: pressed
                        ? '0 4px 12px rgba(0, 0, 0, 0.08)'
                        : '0 2px 8px rgba(0, 0, 0, 0.06)',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
            >
                {/* Image Background */}
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={{
                            width: '100%',
                            height: 120,
                            backgroundColor: colors.paleOak,
                        }}
                        contentFit="cover"
                    />
                ) : (
                    <View
                        style={{
                            width: '100%',
                            height: 120,
                            backgroundColor: colors.primaryLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 40 }}>✈️</Text>
                    </View>
                )}

                {/* Gradient Overlay on Image */}
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 120,
                        backgroundColor: 'transparent',
                    }}
                />

                {/* Destination Badge */}
                <View
                    style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        borderCurve: 'continuous',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: colors.regalNavy,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}
                    >
                        {trip.destination}
                    </Text>
                </View>

                {/* Trip Info */}
                <View style={{ padding: 12, gap: 4 }}>
                    <Text
                        style={{
                            fontSize: 15,
                            fontWeight: '600',
                            color: colors.text,
                            lineHeight: 20,
                        }}
                        numberOfLines={2}
                    >
                        {trip.trip_title}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            {trip.days.length} days
                        </Text>
                        {trip.start_date && (
                            <>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>•</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                                    {formatDateRange(trip.start_date, trip.days.length)}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}
