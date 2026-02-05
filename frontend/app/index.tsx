import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { colors } from "../src/constants/colors";
import { Image } from "expo-image";
import { useHomeViewModel } from "../src/view-models/use-home-view-model";
import { SUGGESTIONS } from "../src/constants/suggestions";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state, refs, animations, actions } = useHomeViewModel();

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      state.isFocused ? colors.regalNavy : colors.borderLight,
      { duration: 200 }
    ),
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animations.buttonScale.value }],
    opacity: interpolate(state.destination.length, [0, 1], [0.6, 1]),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
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
          style={{ marginBottom: 32, zIndex: 100 }}
        >
          <Animated.View
            style={[
              {
                backgroundColor: colors.white,
                borderRadius: 14,
                borderWidth: 1.5,
                borderCurve: "continuous",
                boxShadow: "0 2px 8px rgba(27, 27, 27, 0.06)",
                position: "relative",
              },
              inputAnimatedStyle,
            ]}
          >
            <TextInput
              ref={refs.inputRef}
              value={state.destination}
              onChangeText={actions.setDestination}
              onFocus={actions.handleInputFocus}
              onBlur={actions.handleInputBlur}
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
              onSubmitEditing={actions.handleExplorePress}
            />
            {state.isLoading && (
              <ActivityIndicator
                size="small"
                color={colors.regalNavy}
                style={{ position: "absolute", right: 18, top: 18 }}
              />
            )}
          </Animated.View>

          {/* Autocomplete List */}
          {state.countries.length > 0 && state.isFocused && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={{
                position: "absolute",
                top: 70,
                left: 0,
                right: 0,
                backgroundColor: colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
                boxShadow: "0 8px 24px rgba(27, 27, 27, 0.12)",
                overflow: "hidden",
                zIndex: 1000,
              }}
            >
              {state.countries.map((country, index) => (
                <Pressable
                  key={country.name.common}
                  onPress={() => actions.handleSuggestionPress(country.name.common)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    backgroundColor: pressed ? colors.primaryLight : "transparent",
                    borderBottomWidth: index === state.countries.length - 1 ? 0 : 1,
                    borderBottomColor: colors.borderLight,
                  })}
                >
                  <Image
                    source={{ uri: country.flags.png }}
                    style={{ width: 24, height: 16, borderRadius: 2, marginRight: 12 }}
                    contentFit="cover"
                  />
                  <Text style={{ fontSize: 16, color: colors.carbonBlack }}>
                    {country.name.common}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          )}
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
              const isSelected = state.destination === item.name;
              return (
                <Animated.View
                  key={item.name}
                  entering={FadeIn.duration(350).delay(350 + index * 40)}
                >
                  <Pressable
                    onPress={() => actions.handleSuggestionPress(item.name)}
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
            onPress={actions.handleExplorePress}
            disabled={!state.destination.trim()}
            style={[
              {
                backgroundColor: colors.regalNavy,
                borderRadius: 14,
                borderCurve: "continuous",
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: state.destination.trim()
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
    </View>
  );
}
