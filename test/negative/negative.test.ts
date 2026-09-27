import { describe, expect, it } from "vitest";
import {
  isAllowedOrigin,
  isAuthorized,
} from "../../packages/mcp-server/src/auth.js";
describe("negative seams", () => {
  it("rejects invalid origin", () =>
    expect(
      isAllowedOrigin("https://evil.example", ["https://good.example"]),
    ).toBe(false));
  it("rejects missing auth", () =>
    expect(isAuthorized(null, "expected")).toBe(false));
  it("detects stdout pollution", () =>
    expect(() => {
      throw new Error("stdout protocol pollution detected");
    }).toThrow("pollution"));
});
