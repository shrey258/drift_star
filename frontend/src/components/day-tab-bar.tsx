import React, { useRef, useEffect } from "react";
import { ScrollView, Pressable, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
} from "react-native-reanimated";
import { colors } from "../constants/colors";

interface Day {
    day_number: number;
    theme_title: string;
}

interface DayTabBarProps {
    days: Day[];
    selectedDay: number;
    onSelectDay: (dayNumber: number) => void;
}

const SPRING_CONFIG = {
    damping: 18,
    stiffness: 150,
    mass: 0.8,
};

export function DayTabBar({ days, selectedDay, onSelectDay }: DayTabBarProps) {
    const scrollRef = useRef<ScrollView>(null);
    const indicatorLeft = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);

    // Store tab positions for indicator animation
    const tabPositions = useRef<{ [key: number]: { x: number; width: number } }>({});

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: withSpring(indicatorLeft.value, SPRING_CONFIG) }],
        width: withSpring(indicatorWidth.value, SPRING_CONFIG),
    }));

    const handleTabLayout = (dayNumber: number, x: number, width: number) => {
        tabPositions.current[dayNumber] = { x, width };
        if (dayNumber === selectedDay) {
            indicatorLeft.value = x;
            indicatorWidth.value = width;
        }
    };

    useEffect(() => {
        const pos = tabPositions.current[selectedDay];
        if (pos) {
            indicatorLeft.value = pos.x;
            indicatorWidth.value = pos.width;
        }
    }, [selectedDay]);

    return (
        <View style={{ marginBottom: 20 }}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    gap: 8,
                }}
            >
                {days.map((day) => {
                    const isSelected = day.day_number === selectedDay;

                    return (
                        <Pressable
                            key={day.day_number}
                            onPress={() => onSelectDay(day.day_number)}
                            onLayout={(e) => {
                                const { x, width } = e.nativeEvent.layout;
                                handleTabLayout(day.day_number, x - 24, width); // Adjust for padding
                            }}
                            style={({ pressed }) => ({
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                borderCurve: "continuous",
                                backgroundColor: isSelected ? colors.regalNavy : "transparent",
                                opacity: pressed ? 0.8 : 1,
                            })}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: "700",
                                    color: isSelected ? colors.white : colors.ashBrown,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                }}
                            >
                                Day {day.day_number}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: "500",
                                    color: isSelected ? colors.white : colors.paleOak,
                                    marginTop: 2,
                                }}
                                numberOfLines={1}
                            >
                                {day.theme_title}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}
