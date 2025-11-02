"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "../lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" }

/* --------------------------------
 * Context + hook
 * ------------------------------ */
const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

/* --------------------------------
 * Container
 * ------------------------------ */
const ChartContainer = React.forwardRef(function ChartContainer(
  { id, className, children, config = {}, ...props },
  ref
) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs",
          // Styled Recharts internals:
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-layer]:outline-none",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border",
          "[&_.recharts-radial-bar-background-sector]:fill-muted",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
          "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-sector]:outline-none",
          "[&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

/* --------------------------------
 * Dynamic theme CSS variables
 * ------------------------------ */
function ChartStyle({ id, config }) {
  const colorConfig = Object.entries(config || {}).filter(
    ([, cfg]) => (cfg && (cfg.theme || cfg.color))
  )

  if (!colorConfig.length) return null

  const css = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const lines = colorConfig
        .map(([key, itemConfig]) => {
          const color =
            (itemConfig.theme && itemConfig.theme[theme]) ||
            itemConfig.color
          return color ? `  --color-${key}: ${color};` : null
        })
        .filter(Boolean)
        .join("\n")

      if (!lines) return ""
      return `${prefix} [data-chart=${id}] {\n${lines}\n}`
    })
    .filter(Boolean)
    .join("\n")

  if (!css) return null

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

/* --------------------------------
 * Tooltip + content
 * ------------------------------ */
const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef(function ChartTooltipContent(
  {
    active,
    payload,
    className,
    indicator = "dot", // "dot" | "line" | "dashed"
    hideLabel = false,
    hideIndicator = false,
    label,
    labelFormatter,
    labelClassName,
    formatter,
    color,
    nameKey,
    labelKey,
    ...props
  },
  ref
) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemCfg = getPayloadConfigFromPayload(config, item, key)

    const value =
      !labelKey && typeof label === "string"
        ? (config[label]?.label || label)
        : itemCfg?.label

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) return null
    return <div className={cn("font-medium", labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) return null

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
      {...props}
    >
      {!nestLabel ? tooltipLabel : null}

      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`
          const itemCfg = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color || item.payload?.fill || item.color

          return (
            <div
              key={item.dataKey ?? `${key}-${index}`}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2",
                "[&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {!itemCfg?.icon && !hideIndicator ? (
                    <div
                      className={cn(
                        "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                        {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-[1.5px] border-dashed bg-transparent":
                            indicator === "dashed",
                          "my-0.5": nestLabel && indicator === "dashed",
                        }
                      )}
                      style={
                        {
                          "--color-bg": indicatorColor,
                          "--color-border": indicatorColor,
                        }
                      }
                    />
                  ) : itemCfg?.icon ? (
                    <itemCfg.icon />
                  ) : null}

                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemCfg?.label || item.name}
                      </span>
                    </div>
                    {item.value !== undefined && item.value !== null && (
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {Number(item.value).toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

/* --------------------------------
 * Legend + content
 * ------------------------------ */
const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef(function ChartLegendContent(
  { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, ...props },
  ref
) {
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
      {...props}
    >
      {payload.map((item, i) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemCfg = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={`${item.value ?? key}-${i}`}
            className={cn("flex items-center gap-1.5", "[&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}
          >
            {itemCfg?.icon && !hideIcon ? (
              <itemCfg.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
            )}
            {itemCfg?.label}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

/* --------------------------------
 * Helpers
 * ------------------------------ */
function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) return undefined

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey = key

  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key]
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key]
  }

  return configLabelKey in (config || {})
    ? config[configLabelKey]
    : config?.[key]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
