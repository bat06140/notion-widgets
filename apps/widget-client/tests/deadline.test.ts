import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDeadlineLabel,
  getDeadlineFontScale,
} from "../src/lib/deadline.js";

test("formatDeadlineLabel keeps the J- prefix and supports four digits", () => {
  assert.equal(formatDeadlineLabel(1234), "J-1234");
});

test("getDeadlineFontScale reduces the scale for long labels", () => {
  assert.equal(getDeadlineFontScale("J-12"), 0.94);
  assert.equal(getDeadlineFontScale("J-1234"), 0.8);
});
