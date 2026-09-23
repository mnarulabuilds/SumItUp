import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigator/AppNavigator";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import api from "@/services/api";
import { saveSummary } from "@/services/content";
import { fetchPreferences } from "@/services/preferences";
import { getApiErrorMessage } from "@/utils/apiError";
import { Ionicons } from "@expo/vector-icons";

type UploadScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Upload">;
  route: RouteProp<RootStackParamList, "Upload">;
};

type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

const UploadScreen: React.FC<UploadScreenProps> = ({ navigation, route }) => {
  const { contentType } = route.params;
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInputText("");
    setSelectedFile(null);
  }, [contentType]);

  const pickFile = async () => {
    try {
      if (
        contentType === "Image" ||
        contentType === "Video" ||
        contentType === "GIF"
      ) {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission to access camera roll is required!");
          return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            contentType === "Video"
              ? ImagePicker.MediaTypeOptions.Videos
              : ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });

        if (!pickerResult.canceled) {
          const asset = pickerResult.assets[0];
          let filename = asset.fileName;
          let mime = asset.mimeType;

          if (!mime) {
            if (contentType === "Video") mime = "video/mp4";
            else if (contentType === "GIF") mime = "image/gif";
            else mime = "image/jpeg";
          }

          if (!filename) {
            const ext = mime.split("/")[1] || "jpg";
            filename = `upload.${ext}`;
          }

          setSelectedFile({
            uri: asset.uri,
            name: filename,
            mimeType: mime,
          });
        }
      } else {
        const typeMap: Record<string, string> = {
          Audio: "audio/*",
          Meeting: "audio/*,video/*",
          PDF: "application/pdf",
          Book: "application/pdf",
        };

        const result = await DocumentPicker.getDocumentAsync({
          type: typeMap[contentType] || "*/*",
          copyToCacheDirectory: true,
        });

        if (!result.canceled) {
          const asset = result.assets[0];
          let mimeType = asset.mimeType;
          if (!mimeType) {
            if (contentType === "PDF" || contentType === "Book") mimeType = "application/pdf";
            else if (contentType === "Audio") mimeType = "audio/mpeg";
            else if (contentType === "Meeting") mimeType = "audio/mpeg";
          }

          setSelectedFile({
            uri: asset.uri,
            name: asset.name,
            mimeType: mimeType,
          });
        }
      }
    } catch (err) {
      console.error("Error picking file:", err);
      Alert.alert("Error", "Failed to pick file.");
    }
  };

  const handleUploadAndGenerate = async () => {
    setIsLoading(true);
    try {
      let payload: Record<string, unknown> = {};
      let endpoint = "";
      let originalLabel = inputText;

      if (contentType === "URL") {
        if (!inputText.trim()) {
          Alert.alert("Error", "Please enter a URL");
          setIsLoading(false);
          return;
        }
        endpoint = "/summary/generate/url";
        payload = { url: inputText.trim() };
        originalLabel = inputText.trim();
      } else {
        if (!selectedFile) {
          Alert.alert("Error", "Please select a file to upload");
          setIsLoading(false);
          return;
        }

        const formData = new FormData();

        if (Platform.OS === "web") {
          const response = await fetch(selectedFile.uri);
          const blob = await response.blob();
          formData.append("file", blob, selectedFile.name);
        } else {
          formData.append("file", {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.mimeType || "application/octet-stream",
          } as unknown as Blob);
        }

        const headers: Record<string, string> = {};
        if (Platform.OS !== "web") {
          headers["Content-Type"] = "multipart/form-data";
        }

        let uploadResponse;
        try {
          uploadResponse = await api.post("/file/upload", formData, {
            headers,
            transformRequest: (data) => data,
          });
        } catch {
          Alert.alert("Error", "File upload failed. Check file type and size (max 10MB).");
          setIsLoading(false);
          return;
        }

        const uploadedFilename = uploadResponse.data.file.filename as string;
        originalLabel = selectedFile.name;

        switch (contentType) {
          case "Meeting":
            endpoint = "/summary/generate/meeting";
            payload = {
              meetingData: {
                audioFileName: uploadedFilename,
                title: inputText.trim() || "Meeting recording",
              },
            };
            break;
          case "Audio":
            endpoint = "/summary/generate/audio";
            payload = {
              audioData: {
                audioFileName: uploadedFilename,
                format: uploadedFilename.split(".").pop()?.toLowerCase(),
              },
            };
            break;
          case "Video":
            endpoint = "/summary/generate/video";
            payload = { videoFileName: uploadedFilename };
            break;
          case "PDF":
            endpoint = "/summary/generate/pdf";
            payload = { pdfData: { pdfFileName: uploadedFilename } };
            break;
          case "Image":
            endpoint = "/summary/generate/image";
            payload = { imageData: { imageFileName: uploadedFilename } };
            break;
          case "GIF":
            endpoint = "/summary/generate/gif";
            payload = { gifFileName: uploadedFilename };
            break;
          case "Book":
            endpoint = "/summary/generate/book";
            payload = { bookData: { pdfFileName: uploadedFilename } };
            break;
          default:
            Alert.alert("Error", "Unsupported content type");
            setIsLoading(false);
            return;
        }
      }

      const response = await api.post(endpoint, payload);
      const summary = response.data.summary as string;
      const prefs = await fetchPreferences();
      let savedId: string | undefined;

      if (prefs.autoSaveContent !== false) {
        try {
          const saved = await saveSummary({
            title:
              contentType === "Meeting"
                ? inputText.trim() || "Meeting summary"
                : `${contentType} summary`,
            originalContent: originalLabel,
            summary,
            contentType,
          });
          savedId = saved._id;
        } catch {
          // history save is best-effort
        }
      }

      navigation.navigate("Summary", {
        summary,
        originalContent: originalLabel,
        type: contentType,
        contentId: savedId,
      });
    } catch (error: unknown) {
      Alert.alert("Error", getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = () => {
    if (contentType === "Meeting") {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Meeting title (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Weekly standup"
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            accessibilityLabel="Meeting title"
          />
          <Text style={[styles.label, { marginTop: 12 }]}>Upload recording (audio/video)</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickFile} accessibilityRole="button">
            <Ionicons name="cloud-upload-outline" size={48} color="#60A5FA" />
            <Text style={styles.uploadText}>
              {selectedFile ? selectedFile.name : "Tap to browse recording"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (contentType === "URL") {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter URL</Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://example.com/article"
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Select {contentType} file</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickFile}>
          <Ionicons name="cloud-upload-outline" size={48} color="#60A5FA" />
          <Text style={styles.uploadText}>
            {selectedFile ? selectedFile.name : "Tap to browse files"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Supported uploads depend on type (max 10MB). Summaries use your Settings preferences.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Upload {contentType}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Upload your {contentType.toLowerCase()} to generate a concise summary instantly.
        </Text>

        {renderInput()}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleUploadAndGenerate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generate Summary</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

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
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: "#E2E8F0",
    marginBottom: 10,
    fontWeight: "600",
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  uploadBox: {
    backgroundColor: "#1E293B",
    borderWidth: 2,
    borderColor: "#334155",
    borderStyle: "dashed",
    borderRadius: 16,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  uploadText: {
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UploadScreen;
