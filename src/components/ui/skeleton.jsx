import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("rounded-md bg-muted/50 ", className)}
      {...props} />
  );
}

/**
 * Card skeleton for list loading states
 */
function CardSkeleton({ showAvatar = false }) {
  return (
    <div className="glass-card card-premium p-5 rounded-2xl space-y-4">
      <div className="flex items-center gap-4">
        {showAvatar && <Skeleton className="h-14 w-14 rounded-2xl" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Stats card skeleton
 */
function StatCardSkeleton() {
  return (
    <div className="glass-card card-premium p-5 rounded-2xl space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

/**
 * Table skeleton
 */
function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card card-premium p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-5 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton, CardSkeleton, StatCardSkeleton, TableSkeleton }
