interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-6">
        <span className="text-3xl" role="img" aria-hidden="true">&#x1F5FE;</span>
      </div>
      <h2 className="text-xl font-semibold text-text-base mb-2">{title}</h2>
      <p className="text-muted max-w-md">{description}</p>
    </div>
  );
}
