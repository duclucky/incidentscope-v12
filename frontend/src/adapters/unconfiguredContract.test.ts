import { createUnconfiguredContractAdapter } from "./unconfiguredContract";

describe("unconfigured contract adapter", () => {
  it("returns an honest unconfigured result without fabricated pool data", async () => {
    const adapter = createUnconfiguredContractAdapter();

    const result = await adapter.listPools({ query: "", status: "ALL" });

    expect(result).toEqual({
      status: "UNCONFIGURED",
      message: "Canonical contract reads are not configured yet.",
    });
    expect(result).not.toHaveProperty("data");
    expect(JSON.stringify(result)).not.toMatch(/0x[a-f0-9]{16,}/i);
  });

  it("keeps every read and write unavailable until real configuration exists", async () => {
    const adapter = createUnconfiguredContractAdapter();

    const [pool, dependencies, activity, write] = await Promise.all([
      adapter.getPool("pool-1", "0xparticipant"),
      adapter.listDependencies("0xparticipant"),
      adapter.listActivity("0xparticipant"),
      adapter.createPool({
        title: "API incident credit",
        incidentUrl: "https://status.example.test/incidents/incident-1",
        enrollmentClosesAt: "2026-08-22T00:00:00Z",
        reserveGen: 1,
      }),
    ]);

    expect(adapter.configuration).toMatchObject({
      readConfigured: false,
      writeConfigured: false,
      networkName: "Studionet",
    });
    expect([pool, dependencies, activity]).toEqual([
      { status: "UNCONFIGURED", message: "Canonical contract reads are not configured yet." },
      { status: "UNCONFIGURED", message: "Canonical contract reads are not configured yet." },
      { status: "UNCONFIGURED", message: "Canonical contract reads are not configured yet." },
    ]);
    expect(write).toEqual({
      status: "UNAVAILABLE",
      message: "Contract writes are not configured yet.",
    });
  });
});
