import { cn } from '@/lib/utils';

type EquipmentStatus = 'AVAILABLE' | 'BORROWED' | 'DAMAGED' | 'LOST' | 'RETIRED';
type EquipmentCondition = 'GOOD' | 'FAIR' | 'DAMAGED';
type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'RETURNED';
type MemberStatus = 'ACTIVE' | 'INACTIVE';
type Role = 'ADMIN' | 'LAB_ASSISTANT' | 'EXECUTIVE';

const statusBar: Record<EquipmentStatus, string> = {
  AVAILABLE: 'bg-emerald-500',
  BORROWED: 'bg-amber-500',
  DAMAGED: 'bg-red-400',
  LOST: 'bg-red-500',
  RETIRED: 'bg-gray-400'
};

const conditionBar: Record<EquipmentCondition, string> = {
  GOOD: 'bg-emerald-500',
  FAIR: 'bg-sky-500',
  DAMAGED: 'bg-red-400'
};

const loanStatusBar: Record<LoanStatus, string> = {
  ACTIVE: 'bg-blue-500',
  OVERDUE: 'bg-red-500',
  RETURNED: 'bg-gray-400'
};

const memberStatusBar: Record<MemberStatus, string> = {
  ACTIVE: 'bg-emerald-500',
  INACTIVE: 'bg-gray-400'
};

const roleBar: Record<Role, string> = {
  ADMIN: 'bg-purple-500',
  LAB_ASSISTANT: 'bg-blue-500',
  EXECUTIVE: 'bg-indigo-500'
};

const roleLabels: Record<Role, string> = {
  ADMIN: 'Admin',
  LAB_ASSISTANT: 'Lab Assistant',
  EXECUTIVE: 'Executive'
};

/**
 * Inventory-label style tag: monospace, uppercase, square corners,
 * with a solid colored bar on the left edge (like a shelf label).
 * Used by every badge in this file so they all look consistent.
 */
function Tag({
  label,
  barClass,
  muted = false,
  className
}: {
  label: string;
  barClass: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-[3px] border bg-muted/40 font-mono text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase',
        className
      )}
    >
      <span className={cn('w-1 shrink-0', barClass)} />
      <span className={cn('px-2 py-0.5', muted ? 'text-muted-foreground' : 'text-foreground/80')}>
        {label}
      </span>
    </span>
  );
}

export function StatusBadge({
  status,
  className
}: {
  status: EquipmentStatus;
  className?: string;
}) {
  return (
    <Tag
      label={status}
      barClass={statusBar[status]}
      muted={status === 'RETIRED'}
      className={className}
    />
  );
}

export function ConditionBadge({
  condition,
  className
}: {
  condition: EquipmentCondition;
  className?: string;
}) {
  return <Tag label={condition} barClass={conditionBar[condition]} className={className} />;
}

export function LoanStatusBadge({ status, className }: { status: LoanStatus; className?: string }) {
  return (
    <Tag
      label={status}
      barClass={loanStatusBar[status]}
      muted={status === 'RETURNED'}
      className={className}
    />
  );
}

export function MemberStatusBadge({
  status,
  className
}: {
  status: MemberStatus;
  className?: string;
}) {
  return (
    <Tag
      label={status}
      barClass={memberStatusBar[status]}
      muted={status === 'INACTIVE'}
      className={className}
    />
  );
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return <Tag label={roleLabels[role]} barClass={roleBar[role]} className={className} />;
}