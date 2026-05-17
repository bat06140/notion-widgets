import type { WidgetKey } from "@repo/shared";

export type { WidgetKey } from "@repo/shared";
export type WidgetLayout = "square" | "full";
export const WIDGET_LAYOUT_COOKIE_NAME = "widgetLayout";

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
    layout: "square",
  };
}

export function resolveWidgetLayoutFromCookie(
  cookieString: string,
  accessGranted: boolean
): WidgetLayout {
  if (!accessGranted) {
    return "full";
  }

  const layout = cookieString
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${WIDGET_LAYOUT_COOKIE_NAME}=`))
    ?.slice(WIDGET_LAYOUT_COOKIE_NAME.length + 1);

  return isWidgetLayout(layout) ? layout : "square";
}

export function buildWidgetLayoutCookie(
  layout: WidgetLayout,
  maxAgeSeconds = 60 * 60 * 24 * 365
): string {
  return `${WIDGET_LAYOUT_COOKIE_NAME}=${layout}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}
