import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WidgetThemeProvider } from "../src/context/WidgetThemeContext.js";
import Calendar from "../src/components/Calendar.js";
import { WidgetThemeEditor } from "../src/components/WidgetThemeEditor.js";
import { renderWidget } from "../src/components/widget-registry.js";
import { DEFAULT_WIDGET_PURCHASE_URL } from "../src/lib/widget-access.js";

const renderWithTheme = (element: React.ReactElement) =>
  renderToStaticMarkup(
    React.createElement(WidgetThemeProvider, null, element)
  );

test("WidgetThemeEditor hides itself in hidden mode", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "hidden",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    })
  );

  assert.equal(markup, "");
});

test("WidgetThemeEditor renders the locked purchase affordance", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "locked",
      purchaseUrl: "https://example.com/purchase",
    })
  );

  assert.match(markup, /Unlock premium theme customization/);
  assert.match(markup, /aria-label="Unlock premium theme customization"/);
  assert.match(markup, /href="https:\/\/example\.com\/purchase"/);
});

test("WidgetThemeEditor freemium mode uses a locked settings button instead of a direct purchase link", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "freemium",
      purchaseUrl: "https://example.com/purchase",
      layout: "square",
      onLayoutChange: () => undefined,
    })
  );

  assert.match(markup, /aria-label="Open widget settings"/);
  assert.match(markup, /data-theme-editor-settings-lock="true"/);
  assert.doesNotMatch(markup, /href="https:\/\/example\.com\/purchase"/);
});

test("WidgetThemeEditor freemium step 1 renders locked premium layout and color controls", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "freemium",
      purchaseUrl: "https://example.com/purchase",
      initialOpen: true,
      layout: "square",
      onLayoutChange: () => undefined,
    })
  );

  assert.match(markup, /href="https:\/\/example\.com\/purchase"/);
  assert.match(markup, /data-layout-control="locked"/);
  assert.match(markup, /data-theme-editor-card="locked"/);
  assert.match(markup, /data-theme-editor-swatch-lock="true"/);
  assert.match(markup, /Unlock premium theme customization/);
  assert.doesNotMatch(markup, /aria-label="Back to color list"/);
});

test("WidgetThemeEditor premium settings show an editable layout control", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
      layout: "full",
      onLayoutChange: () => undefined,
    })
  );

  assert.match(markup, /data-layout-control="editable"/);
  assert.match(markup, />Square</);
  assert.match(markup, />Full</);
  assert.match(markup, /aria-pressed="true">Full/);
});

test("WidgetThemeEditor shows full before square in the layout control", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
      layout: "full",
      onLayoutChange: () => undefined,
    })
  );

  assert.ok(markup.indexOf(">Full<") < markup.indexOf(">Square<"));
});

test("WidgetThemeEditor open state no longer renders modal header or cancel button", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
    })
  );

  assert.doesNotMatch(markup, /<h2/);
  assert.doesNotMatch(markup, /aria-label="Close color theme editor"/);
  assert.doesNotMatch(markup, />Cancel</);
});

test("WidgetThemeEditor detail step renders a confirm button for color changes", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
      initialActiveColorKey: "color1",
    })
  );

  assert.match(markup, /data-theme-editor-confirm-color="true"/);
  assert.match(markup, /aria-label="Apply"/);
  assert.match(markup, /text-green-600/);
  assert.doesNotMatch(markup, />Apply</);
});

test("WidgetThemeEditor detail step places back button and mode controls above the picker", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
      initialActiveColorKey: "color1",
    })
  );

  assert.match(markup, /aria-label="Back to color list"/);
  assert.match(markup, /text-red-600/);
  assert.match(markup, />HEX</);
  assert.match(markup, />RGBA</);
  assert.match(markup, /h-9 w-9 shrink-0/);
  assert.match(markup, /h-9 min-w-0 flex-1/);
  assert.match(markup, /h-full flex-1 rounded-\[6px\]/);
});

test("WidgetThemeEditor open state renders a widget-scoped overlay and anchored popover shell", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
    })
  );

  assert.match(markup, /data-theme-editor-overlay="true"/);
  assert.match(markup, /data-theme-editor-panel="true"/);
  assert.match(markup, /bottom-1/);
  assert.match(markup, /right-1/);
  assert.match(markup, /h-\[258px\] w-\[190px\]/);
  assert.match(markup, /max-width:calc\(100% - 8px\)/);
  assert.match(markup, /max-height:calc\(100% - 8px\)/);
});

test("WidgetThemeEditor detail step grows to the taller anchored panel size", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
      initialActiveColorKey: "color1",
    })
  );

  assert.match(markup, /h-\[308px\] w-\[224px\]/);
});

test("WidgetThemeEditor picker shell keeps compact pointer styling hooks", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
      initialActiveColorKey: "color1",
    })
  );

  assert.match(markup, /widget-color-picker/);
  assert.match(markup, /react-colorful/);
});

test("renderWidget uses the freemium editor path when access is denied", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      WidgetThemeProvider,
      null,
      renderWidget({
        widget: "calendar",
        layout: "square",
        accessGranted: false,
        purchaseUrl: "https://example.com/purchase",
      })
    )
  );

  assert.match(markup, /aria-label="Open widget settings"/);
  assert.doesNotMatch(markup, /href="https:\/\/example\.com\/purchase"/);
});

test("Calendar hides the editor when the theme editor is disabled", () => {
  const markup = renderWithTheme(
    React.createElement(Calendar, {
      layout: "square",
      accessGranted: false,
      allowThemeEditor: false,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    })
  );

  assert.doesNotMatch(markup, /href="https:\/\/atomicskills\.academy\/widgets-notion\/"/);
  assert.doesNotMatch(markup, /Unlock premium theme customization/);
});

test("Calendar threads access granted into the premium editor path", () => {
  const markup = renderWithTheme(
    React.createElement(Calendar, {
      layout: "square",
      accessGranted: true,
      allowThemeEditor: true,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    })
  );

  assert.doesNotMatch(markup, /href="https:\/\/atomicskills\.academy\/widgets-notion\/"/);
  assert.match(markup, /Open widget settings/);
});
