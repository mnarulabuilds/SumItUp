import React from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import HomeScreen from "@/screens/HomeScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import UploadScreen from "@/screens/UploadScreen";
import SummaryScreen from "@/screens/SummaryScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import LoginScreen from "@/screens/LoginScreen";
import SignUpScreen from "@/screens/SignupScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Upload: { contentType: string };
  Summary: {
    summary: string;
    originalContent: string;
    type: string;
    contentId?: string;
    title?: string;
  };
  History: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isLoading, userToken } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken !== null ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Upload" component={UploadScreen} />
          <Stack.Screen name="Summary" component={SummaryScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
