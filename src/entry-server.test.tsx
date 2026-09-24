import { describe, expect, it } from "vitest";
import { render } from "./entry-server";

describe("entry-server", () => {
  it("gera o HTML estático do App", () => {
    expect(render()).toContain("Dr. Patrick Santos");
  });
});
