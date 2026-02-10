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
import { useRouter } from "expo-router";
import { useHomeViewModel } from "../src/view-models/use-home-view-model";
import { SUGGESTIONS } from "../src/constants/suggestions";
import { FormStep } from "../src/components/form-step";
import { DestinationStep } from "../src/components/destination-step";
import { DateStep } from "../src/components/date-step";
import { DaysStep } from "../src/components/days-step";
import { GeneratingOverlay } from "../src/components/generating-overlay";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, refs, animations, actions } = useHomeViewModel();

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      state.isFocused ? colors.coral : colors.borderLight,
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
      {/* Generating Overlay */}
      <GeneratingOverlay
        visible={state.isGenerating}
        destination={state.destination}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative Background Accent */}
        <View
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: colors.primaryLight,
            opacity: 0.5,
            filter: 'blur(60px)',
            zIndex: -1
          }}
        />

        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100).springify().damping(20)}
          style={{ marginBottom: 32 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, backgroundColor: colors.coral, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.white, fontSize: 18, fontWeight: '800' }}>★</Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: colors.carbonBlack,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Drift Star
              </Text>
            </View>

            {state.savedTrips.length > 0 && (
              <Pressable
                onPress={() => router.push('/trips')}
                style={({ pressed }) => ({
                  backgroundColor: colors.white,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  boxShadow: pressed ? "none" : colors.buttonShadow,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.coral }}>
                  My Trips
                </Text>
              </Pressable>
            )}
          </View>

          <Text
            style={{
              fontSize: 38,
              fontWeight: "800",
              color: colors.carbonBlack,
              lineHeight: 44,
              letterSpacing: -1,
            }}
          >
            Where to next?
          </Text>
          <Text style={{ fontSize: 16, color: colors.ashBrown, marginTop: 8, fontWeight: '500' }}>
            Plan your next journey with AI intelligence.
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
          <DateStep
            isActive={state.currentStep === 1}
            isCompleted={state.currentStep > 1}
            date={state.travelDate}
            onChange={actions.setTravelDate}
            onNext={actions.goToNextStep}
            onEdit={() => actions.setCurrentStep(1)}
          />

          {/* Step 2: Number of Days */}
          <DaysStep
            isActive={state.currentStep === 2}
            isCompleted={state.currentStep > 2 || state.isPreGenerating}
            days={state.numberOfDays}
            onChange={actions.setNumberOfDays}
            onNext={actions.handleSubmit} // Use handleSubmit directly here since it's the last step
            onEdit={() => actions.setCurrentStep(2)}
          />
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
                backgroundColor: colors.errorLight,
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.error,
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
            disabled={!state.isCurrentStepValid || state.isGenerating || state.isPreGenerating}
            style={[
              {
                backgroundColor:
                  state.isCurrentStepValid && !state.isGenerating
                    ? colors.coral
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
                    ? colors.primaryShadow
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
