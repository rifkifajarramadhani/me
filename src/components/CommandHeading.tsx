export default function CommandHeading({
  command,
  kicker,
  className,
}: {
  command: string
  kicker?: string
  className?: string
}) {
  return (
    <div className={className}>
      {kicker && (
        <p className="mb-2 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-subtle">
          <span className="text-prompt">[</span>
          {kicker}
          <span className="text-prompt">]</span>
        </p>
      )}
      <h2 className="animate-rise-in text-2xl font-bold tracking-[-0.03em] text-ink motion-reduce:animate-none sm:text-3xl">
        <span className="mr-[0.4ch] text-prompt">$</span>
        {command}
        <span className="ml-[0.15ch] inline-block h-[1.05em] w-[0.55ch] translate-y-[0.16em] animate-command-caret bg-primary motion-reduce:animate-none" />
      </h2>
    </div>
  )
}
