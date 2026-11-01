// @vitest-environment node
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./harness";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
}, 60_000);

/** Signs up like Supabase Auth does: a bare auth.users row, the trigger does the rest. */
const signUp = async () => {
  const id = randomUUID();
  await t.admin("insert into auth.users (id, email) values ($1, $2)", [id, `${id}@teste.dev`]);
  return id;
};

describe("open signup", () => {
  it("gives a new account access without an invite code", async () => {
    const id = await signUp();
    expect(await t.as(id, "select has_app_access() as v")).toEqual([{ v: true }]);
  });

  it("still lets an admin block an account", async () => {
    const id = await signUp();
    await t.admin("update user_profiles set status = 'blocked' where user_id = $1", [id]);
    expect(await t.as(id, "select has_app_access() as v")).toEqual([{ v: false }]);
  });
});
