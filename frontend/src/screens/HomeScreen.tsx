import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigator/AppNavigator";
import { useAuth } from "@/context/AuthContext";
import { TouchableOpacity } from "react-native-gesture-handler";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

const contentTypes = [
  {
    title: "Audio",
    icon: require("@/assets/icons/audio.png"),
    screen: "Upload" as const,
  },
  {
    title: "Video",
    icon: require("@/assets/icons/video.png"),
    screen: "Upload" as const,
  },
  {
    title: "PDF",
    icon: require("@/assets/icons/pdf.png"),
    screen: "Upload" as const,
  },
  {
    title: "URL",
    icon: require("@/assets/icons/url.png"),
    screen: "Upload" as const,
  },
  {
    title: "Image",
    icon: require("@/assets/icons/image.png"),
    screen: "Upload" as const,
  },
  // {
  //   title: "Book",
  //   icon: require("@/assets/icons/book.png"),
  //   screen: "Upload" as const,
  // },
  {
    title: "GIF",
    icon: require("@/assets/icons/gif.png"),
    screen: "Upload" as const,
  },
];

const { width } = Dimensions.get("window");
// Calculated for 3 columns with more breathing room
const cardWidth = (width - 180) / 3;

const ContentCard = ({
  item,
  navigation,
}: {
  item: (typeof contentTypes)[0];
  navigation: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isHovered, setIsHovered] = useState(false);

  const handleDisplayHoverIn = () => {
    setIsHovered(true);
    Animated.spring(scaleAnim, {
      toValue: 1.05,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleDisplayHoverOut = () => {
    setIsHovered(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={() =>
        navigation.navigate(item.screen, { contentType: item.title })
      }
      onHoverIn={handleDisplayHoverIn}
      onHoverOut={handleDisplayHoverOut}
      onPressIn={handleDisplayHoverIn}
      onPressOut={handleDisplayHoverOut}
      style={{ margin: 5 }}
      accessibilityRole="button"
      accessibilityLabel={`Summarize ${item.title} content`}
      accessibilityHint={`Opens upload screen for ${item.title}`}
    >
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] },
          isHovered && styles.cardHover,
        ]}
      >
        <Image source={item.icon} style={styles.icon} />
        <Text style={styles.cardText}>{item.title}</Text>
      </Animated.View>
    </Pressable>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { signOut } = useAuth();

  const renderItem = ({ item }: { item: (typeof contentTypes)[0] }) => (
    <ContentCard item={item} navigation={navigation} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Welcome to SumItUp</Text>
          <Text style={styles.subtitle}>
            Select the content type you want to summarize
          </Text>
        </View>
        <TouchableOpacity
          onPress={signOut}
          style={styles.signOutButton}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contentTypes}
        renderItem={renderItem}
        keyExtractor={(item) => item.title}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// Dimensions moved to top

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginTop: 0,
    maxWidth: "80%",
  },
  signOutButton: {
    padding: 8,
    backgroundColor: "#ef4444",
    borderRadius: 8,
  },
  signOutText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  gridContainer: {
    paddingVertical: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#1E293B",
    width: cardWidth,
    height: cardWidth, // 1:1 Aspect Ratio
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardHover: {
    backgroundColor: "#334155",
    borderColor: "#60A5FA",
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 10,
    resizeMode: "contain",
  },
  cardText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
  },
});

export default HomeScreen;
