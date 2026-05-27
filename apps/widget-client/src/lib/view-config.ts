import type { WidgetKey } from "@repo/shared";

export type { WidgetKey } from "@repo/shared";
export type WidgetLayout = "square" | "full";
export const WIDGET_LAYOUT_STORAGE_KEY = "widgetLayout";
export const getWidgetLayoutStorageKey = (widget: WidgetKey): string =>
  `${WIDGET_LAYOUT_STORAGE_KEY}:${widget}`;
export const DEFAULT_WIDGET_LAYOUT: WidgetLayout = "full";

export type AppView =
  | {
      kind: "widget";
      widget: WidgetKey;
      layout: WidgetLayout;
    }
  | {
      kind: "showcase";
    };

const FALLBACK_WIDGET: WidgetKey = "calendar";
const PATH_WIDGETS: Readonly<Record<string, WidgetKey>> = {
  "/calendar": "calendar",
  "/clock": "clock",
  "/deadline": "deadline",
};

const WIDGET_DOCUMENT_TITLES: Readonly<Record<WidgetKey, string>> = {
  calendar: "Widget Calendar",
  deadline: "Widget Deadline",
  clock: "Widget Clock",
};

function isWidgetKey(value: string | null | undefined): value is WidgetKey {
  return (
    value === "calendar" || value === "deadline" || value === "clock"
  );
}

export function isWidgetLayout(
  value: string | null | undefined
): value is WidgetLayout {
  return value === "square" || value === "full";
}

function getPathWidget(pathname?: string): WidgetKey | undefined {
  if (typeof pathname !== "string") {
    return undefined;
  }

  return PATH_WIDGETS[pathname];
}

export function resolveAppView(
  search: string,
  envWidget?: string,
  pathname?: string
): AppView {
  const params = new URLSearchParams(search);
  const requestedWidget = params.get("widget");
  const pathWidget = getPathWidget(pathname);

  if (params.get("view") === "showcase") {
    return {
      kind: "showcase",
    };
  }

  const widget = isWidgetKey(requestedWidget)
    ? requestedWidget
    : pathWidget
      ? pathWidget
    : isWidgetKey(envWidget)
      ? envWidget
      : FALLBACK_WIDGET;
  return {
    kind: "widget",
    widget,
    layout: DEFAULT_WIDGET_LAYOUT,
  };
}

export function getWidgetDocumentTitle(widget: WidgetKey): string {
  return WIDGET_DOCUMENT_TITLES[widget];
}

export function readWidgetLayoutFromStorage(
  storage: Pick<Storage, "getItem">,
  widget: WidgetKey,
  accessGranted: boolean
): WidgetLayout {
  if (!accessGranted) {
    return "full";
  }

  try {
    const layout = storage.getItem(getWidgetLayoutStorageKey(widget));

    return isWidgetLayout(layout) ? layout : DEFAULT_WIDGET_LAYOUT;
  } catch {
    return DEFAULT_WIDGET_LAYOUT;
  }
}

export function writeWidgetLayoutToStorage(
  storage: Pick<Storage, "setItem">,
  widget: WidgetKey,
  layout: WidgetLayout
): void {
  try {
    storage.setItem(getWidgetLayoutStorageKey(widget), layout);
  } catch {
    return;
  }
}
