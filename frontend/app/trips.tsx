import { View, Text, Pressable, ScrollView, ActivityIndicator, Platform, Alert } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../src/constants/colors';
import { storageService } from '../src/services/storage-service';
import { calendarService } from '../src/services/calendar-service';
import { Itinerary } from '../src/services/api-service';
import { TripCard } from '../src/components/trip-card';
import * as Haptics from 'expo-haptics';

export default function TripsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [trips, setTrips] = useState<Itinerary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        setIsLoading(true);
        const savedTrips = await storageService.getAllTrips();
        setTrips(savedTrips);
        setIsLoading(false);
    };

    const handleDeleteTrip = async (tripId: string, tripTitle: string) => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        Alert.alert(
            'Delete Trip',
            `Are you sure you want to delete "${tripTitle}"? This will also remove any exported events from your calendar.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. Get and delete calendar events
                            const eventIds = await storageService.getCalendarEvents(tripId);
                            if (eventIds.length > 0) {
                                await calendarService.deleteEvents(eventIds);
                            }

                            // 2. Delete trip from storage
                            await storageService.deleteItinerary(tripId);

                            // 3. Reload list
                            await loadTrips();

                            if (Platform.OS === 'ios') {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                        } catch (error) {
                            console.error('[Trips] Failed to delete trip:', error);
                            Alert.alert('Error', 'Failed to delete trip.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <BlurView
                intensity={Platform.OS === 'ios' ? 90 : 0}
                tint="light"
                style={{
                    paddingTop: insets.top + 8,
                    paddingBottom: 16,
                    paddingHorizontal: 24,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderSubtle,
                    backgroundColor: Platform.OS === 'ios' ? colors.glassBackground : colors.white,
                    zIndex: 10,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Pressable
                        onPress={() => {
                            if (Platform.OS === 'ios') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            router.back();
                        }}
                        style={({ pressed }) => ({
                            backgroundColor: colors.white,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: colors.borderLight,
                            opacity: pressed ? 0.7 : 1,
                            boxShadow: pressed ? "none" : colors.buttonShadow,
                        })}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.coral }}>← Home</Text>
                    </Pressable>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.carbonBlack, letterSpacing: -0.5 }}>
                        My Trips
                    </Text>
                    <View style={{ width: 60 }} />
                </View>
            </BlurView>

            {/* Content */}
            <ScrollView
                contentContainerStyle={{
                    padding: 24,
                    gap: 16,
                }}
            >
                {isLoading ? (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : trips.length === 0 ? (
                    // Empty State
                    <Animated.View
                        entering={FadeInDown.duration(400)}
                        style={{
                            paddingVertical: 60,
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <Text style={{ fontSize: 60 }}>✈️</Text>
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: '600',
                                color: colors.text,
                                textAlign: 'center',
                            }}
                        >
                            No trips yet
                        </Text>
                        <Text
                            style={{
                                fontSize: 15,
                                color: colors.textSecondary,
                                textAlign: 'center',
                                maxWidth: 280,
                            }}
                        >
                            Generate your first adventure to see it here
                        </Text>
                    </Animated.View>
                ) : (
                    // Trip Grid
                    <View
                        style={{
                            gap: 20,
                        }}
                    >
                        {trips.map((trip, index) => (
                            <TripCard
                                key={trip.id}
                                trip={trip}
                                index={index}
                                onLongPress={() => handleDeleteTrip(trip.id, trip.trip_title)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
