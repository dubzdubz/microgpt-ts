import { motion } from "motion/react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type LossPoint = { step: number; loss: number; evalLoss?: number };

const lossChartConfig = {
  loss: { label: "Train", color: "var(--chart-1)" },
  evalLoss: { label: "Eval", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function LossChart({
  data,
  numSteps,
  isTraining,
}: {
  data: LossPoint[];
  numSteps: number;
  isTraining: boolean;
}) {
  const yMax = data.length > 0 ? Math.ceil(data[0].loss) : 4;
  const hasEval = data.some((p) => p.evalLoss !== undefined);

  return (
    <Card size="sm" className="rounded-lg">
      <CardContent className="pt-4">
        <ChartContainer config={lossChartConfig} className="h-56 w-full">
          <AreaChart data={data} accessibilityLayer>
            <defs>
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-loss)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-loss)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="step"
              type="number"
              domain={[0, numSteps]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
              }
            />
            <YAxis
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, yMax]}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as LossPoint | undefined;
                    return p ? `Step ${p.step}` : "";
                  }}
                />
              }
            />
            <Area
              dataKey="loss"
              type="monotone"
              stroke="var(--color-loss)"
              strokeWidth={2}
              fill="url(#lossGradient)"
              isAnimationActive={!isTraining}
            />
            {hasEval && (
              <Area
                type={!isTraining ? "monotone" : undefined}
                dataKey="evalLoss"
                stroke={!isTraining ? "var(--color-evalLoss)" : "none"}
                strokeWidth={!isTraining ? 2 : 0}
                fill="none"
                dot={(p: Record<string, unknown>) => {
                  const { cx, cy, payload } = p as {
                    cx: number;
                    cy: number;
                    payload: LossPoint;
                  };
                  if (payload.evalLoss === undefined)
                    return <g key={payload.step} />;
                  return (
                    <motion.circle
                      key={payload.step}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="var(--color-evalLoss)"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{ transformOrigin: `${cx}px ${cy}px` }}
                    />
                  );
                }}
                connectNulls
                isAnimationActive={!isTraining}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
