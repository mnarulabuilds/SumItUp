import { getApiBaseUrl } from "@/services/apiConfig";

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

describe("getApiBaseUrl", () => {
  it("uses localhost for iOS and web", () => {
    expect(getApiBaseUrl()).toBe("http://localhost:3000/api");
  });
});
