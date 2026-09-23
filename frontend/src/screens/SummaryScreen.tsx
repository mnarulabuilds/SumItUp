import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigator/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import { saveSummary, toggleFavorite } from "@/services/content";
import { getApiErrorMessage } from "@/utils/apiError";

type SummaryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Summary">;
  route: RouteProp<RootStackParamList, "Summary">;
};

const SummaryScreen: React.FC<SummaryScreenProps> = ({ navigation, route }) => {
  const { summary, originalContent, type, contentId, title } = route.params;
  const [savedId, setSavedId] = useState<string | undefined>(contentId);
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title || type} summary\n\n${summary}`,
        title: "SumItUp summary",
      });
    } catch {
      Alert.alert("Share", "Could not open the share sheet.");
    }
  };

  const handleSave = async () => {
    if (savedId) {
      Alert.alert("Saved", "This summary is already in your history.");
      return;
    }
    setBusy(true);
    try {
      const saved = await saveSummary({
        title: title || `${type} summary`,
        originalContent,
        summary,
        contentType: type,
      });
      setSavedId(saved._id);
      Alert.alert("Saved", "Added to your history.");
    } catch (error) {
      Alert.alert("Save failed", getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleFavorite = async () => {
    if (!savedId) {
      Alert.alert("Favorite", "Save this summary to history first.");
      return;
    }
    setBusy(true);
    try {
      const updated = await toggleFavorite(savedId);
      setFavorite(Boolean(updated.isFavorite));
    } catch (error) {
      Alert.alert("Favorite", getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleExportPdf = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/pdf/generate", { summary });
      Alert.alert("PDF ready", data.path ? `Saved on server: ${data.path}` : "PDF generated successfully.");
    } catch (error) {
      Alert.alert("Export", getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.backButton}>
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Summary result</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metaContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{type}</Text>
          </View>
          <Text style={styles.sourceText} numberOfLines={2}>
            {originalContent}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.summaryTitle}>Generated summary</Text>
          <Text style={styles.summaryText} selectable>
            {summary}
          </Text>
        </View>

        <View style={styles.actions}>
          <ActionButton icon="share-outline" label="Share" onPress={handleShare} disabled={busy} />
          <ActionButton icon="bookmark-outline" label="Save" onPress={handleSave} disabled={busy} />
          <ActionButton
            icon={favorite ? "heart" : "heart-outline"}
            label="Favorite"
            onPress={handleFavorite}
            disabled={busy}
          />
          <ActionButton icon="document-outline" label="PDF" onPress={handleExportPdf} disabled={busy} />
        </View>

        {busy ? <ActivityIndicator color="#60A5FA" style={{ marginBottom: 16 }} /> : null}

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("History")}>
          <Text style={styles.buttonText}>View history</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, disabled && styles.actionDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color="#E2E8F0" />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  metaContainer: {
    marginBottom: 20,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  sourceText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: "#E2E8F0",
    lineHeight: 26,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  actionBtn: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionLabel: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: "#334155",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SummaryScreen;
