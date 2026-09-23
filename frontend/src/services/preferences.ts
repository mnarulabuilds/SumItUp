import api from "./api";

export type UserPreferences = {
  defaultSummaryLength: "short" | "medium" | "long";
  summaryStyle: "paragraph" | "bullets" | "insights";
  theme?: "dark" | "light";
  autoSaveContent?: boolean;
};

const defaults: UserPreferences = {
  defaultSummaryLength: "medium",
  summaryStyle: "bullets",
};

export async function fetchPreferences(): Promise<UserPreferences> {
  try {
    const { data } = await api.get("/user/preferences");
    const prefs = data.preferences ?? data;
    return {
      defaultSummaryLength: prefs.defaultSummaryLength ?? defaults.defaultSummaryLength,
      summaryStyle: prefs.summaryStyle ?? defaults.summaryStyle,
      theme: prefs.theme,
      autoSaveContent: prefs.autoSaveContent,
    };
  } catch {
    return defaults;
  }
}
