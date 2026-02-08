import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
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
import { DestinationStep } from "../src/components/destination-step";

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
          {/* Step 0: Destination - Custom Component for Morphing Animation */}
          <DestinationStep
            isActive={state.currentStep === 0}
            isCompleted={state.currentStep > 0}
            value={state.destination}
            onChangeText={actions.setDestination}
            onFocus={actions.handleInputFocus}
            onBlur={actions.handleInputBlur}
            onNext={actions.goToNextStep}
            onEdit={() => actions.setCurrentStep(0)}
            suggestions={state.countries}
            onSelectSuggestion={(name: string, flag?: string) => {
              actions.handleDestinationSelect(name, flag);
            }}
            isLoading={state.isLoading}
            inputRef={refs.inputRef}
          />

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
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.borderLight,
                overflow: "hidden",
              }}
            >
              <DateTimePicker
                value={state.travelDate}
                mode="date"
                display="inline"
                minimumDate={new Date()}
                themeVariant="light"
                accentColor={colors.regalNavy}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    actions.setTravelDate(selectedDate);
                  }
                }}
                style={{ alignSelf: "center" }}
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

          {/* Error Message */}
          {state.error && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#B91C1C",
                  textAlign: "center",
                }}
              >
                {state.error}
              </Text>
            </Animated.View>
          )}

          <AnimatedPressable
            onPress={
              state.isLastStep ? actions.handleSubmit : actions.goToNextStep
            }
            disabled={!state.isCurrentStepValid || state.isGenerating}
            style={[
              {
                backgroundColor:
                  state.isCurrentStepValid && !state.isGenerating
                    ? colors.regalNavy
                    : colors.paleOak,
                borderRadius: 14,
                borderCurve: "continuous",
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 10,
                boxShadow:
                  state.isCurrentStepValid && !state.isGenerating
                    ? "0 4px 16px rgba(16, 57, 132, 0.3)"
                    : "none",
              },
              buttonAnimatedStyle,
            ]}
          >
            {state.isGenerating && (
              <ActivityIndicator size="small" color={colors.white} />
            )}
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: colors.white,
                letterSpacing: 0.3,
              }}
            >
              {state.isGenerating
                ? "Generating..."
                : state.isLastStep
                  ? "Generate Itinerary"
                  : "Continue"}
            </Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}
