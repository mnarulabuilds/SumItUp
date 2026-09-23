import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigator/AppNavigator";
import api from "@/services/api";
import colors, { a11y } from "@/theme/a11y";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Settings">;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "long">("medium");
  const [summaryStyle, setSummaryStyle] = useState<"paragraph" | "bullets" | "insights">("bullets");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/user/preferences");
        setSummaryLength(data.defaultSummaryLength || "medium");
        setSummaryStyle(data.summaryStyle || "bullets");
        setTheme(data.theme === "light" ? "light" : "dark");
      } catch {
        // defaults remain
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const savePreferences = async () => {
    try {
      await api.put("/user/preferences", {
        defaultSummaryLength: summaryLength,
        summaryStyle,
        theme,
      });
      Alert.alert("Saved", "Your preferences were updated.");
    } catch {
      Alert.alert("Error", "Could not save preferences.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered} accessibilityLabel="Loading settings">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Settings
      </Text>

      <Text style={styles.sectionLabel}>Summary length</Text>
      {(["short", "medium", "long"] as const).map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.option, summaryLength === option && styles.optionActive]}
          onPress={() => setSummaryLength(option)}
          accessibilityRole="radio"
          accessibilityState={{ selected: summaryLength === option }}
          accessibilityLabel={`Summary length ${option}`}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionLabel}>Summary style</Text>
      {(["paragraph", "bullets", "insights"] as const).map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.option, summaryStyle === option && styles.optionActive]}
          onPress={() => setSummaryStyle(option)}
          accessibilityRole="radio"
          accessibilityState={{ selected: summaryStyle === option }}
          accessibilityLabel={`Summary style ${option}`}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Light theme (preview)</Text>
        <Switch
          value={theme === "light"}
          onValueChange={(v) => setTheme(v ? "light" : "dark")}
          accessibilityLabel="Toggle light theme"
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={savePreferences}
        accessibilityRole="button"
        accessibilityLabel="Save settings"
      >
        <Text style={styles.primaryButtonText}>Save settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: "700", color: colors.textPrimary, marginBottom: 20 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  option: {
    minHeight: a11y.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { borderColor: colors.focusRing, backgroundColor: colors.surfaceElevated },
  optionText: { color: colors.textPrimary, fontSize: 16, textTransform: "capitalize" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    minHeight: a11y.minTouchTarget,
  },
  rowLabel: { color: colors.textPrimary, fontSize: 16 },
  primaryButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    minHeight: a11y.minTouchTarget,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { color: colors.textPrimary, fontWeight: "700", fontSize: 16 },
  secondaryButton: {
    marginTop: 12,
    minHeight: a11y.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 16 },
});

export default SettingsScreen;
