import test from "node:test";
import assert from "node:assert/strict";
import {
  getWidgetLayoutStorageKey,
  readWidgetLayoutFromStorage,
  resolveAppView,
  writeWidgetLayoutToStorage,
} from "../src/lib/view-config.js";

const createStorage = (initialValues: Record<string, string> = {}): Storage => {
  const values = new Map(Object.entries(initialValues));

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

test("resolveAppView uses the selected widget with full layout by default", () => {
  assert.deepEqual(resolveAppView("?widget=clock"), {
    kind: "widget",
    widget: "clock",
    layout: "full",
  });
});

test("resolveAppView ignores the layout query parameter", () => {
  assert.deepEqual(resolveAppView("?widget=deadline&layout=full"), {
    kind: "widget",
    widget: "deadline",
    layout: "full",
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
    layout: "full",
  });
});

test("resolveAppView uses the server runtime widget when the url does not specify one", () => {
  assert.deepEqual(resolveAppView("", "clock"), {
    kind: "widget",
    widget: "clock",
    layout: "full",
  });
});

test("resolveAppView uses the widget pathname when the query does not specify one", () => {
  assert.deepEqual(resolveAppView("", undefined, "/clock"), {
    kind: "widget",
    widget: "clock",
    layout: "full",
  });
});

test("resolveAppView maps deadline pathname to the deadline widget", () => {
  assert.deepEqual(resolveAppView("", undefined, "/deadline"), {
    kind: "widget",
    widget: "deadline",
    layout: "full",
  });
});

test("resolveAppView falls back to calendar for unknown widget and layout values", () => {
  assert.deepEqual(resolveAppView("?widget=unknown&layout=wide"), {
    kind: "widget",
    widget: "calendar",
    layout: "full",
  });
});

test("resolveAppView no longer returns a license flag", () => {
  assert.deepEqual(resolveAppView("?widget=clock"), {
    kind: "widget",
    widget: "clock",
    layout: "full",
  });
});

test("resolveAppView ignores the license query param for access", () => {
  assert.deepEqual(resolveAppView("?widget=calendar&license=ABC-123"), {
    kind: "widget",
    widget: "calendar",
    layout: "full",
  });
});

test("readWidgetLayoutFromStorage uses the persisted widget-specific layout for premium users", () => {
  const storage = createStorage({
    [getWidgetLayoutStorageKey("calendar")]: "square",
  });

  assert.equal(
    readWidgetLayoutFromStorage(storage, "calendar", true),
    "square"
  );
});

test("readWidgetLayoutFromStorage defaults premium users to full layout", () => {
  assert.equal(readWidgetLayoutFromStorage(createStorage(), "calendar", true), "full");
});

test("readWidgetLayoutFromStorage defaults freemium users to full layout", () => {
  assert.equal(
    readWidgetLayoutFromStorage(
      createStorage({ [getWidgetLayoutStorageKey("calendar")]: "square" }),
      "calendar",
      false
    ),
    "full"
  );
});

test("readWidgetLayoutFromStorage does not share layouts across widgets", () => {
  const storage = createStorage({
    [getWidgetLayoutStorageKey("calendar")]: "square",
  });

  assert.equal(readWidgetLayoutFromStorage(storage, "clock", true), "full");
});

test("readWidgetLayoutFromStorage defaults to full for invalid persisted layouts", () => {
  assert.equal(
    readWidgetLayoutFromStorage(
      createStorage({ [getWidgetLayoutStorageKey("calendar")]: "wide" }),
      "calendar",
      true
    ),
    "full"
  );
});

test("writeWidgetLayoutToStorage writes widgetLayout to localStorage", () => {
  const storage = createStorage();

  writeWidgetLayoutToStorage(storage, "deadline", "square");

  assert.equal(storage.getItem(getWidgetLayoutStorageKey("deadline")), "square");
});

test("writeWidgetLayoutToStorage ignores unavailable localStorage", () => {
  const storage: Pick<Storage, "setItem"> = {
    setItem: () => {
      throw new Error("Storage unavailable");
    },
  };

  assert.doesNotThrow(() =>
    writeWidgetLayoutToStorage(storage, "clock", "square")
  );
});
