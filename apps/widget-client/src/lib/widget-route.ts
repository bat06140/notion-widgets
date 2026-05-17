import type { WidgetKey } from "@repo/shared";

export function getWidgetFromPathname(pathname: string): WidgetKey | undefined {
  if (pathname === "/calendar") {
    return "calendar";
  }

  if (pathname === "/clock") {
    return "clock";
  }

  if (pathname === "/deadline") {
    return "deadline";
  }

  return undefined;
}

export function getWidgetPath(widget: WidgetKey) {
  if (widget === "calendar") {
    return "/calendar";
  }

  if (widget === "clock") {
    return "/clock";
  }

  return "/deadline";
}

export function isWidgetPathname(pathname: string) {
  return getWidgetFromPathname(pathname) !== undefined;
}
