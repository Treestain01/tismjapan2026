interface SkeletonLoaderProps {
  className?: string;
}

export function SkeletonLoader({ className = '' }: SkeletonLoaderProps) {
  return (
    <div
      className={`animate-pulse rounded bg-surface/60 dark:bg-white/10 ${className}`}
      aria-hidden="true"
    />
  );
}
