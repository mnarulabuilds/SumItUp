export type ContentType =
  | "audio"
  | "image"
  | "video"
  | "gif"
  | "url"
  | "pdf"
  | "book"
  | "text";

export interface ApiErrorBody {
  error: string;
}
