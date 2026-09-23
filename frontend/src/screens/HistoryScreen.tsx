import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/navigator/AppNavigator";
import { deleteContent, fetchHistory, SavedContent } from "@/services/content";
import { getApiErrorMessage } from "@/utils/apiError";
import colors from "@/theme/a11y";
import { Ionicons } from "@expo/vector-icons";

type HistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "History">;
};

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [items, setItems] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await fetchHistory();
      setItems(data);
    } catch (error) {
      Alert.alert("History", getApiErrorMessage(error, "Could not load history."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openItem = (item: SavedContent) => {
    navigation.navigate("Summary", {
      summary: item.summary,
      originalContent: item.originalContent,
      type: item.contentType,
      contentId: item._id,
      title: item.title,
    });
  };

  const confirmDelete = (item: SavedContent) => {
    Alert.alert("Delete summary", `Remove "${item.title}" from history?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteContent(item._id);
            setItems((prev) => prev.filter((x) => x._id !== item._id));
          } catch (error) {
            Alert.alert("Error", getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your summaries</Text>
      <Text style={styles.subtitle}>Tap an item to read it again or share it.</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No summaries yet. Upload content from Home to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openItem(item)} accessibilityRole="button">
            <View style={styles.cardHeader}>
              <Text style={styles.badge}>{item.contentType}</Text>
              {item.isFavorite ? <Ionicons name="heart" size={18} color="#F87171" /> : null}
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardPreview} numberOfLines={2}>
              {item.summary}
            </Text>
            <TouchableOpacity
              onPress={() => confirmDelete(item)}
              style={styles.deleteBtn}
              accessibilityLabel="Delete summary"
            >
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardPreview: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 28,
  },
  deleteBtn: {
    position: "absolute",
    right: 12,
    bottom: 14,
    padding: 6,
  },
});

export default HistoryScreen;
