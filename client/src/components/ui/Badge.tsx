interface BadgeProps {
  label: string;
  colour?: string;
  variant?: 'category' | 'day';
}

export function Badge({ label, colour, variant = 'category' }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: colour ?? '#6B7280' }}
    >
      {variant === 'day' ? `Day ${label}` : label}
    </span>
  );
}
