import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/navigator/AppNavigator";
import { useAuth } from "@/context/AuthContext";
import colors, { a11y } from "@/theme/a11y";
import {
  createDonation,
  fetchPlans,
  fetchWallet,
  subscribeToPlan,
  topUpWallet,
  watchAdEarnTokens,
} from "@/services/billing";
import { getApiErrorMessage } from "@/utils/apiError";

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Profile">;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [donationAmount, setDonationAmount] = useState("5");

  const load = async () => {
    setLoading(true);
    try {
      const [walletData, planData] = await Promise.all([fetchWallet(), fetchPlans()]);
      setWallet(walletData);
      setPlans(planData);
    } catch {
      Alert.alert("Error", "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const handleTopUp = async () => {
    try {
      await topUpWallet(1000);
      await load();
      Alert.alert("Wallet", "Added $10.00 demo credits.");
    } catch {
      Alert.alert("Error", "Top-up failed.");
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await subscribeToPlan(planId);
      await load();
      Alert.alert("Success", `You are now on the ${planId} plan.`);
    } catch (err: unknown) {
      Alert.alert("Subscription", getApiErrorMessage(err, "Could not subscribe."));
    }
  };

  const handleWatchAd = async () => {
    try {
      await watchAdEarnTokens(`ad-${Date.now()}`);
      await load();
      Alert.alert("Thanks!", "You earned tokens from the ad.");
    } catch (err: unknown) {
      Alert.alert("Ads", getApiErrorMessage(err, "Ad reward unavailable."));
    }
  };

  const handleDonate = async () => {
    const dollars = Number(donationAmount);
    if (!dollars || dollars < 1) {
      Alert.alert("Donation", "Enter at least $1.");
      return;
    }
    const cents = Math.round(dollars * 100);
    const balance = wallet?.walletBalanceCents ?? 0;
    if (cents > balance) {
      Alert.alert(
        "Donation",
        "Top up your demo wallet first — donations are deducted from wallet balance."
      );
      return;
    }
    try {
      await createDonation(cents, "Supporting SumItUp");
      await load();
      Alert.alert("Thank you!", "Your donation helps keep SumItUp running.");
    } catch (err: unknown) {
      Alert.alert("Donation", getApiErrorMessage(err, "Donation failed."));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered} accessibilityLabel="Loading profile">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Profile & wallet
      </Text>

      <View style={styles.card} accessible accessibilityLabel={`Token balance ${wallet?.tokens}`}>
        <Text style={styles.cardLabel}>Tokens</Text>
        <Text style={styles.cardValue}>{wallet?.tokens ?? 0}</Text>
        <Text style={styles.cardMeta}>
          Plan: {wallet?.subscriptionPlan ?? "free"} · Wallet: $
          {((wallet?.walletBalanceCents ?? 0) / 100).toFixed(2)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleWatchAd}
        accessibilityRole="button"
        accessibilityLabel="Watch ad to earn tokens"
      >
        <Text style={styles.primaryButtonText}>Watch ad · earn tokens</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleTopUp}
        accessibilityRole="button"
        accessibilityLabel="Top up wallet demo credits"
      >
        <Text style={styles.secondaryButtonText}>Top up wallet (+$10 demo)</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Subscription plans</Text>
      {plans
        .filter((p) => p.id !== "free")
        .map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>${(plan.priceCents / 100).toFixed(2)}/mo</Text>
            <TouchableOpacity
              style={styles.planButton}
              onPress={() => handleSubscribe(plan.id)}
              accessibilityRole="button"
              accessibilityLabel={`Subscribe to ${plan.name}`}
            >
              <Text style={styles.planButtonText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        ))}

      <Text style={styles.sectionTitle}>Support the project</Text>
      <TextInput
        style={styles.input}
        value={donationAmount}
        onChangeText={setDonationAmount}
        keyboardType="decimal-pad"
        accessibilityLabel="Donation amount in dollars"
        placeholder="Amount USD"
        placeholderTextColor={colors.textMuted}
      />
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleDonate}
        accessibilityRole="button"
        accessibilityLabel="Donate"
      >
        <Text style={styles.primaryButtonText}>Donate</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("Settings")}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <Text style={styles.secondaryButtonText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dangerButton}
        onPress={signOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={styles.dangerButtonText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: "700", color: colors.textPrimary, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardLabel: { color: colors.textSecondary, fontSize: 14 },
  cardValue: { color: colors.textPrimary, fontSize: 32, fontWeight: "700", marginVertical: 4 },
  cardMeta: { color: colors.textMuted, fontSize: 14 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderColor: colors.border,
    borderWidth: 1,
  },
  planName: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
  planPrice: { color: colors.textSecondary, marginVertical: 4 },
  planButton: {
    backgroundColor: colors.primary,
    minHeight: a11y.minTouchTarget,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  planButtonText: { color: colors.textPrimary, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: a11y.minTouchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    minHeight: a11y.minTouchTarget,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: { color: colors.textPrimary, fontWeight: "700" },
  secondaryButton: {
    minHeight: a11y.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 16 },
  dangerButton: {
    marginTop: 16,
    backgroundColor: colors.danger,
    minHeight: a11y.minTouchTarget,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dangerButtonText: { color: colors.textPrimary, fontWeight: "700" },
});

export default ProfileScreen;
