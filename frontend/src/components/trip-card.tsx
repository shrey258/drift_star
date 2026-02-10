import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../constants/colors';
import { Itinerary } from '../services/api-service';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

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

    // Calculate total activities count
    const totalActivities = trip.days.reduce((acc, day) => acc + day.activities.length, 0);

    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            style={{ width: '100%', marginBottom: 16 }}
        >
            <Pressable
                onPress={() => {
                    if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    router.push(`/trip/${trip.id}`);
                }}
                style={({ pressed }) => ({
                    backgroundColor: colors.white,
                    borderRadius: 24,
                    borderCurve: 'continuous',
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 5,
                })}
            >
                {/* Image Section */}
                <View style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: colors.paleOak,
                            }}
                            contentFit="cover"
                            transition={400}
                        />
                    ) : (
                        <View
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: colors.primaryLight,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 60 }}>✈️</Text>
                        </View>
                    )}

                    {/* Gradient Overlay for Top - only show if there's an image */}
                    {imageUrl && (
                        <LinearGradient
                            colors={['rgba(0,0,0,0.3)', 'transparent']}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 80,
                            }}
                        />
                    )}

                    {/* Info Overlay at Bottom */}
                    {imageUrl ? (
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 120,
                                justifyContent: 'flex-end',
                                padding: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: '700',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1.5,
                                    marginBottom: 4,
                                }}
                            >
                                {trip.destination}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: '700',
                                    color: colors.white,
                                    letterSpacing: -0.5,
                                }}
                                numberOfLines={1}
                            >
                                {trip.trip_title}
                            </Text>
                        </LinearGradient>
                    ) : (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: 20,
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderTopWidth: 1,
                                borderTopColor: colors.borderLight,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: '700',
                                    color: colors.regalNavy,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1.2,
                                    marginBottom: 2,
                                }}
                            >
                                {trip.destination}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontWeight: '700',
                                    color: colors.carbonBlack,
                                    letterSpacing: -0.3,
                                }}
                                numberOfLines={1}
                            >
                                {trip.trip_title}
                            </Text>
                        </View>
                    )}

                    {/* Days & Activity Badge (Top Right) */}
                    <View
                        style={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            borderCurve: 'continuous',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.regalNavy }}>
                            {trip.days.length} Days
                        </Text>
                        <View style={{ width: 1, height: 12, backgroundColor: 'rgba(0,0,0,0.1)' }} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.regalNavy }}>
                            {totalActivities} Activities
                        </Text>
                    </View>

                    {/* Date Badge (Top Left) */}
                    {trip.start_date && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 16,
                                left: 16,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 10,
                                borderCurve: 'continuous',
                            }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.white }}>
                                {formatDateRange(trip.start_date, trip.days.length)}
                            </Text>
                        </View>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
}
