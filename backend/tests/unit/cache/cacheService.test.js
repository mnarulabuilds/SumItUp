const chai = require("chai");
const { expect } = chai;

describe("CacheService", () => {
  let cacheService;

  beforeEach(() => {
    delete require.cache[require.resolve("../../../src/cache")];
    cacheService = require("../../../src/cache").default || require("../../../src/cache");
    cacheService.flushAll();
  });

  it("sets and gets values", () => {
    cacheService.set("key", "value");
    expect(cacheService.get("key")).to.equal("value");
  });

  it("tracks keys and ttl", () => {
    cacheService.set("ttl-key", 42, 60);
    expect(cacheService.has("ttl-key")).to.be.true;
    expect(cacheService.keys()).to.include("ttl-key");
    expect(cacheService.getTtl("ttl-key")).to.be.a("number");
    expect(cacheService.ttl("ttl-key", 120)).to.be.true;
  });

  it("deletes keys and reports stats", () => {
    cacheService.set("a", 1);
    cacheService.set("b", 2);
    expect(cacheService.del("a")).to.equal(1);
    expect(cacheService.getStats()).to.be.an("object");
  });

  it("getOrSet fetches once and caches", async () => {
    let calls = 0;
    const fetchFn = async () => {
      calls += 1;
      return "loaded";
    };

    const first = await cacheService.getOrSet("load-key", fetchFn, { ttl: 30 });
    const second = await cacheService.getOrSet("load-key", fetchFn, { ttl: 30 });

    expect(first).to.equal("loaded");
    expect(second).to.equal("loaded");
    expect(calls).to.equal(1);
  });

  it("memoize caches function results by key", async () => {
    let calls = 0;
    const fn = async (id) => {
      calls += 1;
      return `value-${id}`;
    };

    const memoized = cacheService.memoize(fn, (id) => `memo-${id}`, 30);
    expect(await memoized("x")).to.equal("value-x");
    expect(await memoized("x")).to.equal("value-x");
    expect(calls).to.equal(1);
  });
});
