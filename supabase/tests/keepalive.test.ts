// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, errorOf, type TestDb } from "./harness";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
}, 60_000);

const asAnon = async <T = Record<string, unknown>>(sql: string) => {
  await t.db.exec(
    "reset role; select set_config('request.jwt.claim.sub', '', false); set role anon;",
  );
  try {
    return (await t.db.query<T>(sql)).rows;
  } finally {
    await t.db.exec("reset role;");
  }
};

describe("keepalive", () => {
  it("lets anonymous pings write to the single keepalive row", async () => {
    await asAnon("select public.keepalive()");
    await asAnon("select public.keepalive()");
    const rows = await t.admin<{ pings: string }>("select pings::text from keepalive");
    expect(rows).toEqual([{ pings: "2" }]);
  });

  it("keeps the table itself closed to clients", async () => {
    expect(await errorOf(asAnon("select * from keepalive"))).toMatch(/permission denied/);
    expect(await errorOf(asAnon("update keepalive set pings = 0"))).toMatch(/permission denied/);
  });
});
