describe("getApiBaseUrl", () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    jest.resetModules();
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalEnv;
    }
  });

  it("uses localhost for iOS and web", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getApiBaseUrl } = require("@/services/apiConfig");
    expect(getApiBaseUrl()).toBe("http://localhost:3000/api");
  });

  it("uses emulator host for Android", () => {
    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getApiBaseUrl } = require("@/services/apiConfig");
    expect(getApiBaseUrl()).toBe("http://10.0.2.2:3000/api");
  });

  it("prefers EXPO_PUBLIC_API_URL when set", () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
    jest.doMock("react-native", () => ({ Platform: { OS: "web" } }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getApiBaseUrl } = require("@/services/apiConfig");
    expect(getApiBaseUrl()).toBe("https://api.example.com/api");
  });

  it("normalizes EXPO_PUBLIC_API_URL that already includes /api", () => {
    process.env.EXPO_PUBLIC_API_URL = "/api";
    jest.doMock("react-native", () => ({ Platform: { OS: "web" } }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getApiBaseUrl } = require("@/services/apiConfig");
    expect(getApiBaseUrl()).toBe("/api");
  });
});
