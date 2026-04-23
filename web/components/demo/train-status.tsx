type TrainStatusProps = {
  step: number;
  numSteps: number;
  loss: number;
  evalLoss?: number;
  elapsed: number;
};

function Stat({
  label,
  indicator,
  children,
}: {
  label: string;
  indicator?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {indicator}
        {label}
      </span>
      {children}
    </div>
  );
}

export function TrainStatus({ step, numSteps, loss, evalLoss, elapsed }: TrainStatusProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border bg-muted/30 px-5 py-3.5">
      {/* Mobile row 1 left / Desktop col 1 */}
      <Stat label="Step">
        <span className="font-mono text-lg font-semibold tabular-nums leading-tight">
          {step.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {numSteps.toLocaleString()}
          </span>
        </span>
      </Stat>

      {/* Mobile row 1 right / Desktop col 4 */}
      <div className="md:order-4">
        <Stat label="Time">
          <span className="font-mono text-lg font-semibold tabular-nums leading-tight">
            {(elapsed / 1000).toFixed(1)}s
          </span>
        </Stat>
      </div>

      {/* Mobile row 2 left / Desktop col 2 */}
      <div className="md:order-2">
        <Stat
          label="Train loss"
          indicator={<span className="inline-block h-2 w-2 rounded-full bg-chart-1" />}
        >
          <span className="font-mono text-lg font-semibold tabular-nums leading-tight">
            {loss > 0 ? loss.toFixed(4) : "—"}
          </span>
        </Stat>
      </div>

      {/* Mobile row 2 right / Desktop col 3 */}
      <div className="md:order-3">
        <Stat
          label="Eval loss"
          indicator={<span className="inline-block h-2 w-2 rounded-full bg-chart-2" />}
        >
          <span className="font-mono text-lg font-semibold tabular-nums leading-tight">
            {evalLoss !== undefined && evalLoss > 0 ? evalLoss.toFixed(4) : "—"}
          </span>
        </Stat>
      </div>
    </div>
  );
}
