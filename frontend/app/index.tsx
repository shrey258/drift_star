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
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "../src/constants/colors";
import { Image } from "expo-image";
import { useHomeViewModel } from "../src/view-models/use-home-view-model";
import { SUGGESTIONS } from "../src/constants/suggestions";
import { FormStep } from "../src/components/form-step";

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
    opacity: interpolate(state.isCurrentStepValid ? 1 : 0, [0, 1], [0.6, 1]),
  }));

  const buttonText = state.isLastStep ? "Generate Itinerary" : "Continue";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(50)}
          style={{ marginBottom: 28 }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colors.burntPeach,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Drift Star
          </Text>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: colors.carbonBlack,
              lineHeight: 40,
              letterSpacing: -0.5,
            }}
          >
            Plan your adventure
          </Text>
        </Animated.View>

        {/* Form Steps */}
        <View style={{ flex: 1 }}>
          {/* Step 0: Destination */}
          <FormStep
            stepIndex={0}
            currentStep={state.currentStep}
            title="Where to?"
            completedSummary={state.destination}
            onEdit={() => actions.goToPreviousStep()}
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
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (state.isCurrentStepValid) actions.goToNextStep();
                }}
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
                entering={FadeIn.duration(150)}
                style={{
                  marginTop: 8,
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  boxShadow: "0 8px 24px rgba(27, 27, 27, 0.12)",
                  overflow: "hidden",
                }}
              >
                {state.countries.map((country, index) => (
                  <Pressable
                    key={country.name.common}
                    onPress={() =>
                      actions.handleDestinationSelect(
                        country.name.common,
                        country.flags.png
                      )
                    }
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      backgroundColor: pressed
                        ? colors.primaryLight
                        : "transparent",
                      borderBottomWidth:
                        index === state.countries.length - 1 ? 0 : 1,
                      borderBottomColor: colors.borderLight,
                    })}
                  >
                    <Image
                      source={{ uri: country.flags.png }}
                      style={{
                        width: 24,
                        height: 16,
                        borderRadius: 2,
                        marginRight: 12,
                      }}
                      contentFit="cover"
                    />
                    <Text style={{ fontSize: 16, color: colors.carbonBlack }}>
                      {country.name.common}
                    </Text>
                  </Pressable>
                ))}
              </Animated.View>
            )}

            {/* Quick Suggestions */}
            <View style={{ marginTop: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: colors.ashBrown,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Popular
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {SUGGESTIONS.map((item) => {
                  const isSelected = state.destination === item.name;
                  return (
                    <Pressable
                      key={item.name}
                      onPress={() => actions.handleDestinationSelect(item.name)}
                      style={({ pressed }) => ({
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : colors.white,
                        borderRadius: 8,
                        borderCurve: "continuous",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? colors.regalNavy
                          : colors.borderLight,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: isSelected
                            ? colors.regalNavy
                            : colors.carbonBlack,
                        }}
                      >
                        {item.emoji} {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </FormStep>

          {/* Step 1: Date */}
          <FormStep
            stepIndex={1}
            currentStep={state.currentStep}
            title="When?"
            completedSummary={actions.getStepSummary(1)}
            onEdit={() => actions.goToPreviousStep()}
          >
            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.borderLight,
                padding: 12,
                alignItems: "center",
              }}
            >
              <DateTimePicker
                value={state.travelDate}
                mode="date"
                display="inline"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    actions.setTravelDate(selectedDate);
                  }
                }}
                style={{ height: 320, width: "100%" }}
              />
            </View>
          </FormStep>

          {/* Step 2: Number of Days */}
          <FormStep
            stepIndex={2}
            currentStep={state.currentStep}
            title="How long?"
            completedSummary={actions.getStepSummary(2)}
          >
            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.borderLight,
                paddingVertical: 32,
                paddingHorizontal: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 32,
                }}
              >
                <Pressable
                  onPress={() =>
                    actions.setNumberOfDays(Math.max(1, state.numberOfDays - 1))
                  }
                  style={({ pressed }) => ({
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: pressed
                      ? colors.primaryLight
                      : colors.white,
                    borderWidth: 1.5,
                    borderColor: colors.borderLight,
                    justifyContent: "center",
                    alignItems: "center",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "500",
                      color: colors.carbonBlack,
                      marginTop: -2,
                    }}
                  >
                    −
                  </Text>
                </Pressable>

                <View style={{ alignItems: "center", minWidth: 90 }}>
                  <Text
                    style={{
                      fontSize: 56,
                      fontWeight: "700",
                      color: colors.regalNavy,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {state.numberOfDays}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      color: colors.ashBrown,
                      marginTop: -6,
                    }}
                  >
                    {state.numberOfDays === 1 ? "day" : "days"}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    actions.setNumberOfDays(
                      Math.min(14, state.numberOfDays + 1)
                    )
                  }
                  style={({ pressed }) => ({
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: pressed
                      ? colors.primaryLight
                      : colors.white,
                    borderWidth: 1.5,
                    borderColor: colors.borderLight,
                    justifyContent: "center",
                    alignItems: "center",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "500",
                      color: colors.carbonBlack,
                      marginTop: -2,
                    }}
                  >
                    +
                  </Text>
                </Pressable>
              </View>
            </View>
          </FormStep>
        </View>

        {/* Navigation */}
        <View style={{ paddingTop: 24 }}>
          {state.currentStep > 0 && (
            <Animated.View entering={FadeIn.duration(150)}>
              <Pressable
                onPress={actions.goToPreviousStep}
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.ashBrown,
                  }}
                >
                  ← Back
                </Text>
              </Pressable>
            </Animated.View>
          )}

          <AnimatedPressable
            onPress={
              state.isLastStep ? actions.handleSubmit : actions.goToNextStep
            }
            disabled={!state.isCurrentStepValid}
            style={[
              {
                backgroundColor: state.isCurrentStepValid
                  ? colors.regalNavy
                  : colors.paleOak,
                borderRadius: 14,
                borderCurve: "continuous",
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: state.isCurrentStepValid
                  ? "0 4px 16px rgba(16, 57, 132, 0.3)"
                  : "none",
              },
              buttonAnimatedStyle,
            ]}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: colors.white,
                letterSpacing: 0.3,
              }}
            >
              {buttonText}
            </Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}
