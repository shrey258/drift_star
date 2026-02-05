import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "../src/constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Suggested destinations for quick selection
const SUGGESTIONS = [
  { emoji: "🗼", name: "Tokyo" },
  { emoji: "🗽", name: "New York" },
  { emoji: "🏔️", name: "Iceland" },
  { emoji: "🌊", name: "Bali" },
  { emoji: "🏛️", name: "Rome" },
  { emoji: "🌸", name: "Kyoto" },
];

export default function HomeScreen() {
  const [destination, setDestination] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const buttonScale = useSharedValue(1);

  const handleInputFocus = () => {
    setIsFocused(true);
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  const handleSuggestionPress = (name: string) => {
    setDestination(name);
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Keyboard.dismiss();
  };

  const handleExplorePress = () => {
    if (!destination.trim()) return;

    buttonScale.value = withSpring(0.96, { damping: 15 }, () => {
      buttonScale.value = withSpring(1, { damping: 15 });
    });

    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // TODO: Navigate to itinerary generation
    console.log("Exploring:", destination);
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      isFocused ? colors.regalNavy : colors.borderLight,
      { duration: 200 }
    ),
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: interpolate(destination.length, [0, 1], [0.6, 1]),
  }));

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 48,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 24,
      }}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Hero Section */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={{ marginBottom: 40 }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.burntPeach,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Drift Star
        </Text>
        <Text
          style={{
            fontSize: 38,
            fontWeight: "700",
            color: colors.carbonBlack,
            lineHeight: 46,
            letterSpacing: -0.5,
          }}
        >
          Where are you{"\n"}off to?
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.ashBrown,
            lineHeight: 24,
            marginTop: 12,
          }}
        >
          Let AI craft your perfect itinerary
        </Text>
      </Animated.View>

      {/* Input Section */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={{ marginBottom: 32 }}
      >
        <Animated.View
          style={[
            {
              backgroundColor: colors.white,
              borderRadius: 14,
              borderWidth: 1.5,
              borderCurve: "continuous",
              boxShadow: "0 2px 8px rgba(27, 27, 27, 0.06)",
            },
            inputAnimatedStyle,
          ]}
        >
          <TextInput
            ref={inputRef}
            value={destination}
            onChangeText={setDestination}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Enter a destination..."
            placeholderTextColor={colors.paleOak}
            style={{
              fontSize: 17,
              color: colors.carbonBlack,
              paddingHorizontal: 18,
              paddingVertical: 18,
            }}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleExplorePress}
          />
        </Animated.View>
      </Animated.View>

      {/* Quick Suggestions */}
      <Animated.View entering={FadeInDown.duration(500).delay(300)}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.ashBrown,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Popular Destinations
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {SUGGESTIONS.map((item, index) => {
            const isSelected = destination === item.name;
            return (
              <Animated.View
                key={item.name}
                entering={FadeIn.duration(350).delay(350 + index * 40)}
              >
                <Pressable
                  onPress={() => handleSuggestionPress(item.name)}
                  style={({ pressed }) => ({
                    backgroundColor: isSelected
                      ? colors.primaryLight
                      : colors.white,
                    borderRadius: 10,
                    borderCurve: "continuous",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? colors.regalNavy
                      : colors.borderLight,
                    opacity: pressed ? 0.7 : 1,
                    boxShadow: isSelected
                      ? "none"
                      : "0 1px 3px rgba(27, 27, 27, 0.04)",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: isSelected ? colors.regalNavy : colors.carbonBlack,
                    }}
                  >
                    {item.emoji} {item.name}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* Explore Button */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(450)}
        style={{ marginTop: "auto", paddingTop: 48 }}
      >
        <AnimatedPressable
          onPress={handleExplorePress}
          disabled={!destination.trim()}
          style={[
            {
              backgroundColor: colors.regalNavy,
              borderRadius: 14,
              borderCurve: "continuous",
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              boxShadow: destination.trim()
                ? "0 4px 16px rgba(16, 57, 132, 0.35)"
                : "none",
            },
            buttonAnimatedStyle,
          ]}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.white,
              letterSpacing: 0.3,
            }}
          >
            Start Exploring
          </Text>
        </AnimatedPressable>
      </Animated.View>
    </ScrollView>
  );
}
