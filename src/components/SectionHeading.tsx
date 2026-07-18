import CommandHeading from '@/components/CommandHeading'

export default function SectionHeading({
  command,
  kicker,
}: {
  command: string
  kicker?: string
}) {
  return (
    <div className="mb-10">
      <CommandHeading command={command} kicker={kicker} />
    </div>
  )
}
