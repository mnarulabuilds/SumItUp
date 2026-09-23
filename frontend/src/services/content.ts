import api from "./api";

export type SavedContent = {
  _id: string;
  title: string;
  originalContent: string;
  summary: string;
  contentType: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt?: string;
};

export function contentTypeToApi(type: string): string {
  const map: Record<string, string> = {
    Meeting: "meeting",
    Audio: "audio",
    Video: "video",
    PDF: "pdf",
    URL: "url",
    Image: "image",
    GIF: "gif",
    Book: "book",
  };
  return map[type] ?? type.toLowerCase();
}

export async function fetchHistory(limit = 50): Promise<SavedContent[]> {
  const { data } = await api.get("/content/history", { params: { limit } });
  return data.content ?? [];
}

export async function saveSummary(payload: {
  title: string;
  originalContent: string;
  summary: string;
  contentType: string;
  tags?: string[];
}) {
  const { data } = await api.post("/content/save", {
    ...payload,
    contentType: contentTypeToApi(payload.contentType),
  });
  return data.content as SavedContent;
}

export async function toggleFavorite(contentId: string) {
  const { data } = await api.put(`/content/${contentId}/favorite`);
  return data.content as SavedContent;
}

export async function deleteContent(contentId: string) {
  await api.delete(`/content/${contentId}`);
}
