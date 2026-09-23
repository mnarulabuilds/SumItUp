export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error?: string; detail?: unknown } } }).response?.data;
    if (data?.error && typeof data.error === "string") {
      return data.error;
    }
    if (typeof data?.detail === "string") {
      return data.detail;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
