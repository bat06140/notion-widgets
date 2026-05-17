import { useEffect, useRef } from "react";
import { css } from "@emotion/react";
import { AutosizeText } from "./AutosizeText.js";
import { SquareContainer } from "./SquareContainer.js";
import { cn } from "../lib/utils.js";
import { WidgetLayout } from "../lib/view-config.js";
import { WidgetFooter } from "./WidgetFooter.js";
import { WidgetThemeEditor } from "./WidgetThemeEditor.js";
import { useWidgetTheme } from "../hook/useWidgetTheme.js";
import { DEFAULT_WIDGET_THEME } from "../lib/widget-theme.js";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  getThemeEditorMode,
  shouldShowWidgetBranding,
} from "../lib/widget-access.js";
import { getBrowserLocale, getTranslationSet } from "../lib/locale.js";

const ClickIndicator = ({
  fill,
  width,
  height,
}: {
  fill: string;
  width: number;
  height: number;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    width={width}
    height={height}
    fill={fill}
    aria-hidden="true"
  >
    <path d="M516-82q-9 2-18 2h-18q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480v18q0 9-2 18l-78-24v-12q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93h12l24 78Zm305 22L650-231 600-80 480-480l400 120-151 50 171 171-79 79Z" />
  </svg>
);

type Props = {
  textContent: string;
  showPop: boolean;
  accessGranted?: boolean;
  allowThemeEditor?: boolean;
  showBranding?: boolean;
  textFontScale?: number;
  onPopTrigger: (event: React.MouseEvent) => void;
  onClickOutside: () => void;
  children: string | JSX.Element | JSX.Element[];
  layout?: WidgetLayout;
  purchaseUrl?: string;
  onLayoutChange?: (layout: WidgetLayout) => void;
};

export const CenteredPopover = ({
  textContent,
  showPop,
  accessGranted = false,
  allowThemeEditor = true,
  showBranding,
  textFontScale = 0.94,
  onPopTrigger,
  onClickOutside,
  children,
  layout = "full",
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
  onLayoutChange,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useWidgetTheme();
  const effectiveTheme = accessGranted ? theme : DEFAULT_WIDGET_THEME;
  const editorMode = getThemeEditorMode(accessGranted, allowThemeEditor);
  const shouldRenderBranding = shouldShowWidgetBranding(
    accessGranted,
    showBranding
  );
  const locale = getBrowserLocale();
  const translations = getTranslationSet(locale);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClickOutside();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClickOutside]);

  return (
    <SquareContainer
      ref={containerRef}
      layout={layout}
      className="group relative w-full"
    >
      <WidgetThemeEditor
        mode={editorMode}
        purchaseUrl={purchaseUrl}
        suspendHoverReveal={showPop}
        layout={layout}
        onLayoutChange={onLayoutChange}
      />
      <div className="flex h-full w-full flex-col gap-[2px]">
        <div
          className={cn(
            "relative min-h-0 flex-1 overflow-visible rounded-[8px] bg-notion-black",
            layout === "full" && "rounded-[8px]"
          )}
          style={{ backgroundColor: effectiveTheme.color1 }}
          onClick={onPopTrigger}
        >
          <AutosizeText
            overrideTw="px-6 font-bold tracking-normal"
            overrideCss={css`
              color: ${effectiveTheme.color2};
            `}
            heightRatio={layout === "full" ? 0.58 : 0.64}
            fontScale={textFontScale}
          >
            {textContent}
          </AutosizeText>

          <div className="pointer-events-none absolute bottom-4 left-4 z-10 opacity-90">
            <ClickIndicator
              fill={effectiveTheme.color2}
              width={layout === "full" ? 40 : 30}
              height={layout === "full" ? 40 : 30}
            />
          </div>

          {showPop && (
            <div
              className={cn(
                "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
                layout === "full"
                  ? "h-[82%] w-[88%]"
                  : "h-4/5 w-4/5"
              )}
            >
              <button
                type="button"
                className="absolute right-0 top-0 z-20 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xl leading-none shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
                style={{
                  backgroundColor: effectiveTheme.color2,
                  color: effectiveTheme.color1,
                  borderColor: effectiveTheme.color1,
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onClickOutside();
                }}
                aria-label={translations.popover.closeAriaLabel}
              >
                ×
              </button>
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[8px] border border-gray-300 bg-white shadow-lg">
                {children}
              </div>
            </div>
          )}
        </div>

        {shouldRenderBranding && (
          <WidgetFooter
            theme={effectiveTheme}
            onClick={(event) => {
              event.stopPropagation();
            }}
          />
        )}
      </div>
    </SquareContainer>
  );
};
