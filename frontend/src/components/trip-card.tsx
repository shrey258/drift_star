import { View, Text, Pressable , Platform } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../constants/colors';
import { Itinerary } from '../services/api-service';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from "expo-blur";

interface TripCardProps {
    trip: Itinerary;
    index: number;
    onLongPress?: () => void;
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

export function TripCard({ trip, index, onLongPress }: TripCardProps) {
    const router = useRouter();

    const handlePress = () => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        router.push(`/trip/${trip.id}`);
    };

    // Use hero image as priority, fallback to first activity image
    const imageUrl = trip.hero_image_url || trip.days[0]?.activities[0]?.image_url;

    // Calculate total activities count
    const totalActivities = trip.days.reduce((acc, day) => acc + day.activities.length, 0);

    return (
        <Animated.View
            entering={FadeIn.duration(400).delay(index * 100)}
            style={{
                width: '100%',
                aspectRatio: 3 / 2,
                borderRadius: 24,
                backgroundColor: colors.white,
                overflow: 'hidden',
                boxShadow: colors.softShadow,

            }}
        >
            <Pressable
                onPress={handlePress}
                onLongPress={onLongPress}
                style={({ pressed }) => ({
                    flex: 1,
                    opacity: pressed ? 0.95 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
            >
                {/* Image Section */}
                <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    {imageUrl ? (
                        <>
                            <Image
                                source={{ uri: imageUrl }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: colors.paleOak,
                                }}
                                contentFit="cover"
                                transition={400}
                                onError={() => {
                                    console.log('[TripCard] Image failed to load, cleaning up...');
                                }}
                            />
                            {/* Top Contrast Vignette */}
                            <LinearGradient
                                colors={['rgba(0,0,0,0.4)', 'transparent']}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 100,
                                }}
                            />
                            {/* Bottom Info Gradient */}
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.85)']}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 160,
                                    justifyContent: 'flex-end',
                                    paddingHorizontal: 20,
                                    paddingBottom: 20,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: '800',
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        textTransform: 'uppercase',
                                        letterSpacing: 2,
                                        marginBottom: 4,
                                    }}
                                >
                                    {trip.destination}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 26,
                                        fontWeight: '800',
                                        color: colors.white,
                                        letterSpacing: -0.5,
                                        lineHeight: 32,
                                    }}
                                    numberOfLines={2}
                                >
                                    {trip.trip_title}
                                </Text>
                            </LinearGradient>
                        </>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <LinearGradient
                                colors={[colors.primaryLight, colors.paleOak]}
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: 24,
                                }}
                            >
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 16,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                }}>
                                    <Text style={{ fontSize: 40 }}>🌏</Text>
                                </View>
                                <Text
                                    style={{
                                        fontSize: 24,
                                        fontWeight: '800',
                                        color: colors.coral,
                                        textAlign: 'center',
                                        marginBottom: 4,
                                    }}
                                >
                                    {trip.destination}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: '600',
                                        color: colors.ashBrown,
                                        textAlign: 'center',
                                    }}
                                >
                                    {trip.trip_title}
                                </Text>
                            </LinearGradient>
                        </View>
                    )}

                    {/* Top Badges Row */}
                    <View
                        style={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            right: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        {/* Date Badge (Left) */}
                        {trip.start_date ? (
                            <BlurView
                                intensity={Platform.OS === 'ios' ? 40 : 100}
                                tint={imageUrl ? "dark" : "light"}
                                style={{
                                    backgroundColor: imageUrl ? colors.darkOverlay : colors.glassOverlay,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 10,
                                    borderCurve: 'continuous',
                                    overflow: 'hidden',
                                }}
                            >
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: '800',
                                    color: imageUrl ? colors.white : colors.coral,
                                    letterSpacing: 0.5,
                                }}>
                                    {formatDateRange(trip.start_date, trip.days.length)}
                                </Text>
                            </BlurView>
                        ) : <View />}

                        {/* Days + Delete (Right) */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <BlurView
                                intensity={Platform.OS === 'ios' ? 40 : 100}
                                tint="light"
                                style={{
                                    backgroundColor: colors.glassOverlay,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 10,
                                    borderCurve: 'continuous',
                                    overflow: 'hidden',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.coral }}>
                                    {trip.days.length}d
                                </Text>
                                <View style={{ width: 1, height: 12, backgroundColor: 'rgba(0,0,0,0.1)' }} />
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.coral }}>
                                    {totalActivities} acts
                                </Text>
                            </BlurView>

                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onLongPress?.();
                                }}
                                style={({ pressed }) => ({
                                    width: 34,
                                    height: 34,
                                    borderRadius: 17,
                                    backgroundColor: pressed ? 'rgba(255, 59, 48, 1)' : 'rgba(255, 255, 255, 0.95)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    boxShadow: colors.elevatedShadow,
                                })}
                            >
                                <Text style={{ fontSize: 14 }}>{Platform.OS === 'ios' ? '🗑️' : '❌'}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}
