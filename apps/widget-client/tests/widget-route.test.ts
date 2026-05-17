import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { WidgetPage } from "../src/routes/widget-page.js";
import {
  getWidgetFromPathname,
  getWidgetPath,
  isWidgetPathname,
} from "../src/lib/widget-route.js";

test("getWidgetFromPathname maps widget URLs to widget keys", () => {
  assert.equal(getWidgetFromPathname("/calendar"), "calendar");
  assert.equal(getWidgetFromPathname("/clock"), "clock");
  assert.equal(getWidgetFromPathname("/deadline"), "deadline");
});

test("getWidgetFromPathname returns undefined for unknown routes", () => {
  assert.equal(getWidgetFromPathname("/"), undefined);
  assert.equal(getWidgetFromPathname("/unknown"), undefined);
});

test("getWidgetPath returns the canonical URL for each widget key", () => {
  assert.equal(getWidgetPath("calendar"), "/calendar");
  assert.equal(getWidgetPath("clock"), "/clock");
  assert.equal(getWidgetPath("deadline"), "/deadline");
});

test("isWidgetPathname only accepts widget page routes", () => {
  assert.equal(isWidgetPathname("/calendar"), true);
  assert.equal(isWidgetPathname("/deadline"), true);
  assert.equal(isWidgetPathname("/days-remaining"), false);
  assert.equal(isWidgetPathname("/api/widget-access"), false);
});

test("calendar route renders a loading screen before access resolves", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/calendar?license=VALID-KEY"] },
      React.createElement(WidgetPage)
    )
  );

  assert.match(markup, /Loading widget/);
});
