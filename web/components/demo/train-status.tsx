type TrainStatusProps = {
  step: number;
  numSteps: number;
  loss: number;
  elapsed: number;
  isTraining: boolean;
};

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

export function TrainStatus({
  step,
  numSteps,
  loss,
  elapsed,
  isTraining,
}: TrainStatusProps) {
  return (
    <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/30 px-5 py-3.5">
      <Stat label="Step">
        <span className="font-mono text-lg font-semibold tabular-nums leading-tight">
          {step.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {numSteps.toLocaleString()}
          </span>
        </span>
      </Stat>

      <Stat label={isTraining ? "Current loss" : "Final loss"}>
        <span className="font-mono text-lg font-semibold tabular-nums leading-tight">
          {loss > 0 ? loss.toFixed(4) : "—"}
        </span>
      </Stat>

      <Stat label="Time">
        <span className="font-mono text-lg font-semibold tabular-nums leading-tight">
          {(elapsed / 1000).toFixed(1)}s
        </span>
      </Stat>
    </div>
  );
}
