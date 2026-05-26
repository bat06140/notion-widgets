import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Lock, Settings, X } from "lucide-react";
import { RgbaColor, RgbaColorPicker } from "react-colorful";
import { cn } from "../lib/utils.js";
import { useWidgetTheme } from "../hook/useWidgetTheme.js";
import { getBrowserLocale, getTranslationSet } from "../lib/locale.js";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  type ThemeEditorMode,
} from "../lib/widget-access.js";
import type { WidgetLayout } from "../lib/view-config.js";
import {
  formatRgbaString,
  formatThemeInputValue,
  normalizeThemeStorageColor,
  parseWidgetThemeColor,
  RgbaColorValue,
  ThemeInputMode,
  WidgetTheme,
} from "../lib/widget-theme.js";

type ThemeColorKey = keyof WidgetTheme;

const defaultRgba: RgbaColorValue = { r: 55, g: 53, b: 47, a: 1 };

const ThemeColorField = ({
  label,
  colorValue,
  onActivate,
  variant = "editable",
  purchaseUrl,
  lockLabel,
}: {
  label: string;
  colorValue: string;
  onActivate: () => void;
  variant?: "editable" | "locked";
  purchaseUrl?: string;
  lockLabel?: string;
}) => {
  const rgba = parseWidgetThemeColor(colorValue) ?? defaultRgba;
  const isLockedVariant = variant === "locked";

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]">
          <div className="text-[10px] uppercase tracking-[0.16em] text-black/42">
            {label}
          </div>
        </div>
        <div className="mt-[5px] truncate text-[14px] font-semibold leading-none text-notion-black">
          {formatThemeInputValue(colorValue, "hex")}
        </div>
        <div className="mt-[4px] truncate text-[10px] text-black/58">
          {formatThemeInputValue(colorValue, "rgba")}
        </div>
      </div>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-black/10 bg-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <span
          className="absolute inset-[3px] rounded-[8px] border border-black/6"
          style={{ background: formatRgbaString(rgba) }}
        ></span>
        {isLockedVariant && (
          <span
            data-theme-editor-swatch-lock="true"
            className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/8 bg-white text-black/65 shadow-[0_1px_3px_rgba(0,0,0,0.18)]"
          >
            <Lock size={10} color="red" />
          </span>
        )}
      </span>
    </>
  );

  const baseClassName = cn(
    "group flex min-w-0 items-center justify-between gap-[10px] rounded-[10px] border px-[10px] py-[9px] text-left transition",
    isLockedVariant
      ? "border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,241,236,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_18px_rgba(55,53,47,0.08)] hover:border-black/20"
      : "border-black/10 bg-white/92 hover:border-black/20",
  );

  if (isLockedVariant && purchaseUrl) {
    return (
      <a
        data-theme-editor-card="locked"
        href={purchaseUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={lockLabel}
        className={baseClassName}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      data-theme-editor-card="editable"
      type="button"
      className={baseClassName}
      onClick={onActivate}
    >
      {content}
    </button>
  );
};

const LayoutControl = ({
  layout,
  canEdit,
  onLayoutChange,
  purchaseUrl,
  lockLabel,
  squareLabel,
  fullLabel,
  label,
}: {
  layout: WidgetLayout;
  canEdit: boolean;
  onLayoutChange?: (layout: WidgetLayout) => void;
  purchaseUrl: string;
  lockLabel: string;
  squareLabel: string;
  fullLabel: string;
  label: string;
}) => {
  const content = (
    <>
      <div className="flex items-center justify-between gap-[8px]">
        <div className="text-[10px] uppercase tracking-[0.16em] text-black/42">
          {label}
        </div>
        <span
          data-layout-lock-slot={canEdit ? "reserved" : "locked"}
          aria-hidden={canEdit ? "true" : undefined}
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/8 bg-white text-black/65 shadow-[0_1px_3px_rgba(0,0,0,0.12)]",
            canEdit && "invisible"
          )}
        >
          {!canEdit && (
            <Lock size={10} color="red" />
          )}
        </span>
      </div>
      <div className="mt-[8px] grid grid-cols-2 gap-[4px] rounded-[8px] border border-black/10 bg-white/90 p-[2px]">
        {(["full", "square"] as const).map((value) => {
          const isActive = layout === value;
          const text = value === "square" ? squareLabel : fullLabel;
          const optionClassName = cn(
            "flex h-8 items-center justify-center rounded-[6px] px-[8px] text-xs font-semibold transition",
            isActive
              ? "bg-notion-black text-white"
              : "text-notion-black/70 hover:bg-black/5",
          );

          if (!canEdit) {
            return (
              <span
                key={value}
                className={optionClassName}
                aria-pressed={isActive}
              >
                {text}
              </span>
            );
          }

          return (
            <button
              key={value}
              type="button"
              className={optionClassName}
              aria-pressed={isActive}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (canEdit) {
                  onLayoutChange?.(value);
                }
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
    </>
  );

  const className =
    "block rounded-[10px] border border-black/10 bg-white/92 px-[10px] py-[9px] text-left transition hover:border-black/20";

  if (!canEdit) {
    return (
      <a
        data-layout-control="locked"
        href={purchaseUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={lockLabel}
        className={className}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <div data-layout-control="editable" className={className}>
      {content}
    </div>
  );
};

export const WidgetThemeEditor = ({
  mode,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
  suspendHoverReveal = false,
  paletteButtonClassName,
  initialOpen = false,
  initialActiveColorKey = null,
  layout = "full",
  onLayoutChange,
}: {
  mode: ThemeEditorMode;
  purchaseUrl?: string;
  suspendHoverReveal?: boolean;
  paletteButtonClassName?: string;
  initialOpen?: boolean;
  initialActiveColorKey?: ThemeColorKey | null;
  layout?: WidgetLayout;
  onLayoutChange?: (layout: WidgetLayout) => void;
}) => {
  const { theme, saveTheme } = useWidgetTheme();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeColorKey, setActiveColorKey] = useState<ThemeColorKey | null>(
    initialActiveColorKey,
  );
  const [originalColorDraft, setOriginalColorDraft] = useState<string | null>(
    initialActiveColorKey == null ? null : theme[initialActiveColorKey],
  );
  const [inputMode, setInputMode] = useState<ThemeInputMode>("hex");
  const [inputDraft, setInputDraft] = useState(
    formatThemeInputValue(theme.color1, "hex"),
  );
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const suppressNextOverlayCloseRef = useRef(false);
  const suppressResetTimerRef = useRef<number | null>(null);
  const locale = getBrowserLocale();
  const translations = getTranslationSet(locale);

  const resolvedActiveColorKey = activeColorKey ?? "color1";
  const activeRgba = useMemo(
    () => parseWidgetThemeColor(theme[resolvedActiveColorKey]) ?? defaultRgba,
    [theme, resolvedActiveColorKey],
  );

  useEffect(() => {
    if (!isOpen) {
      setActiveColorKey(null);
      setInputMode("hex");
      setInputDraft(formatThemeInputValue(theme.color1, "hex"));
      suppressNextOverlayCloseRef.current = false;
    }
  }, [isOpen, theme]);

  useEffect(() => {
    return () => {
      if (suppressResetTimerRef.current != null) {
        window.clearTimeout(suppressResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setInputDraft(
      formatThemeInputValue(theme[resolvedActiveColorKey], inputMode),
    );
  }, [theme, inputMode, resolvedActiveColorKey]);

  useEffect(() => {
    if (!isOpen || activeColorKey == null) {
      return;
    }

    const pickerControls =
      pickerContainerRef.current?.querySelectorAll<HTMLElement>(
        ".react-colorful__interactive",
      ) ?? [];

    if (pickerControls.length < 3) {
      return;
    }

    pickerControls[0].setAttribute(
      "aria-label",
      translations.themeEditor.pickerColorLabel,
    );
    pickerControls[1].setAttribute(
      "aria-label",
      translations.themeEditor.pickerHueLabel,
    );
    pickerControls[2].setAttribute(
      "aria-label",
      translations.themeEditor.pickerOpacityLabel,
    );
  }, [activeColorKey, isOpen, translations]);

  if (mode === "hidden") {
    return null;
  }

  const isLocked = mode === "locked";
  const isFreemium = mode === "freemium";
  const canEditColors = mode === "premium";
  const showLayoutControl = isFreemium || onLayoutChange != null;
  const showDetailStep = canEditColors && activeColorKey != null;

  const updateThemeColor = (nextColor: string) => {
    saveTheme({
      ...theme,
      [resolvedActiveColorKey]: nextColor,
    });
  };

  const beginColorEdit = (colorKey: ThemeColorKey) => {
    setOriginalColorDraft(theme[colorKey]);
    setActiveColorKey(colorKey);
  };

  const revertColorEdit = () => {
    if (activeColorKey != null && originalColorDraft != null) {
      saveTheme({
        ...theme,
        [activeColorKey]: originalColorDraft,
      });
    }

    setActiveColorKey(null);
    setOriginalColorDraft(null);
    setInputMode("hex");
    setInputDraft(formatThemeInputValue(theme.color1, "hex"));
  };

  const confirmColorEdit = () => {
    setActiveColorKey(null);
    setOriginalColorDraft(null);
    setInputMode("hex");
    setInputDraft(formatThemeInputValue(theme.color1, "hex"));
  };

  const updateActiveColorFromRgba = (value: RgbaColor) => {
    const rgbaValue = formatRgbaString({
      r: value.r,
      g: value.g,
      b: value.b,
      a: value.a ?? 1,
    });
    const normalized = normalizeThemeStorageColor(rgbaValue);

    if (!normalized) {
      return;
    }

    updateThemeColor(normalized);
  };

  const closeEditor = () => {
    if (activeColorKey != null && originalColorDraft != null) {
      saveTheme({
        ...theme,
        [activeColorKey]: originalColorDraft,
      });
    }

    setActiveColorKey(null);
    setOriginalColorDraft(null);
    setInputMode("hex");
    setInputDraft(formatThemeInputValue(theme.color1, "hex"));
    suppressNextOverlayCloseRef.current = false;
    setIsOpen(false);
  };

  const suppressOverlayCloseUntilPointerClickSettles = () => {
    suppressNextOverlayCloseRef.current = true;

    if (suppressResetTimerRef.current != null) {
      window.clearTimeout(suppressResetTimerRef.current);
    }

    const resetAfterPointerUp = () => {
      window.removeEventListener("pointerup", resetAfterPointerUp);
      window.removeEventListener("pointercancel", resetAfterPointerUp);
      suppressResetTimerRef.current = window.setTimeout(() => {
        suppressNextOverlayCloseRef.current = false;
        suppressResetTimerRef.current = null;
      }, 0);
    };

    window.addEventListener("pointerup", resetAfterPointerUp);
    window.addEventListener("pointercancel", resetAfterPointerUp);
  };

  const settingsContents = (
    <>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-notion-black backdrop-blur">
        <Settings size={14} />
      </span>
      {(isLocked || isFreemium) && (
        <span
          data-theme-editor-settings-lock="true"
          className="absolute right-[-2px] top-[-2px] grid h-[17px] w-[17px] place-items-center rounded-full bg-white text-notion-black shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
        >
          <Lock size={9} className="block" color="red" />
        </span>
      )}
    </>
  );

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute bottom-1 right-1 z-20 transition",
          isLocked ? "opacity-100" : "opacity-0",
          !isLocked && !suspendHoverReveal && "group-hover:opacity-100",
          isOpen && "opacity-100",
          paletteButtonClassName,
        )}
      >
        {isLocked ? (
          <a
            href={purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "pointer-events-auto relative flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-[conic-gradient(from_180deg_at_50%_50%,_#ff8a8a,_#ffd36f,_#8fe3ff,_#d29bff,_#ff8a8a)] shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:scale-[1.02]",
              "ring-1 ring-black/10",
            )}
            aria-label={translations.themeEditor.unlockAriaLabel}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            {settingsContents}
          </a>
        ) : (
          <button
            type="button"
            className="pointer-events-auto relative flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-[conic-gradient(from_180deg_at_50%_50%,_#ff8a8a,_#ffd36f,_#8fe3ff,_#d29bff,_#ff8a8a)] shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:scale-[1.02]"
            aria-label={translations.themeEditor.openAriaLabel}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setActiveColorKey(null);
              setInputMode("hex");
              setInputDraft(formatThemeInputValue(theme.color1, "hex"));
              setIsOpen(true);
            }}
          >
            {settingsContents}
          </button>
        )}
      </div>

      {isOpen && (
        <div
          data-theme-editor-overlay="true"
          className="absolute inset-0 z-30 rounded-[inherit] bg-black/12 animate-in fade-in duration-200"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (suppressNextOverlayCloseRef.current) {
              suppressNextOverlayCloseRef.current = false;
              return;
            }
            closeEditor();
          }}
        >
          <div
            data-theme-editor-panel-shell="true"
            className={cn(
              "absolute bottom-1 right-1 origin-bottom-right animate-in fade-in zoom-in-95 slide-in-from-bottom-1 slide-in-from-right-1 duration-200 transition-[width,height,opacity,transform] ease-out",
              !showDetailStep
                ? "h-[254px] w-[190px] scale-100 opacity-100"
                : "h-[308px] w-[224px] scale-100 opacity-100",
            )}
            style={{
              maxWidth: "calc(100% - 8px)",
              maxHeight: "calc(100% - 8px)",
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              suppressNextOverlayCloseRef.current = false;
            }}
            onPointerDownCapture={() => {
              suppressOverlayCloseUntilPointerClickSettles();
            }}
          >
            {!showDetailStep && (
              <button
                data-theme-editor-close="true"
                type="button"
                className="absolute left-0 top-0 z-20 flex h-6 w-6 translate-x-[-50%] -translate-y-1/2 items-center justify-center rounded-full border border-red-200 bg-white/98 text-red-500 shadow-[0_5px_14px_rgba(0,0,0,0.14)]"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  closeEditor();
                }}
                aria-label={translations.popover.closeAriaLabel}
              >
                <X size={12} strokeWidth={2} />
              </button>
            )}
            <div
              data-theme-editor-panel="true"
              className="h-full w-full overflow-hidden overflow-y-scroll rounded-[12px] bg-white/98 p-[6px] text-notion-black shadow-[0_24px_70px_rgba(0,0,0,0.32),0_6px_18px_rgba(0,0,0,0.16)] ring-1 ring-black/10"
            >
              {!showDetailStep ? (
                <div className="grid h-full content-start gap-[6px] transition-opacity duration-150">
                  {showLayoutControl && (
                    <LayoutControl
                      layout={layout}
                      canEdit={canEditColors && onLayoutChange != null}
                      onLayoutChange={onLayoutChange}
                      purchaseUrl={purchaseUrl}
                      lockLabel={translations.themeEditor.unlockAriaLabel}
                      label={translations.themeEditor.layout}
                      squareLabel={translations.themeEditor.layoutSquare}
                      fullLabel={translations.themeEditor.layoutFull}
                    />
                  )}
                  <ThemeColorField
                    label={translations.themeEditor.color1}
                    colorValue={theme.color1}
                    onActivate={() => beginColorEdit("color1")}
                    variant={isFreemium ? "locked" : "editable"}
                    purchaseUrl={isFreemium ? purchaseUrl : undefined}
                    lockLabel={translations.themeEditor.unlockAriaLabel}
                  />
                  <ThemeColorField
                    label={translations.themeEditor.color2}
                    colorValue={theme.color2}
                    onActivate={() => beginColorEdit("color2")}
                    variant={isFreemium ? "locked" : "editable"}
                    purchaseUrl={isFreemium ? purchaseUrl : undefined}
                    lockLabel={translations.themeEditor.unlockAriaLabel}
                  />
                </div>
              ) : (
                <div className="grid h-full content-start gap-[8px] transition-opacity duration-150">
                  <div className="flex items-center gap-[4px]">
                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100"
                      aria-label={translations.themeEditor.backAriaLabel}
                      onClick={revertColorEdit}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="flex min-w-0 flex-1 items-center gap-[4px]">
                      <div className="flex h-9 min-w-0 flex-1 rounded-[8px] border border-black/10 bg-white/90 p-[2px]">
                        <button
                          type="button"
                          className={cn(
                            "h-full flex-1 rounded-[6px] px-[6px] py-[2px] text-xs font-medium transition",
                            inputMode === "hex"
                              ? "bg-notion-black text-white"
                              : "text-notion-black/70",
                          )}
                          onClick={() => setInputMode("hex")}
                        >
                          HEX
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "h-full flex-1 rounded-[6px] px-[6px] py-[2px] text-xs font-medium transition",
                            inputMode === "rgba"
                              ? "bg-notion-black text-white"
                              : "text-notion-black/70",
                          )}
                          onClick={() => setInputMode("rgba")}
                        >
                          RGBA
                        </button>
                      </div>
                    </div>
                    <button
                      data-theme-editor-confirm-color="true"
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-green-200 bg-green-50 text-green-600 transition hover:border-green-300 hover:bg-green-100"
                      aria-label={translations.themeEditor.save}
                      onClick={confirmColorEdit}
                    >
                      <Check size={16} />
                    </button>
                  </div>

                  <label className="grid gap-[2px]">
                    <input
                      value={inputDraft}
                      className="rounded-[8px] border border-black/10 bg-white px-[8px] py-[8px] text-sm"
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setInputDraft(nextValue);
                        const normalized =
                          normalizeThemeStorageColor(nextValue);

                        if (normalized) {
                          updateThemeColor(normalized);
                        }
                      }}
                    />
                  </label>

                  <div ref={pickerContainerRef} className="widget-color-picker">
                    <RgbaColorPicker
                      color={activeRgba}
                      onChange={updateActiveColorFromRgba}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
