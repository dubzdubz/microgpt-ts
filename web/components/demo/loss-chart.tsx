import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type LossPoint = { step: number; loss: number };

const MAX_CHART_POINTS = 200;

function downsample(points: LossPoint[]): LossPoint[] {
  if (points.length <= MAX_CHART_POINTS) return points;
  const every = Math.ceil(points.length / MAX_CHART_POINTS);
  const result: LossPoint[] = [];
  for (let i = 0; i < points.length; i += every) result.push(points[i]);
  if (result[result.length - 1] !== points[points.length - 1])
    result.push(points[points.length - 1]);
  return result;
}

const lossChartConfig = {
  loss: { label: "Loss", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function LossChart({
  data,
  numSteps,
}: {
  data: LossPoint[];
  numSteps: number;
}) {
  const display = downsample(data);
  const yMax = data.length > 0 ? Math.ceil(data[0].loss) : 4;
  return (
    <Card size="sm" className="rounded-lg">
      <CardContent className="pt-4">
        <ChartContainer config={lossChartConfig} className="h-56 w-full">
          <AreaChart data={display} accessibilityLayer>
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
                  hideIndicator
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as LossPoint | undefined;
                    return p ? `Step ${p.step}` : "";
                  }}
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      {(value as number).toFixed(4)}
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="loss"
              type="monotone"
              stroke="var(--color-loss)"
              strokeWidth={2}
              fill="url(#lossGradient)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
