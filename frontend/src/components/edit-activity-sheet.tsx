import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity } from '../services/api-service';
import { colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

interface EditActivitySheetProps {
    activity: Activity;
    onSave: (updates: Partial<Activity>) => void;
    onCancel: () => void;
}

export function EditActivitySheet({ activity, onSave, onCancel }: EditActivitySheetProps) {
    const [name, setName] = useState(activity.name);
    const [description, setDescription] = useState(activity.description);
    const [location, setLocation] = useState(activity.location_name);
    const [startTime, setStartTime] = useState(activity.start_time);
    const [duration, setDuration] = useState(activity.duration_minutes.toString());

    const handleSave = () => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const updates: Partial<Activity> = {};

        if (name !== activity.name) updates.name = name;
        if (description !== activity.description) updates.description = description;
        if (location !== activity.location_name) updates.location_name = location;
        if (startTime !== activity.start_time) updates.start_time = startTime;

        const durationNum = parseInt(duration, 10);
        if (!isNaN(durationNum) && durationNum !== activity.duration_minutes) {
            updates.duration_minutes = durationNum;
        }

        onSave(updates);
    };

    const handleCancel = () => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onCancel();
    };

    const isValid = name.trim().length > 0 &&
        description.trim().length > 0 &&
        location.trim().length > 0 &&
        /^\d{2}:\d{2}$/.test(startTime) &&
        !isNaN(parseInt(duration, 10));

    return (
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
                    backgroundColor: colors.white,
                    zIndex: 10,
                }}
            >
                <Pressable onPress={handleCancel}>
                    <Text style={{ fontSize: 17, color: colors.primary }}>Cancel</Text>
                </Pressable>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
                    Edit Activity
                </Text>
                <Pressable onPress={handleSave} disabled={!isValid}>
                    <Text
                        style={{
                            fontSize: 17,
                            fontWeight: '600',
                            color: isValid ? colors.primary : colors.textSecondary,
                        }}
                    >
                        Save
                    </Text>
                </Pressable>
            </View>

            {/* Form */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardDismissMode="interactive"
            >
                {/* Image Preview */}
                {activity.image_url ? (
                    <View style={{ height: 240, width: '100%', position: 'relative', overflow: 'hidden' }}>
                        <Image
                            source={{ uri: activity.image_url }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            transition={400}
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)']}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 100,
                                justifyContent: 'flex-end',
                                padding: 20,
                            }}
                        />
                    </View>
                ) : (
                    <View style={{
                        height: 120,
                        width: '100%',
                        backgroundColor: colors.primaryLight,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                    }}>
                        <Text style={{ fontSize: 32 }}>🖼️</Text>
                        <Text style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: colors.textSecondary,
                            marginTop: 8
                        }}>
                            No image available
                        </Text>
                    </View>
                )}

                <View style={{ padding: 20, gap: 24 }}>
                    {/* Activity Name */}
                    <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                            ACTIVITY NAME
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter activity name"
                            placeholderTextColor={colors.textSecondary}
                            style={{
                                fontSize: 17,
                                color: colors.text,
                                backgroundColor: colors.white,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                            }}
                        />
                    </View>

                    {/* Description */}
                    <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                            DESCRIPTION
                        </Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Enter description"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={{
                                fontSize: 15,
                                color: colors.text,
                                backgroundColor: colors.white,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                                minHeight: 120,
                            }}
                        />
                    </View>

                    {/* Location */}
                    <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                            LOCATION
                        </Text>
                        <TextInput
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Enter location"
                            placeholderTextColor={colors.textSecondary}
                            style={{
                                fontSize: 17,
                                color: colors.text,
                                backgroundColor: colors.white,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                            }}
                        />
                    </View>

                    {/* Time & Duration Row */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {/* Start Time */}
                        <View style={{ flex: 1, gap: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                                START TIME
                            </Text>
                            <TextInput
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="HH:MM"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numbers-and-punctuation"
                                style={{
                                    fontSize: 17,
                                    color: colors.text,
                                    backgroundColor: colors.white,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: colors.borderLight,
                                }}
                            />
                        </View>

                        {/* Duration */}
                        <View style={{ flex: 1, gap: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                                DURATION (MIN)
                            </Text>
                            <TextInput
                                value={duration}
                                onChangeText={setDuration}
                                placeholder="60"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="number-pad"
                                style={{
                                    fontSize: 17,
                                    color: colors.text,
                                    backgroundColor: colors.white,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: colors.borderLight,
                                }}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
