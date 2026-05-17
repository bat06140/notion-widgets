import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWidgetLayoutCookie,
  resolveAppView,
  resolveWidgetLayoutFromCookie,
} from "../src/lib/view-config.js";

test("resolveAppView uses the selected widget with square layout by default", () => {
  assert.deepEqual(resolveAppView("?widget=clock"), {
    kind: "widget",
    widget: "clock",
    layout: "square",
  });
});

test("resolveAppView ignores the layout query parameter", () => {
  assert.deepEqual(resolveAppView("?widget=deadline&layout=full"), {
    kind: "widget",
    widget: "deadline",
    layout: "square",
  });
});

test("resolveAppView renders the showcase view when requested", () => {
  assert.deepEqual(resolveAppView("?view=showcase&widget=clock", "calendar"), {
    kind: "showcase",
  });
});

test("resolveAppView falls back to the env widget when the url does not specify one", () => {
  assert.deepEqual(resolveAppView("", "deadline"), {
    kind: "widget",
    widget: "deadline",
    layout: "square",
  });
});

test("resolveAppView uses the server runtime widget when the url does not specify one", () => {
  assert.deepEqual(resolveAppView("", "clock"), {
    kind: "widget",
    widget: "clock",
    layout: "square",
  });
});

test("resolveAppView uses the widget pathname when the query does not specify one", () => {
  assert.deepEqual(resolveAppView("", undefined, "/clock"), {
    kind: "widget",
    widget: "clock",
    layout: "square",
  });
});

test("resolveAppView maps deadline pathname to the deadline widget", () => {
  assert.deepEqual(resolveAppView("", undefined, "/deadline"), {
    kind: "widget",
    widget: "deadline",
    layout: "square",
  });
});

test("resolveAppView falls back to calendar for unknown widget and layout values", () => {
  assert.deepEqual(resolveAppView("?widget=unknown&layout=wide"), {
    kind: "widget",
    widget: "calendar",
    layout: "square",
  });
});

test("resolveAppView no longer returns a license flag", () => {
  assert.deepEqual(resolveAppView("?widget=clock"), {
    kind: "widget",
    widget: "clock",
    layout: "square",
  });
});

test("resolveAppView ignores the license query param for access", () => {
  assert.deepEqual(resolveAppView("?widget=calendar&license=ABC-123"), {
    kind: "widget",
    widget: "calendar",
    layout: "square",
  });
});

test("resolveWidgetLayoutFromCookie uses the persisted layout for premium users", () => {
  assert.equal(
    resolveWidgetLayoutFromCookie("widgetLayout=full", true),
    "full"
  );
});

test("resolveWidgetLayoutFromCookie defaults freemium users to full layout", () => {
  assert.equal(
    resolveWidgetLayoutFromCookie("widgetLayout=square", false),
    "full"
  );
});

test("buildWidgetLayoutCookie serializes the selected layout", () => {
  assert.match(
    buildWidgetLayoutCookie("full"),
    /^widgetLayout=full; Path=\/; Max-Age=31536000; SameSite=Lax$/
  );
});
