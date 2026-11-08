import { cn } from '@/lib/utils';

type EquipmentStatus = 'AVAILABLE' | 'BORROWED' | 'DAMAGED' | 'LOST' | 'RETIRED';
type EquipmentCondition = 'GOOD' | 'FAIR' | 'DAMAGED';
type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'RETURNED';
type MemberStatus = 'ACTIVE' | 'INACTIVE';

const statusColors: Record<EquipmentStatus, string> = {
  AVAILABLE:
    'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  BORROWED:
    'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  DAMAGED:
    'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  LOST: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  RETIRED:
    'bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600'
};

const conditionColors: Record<EquipmentCondition, string> = {
  GOOD: 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  FAIR: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  DAMAGED:
    'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
};

const loanStatusColors: Record<LoanStatus, string> = {
  ACTIVE:
    'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  OVERDUE:
    'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  RETURNED:
    'bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600'
};

const memberStatusColors: Record<MemberStatus, string> = {
  ACTIVE:
    'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  INACTIVE:
    'bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600'
};

const baseClass =
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap';

export function StatusBadge({
  status,
  className
}: {
  status: EquipmentStatus;
  className?: string;
}) {
  return (
    <span className={cn(baseClass, statusColors[status], className)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function ConditionBadge({
  condition,
  className
}: {
  condition: EquipmentCondition;
  className?: string;
}) {
  return (
    <span className={cn(baseClass, conditionColors[condition], className)}>
      {condition.charAt(0) + condition.slice(1).toLowerCase()}
    </span>
  );
}

export function LoanStatusBadge({ status, className }: { status: LoanStatus; className?: string }) {
  return (
    <span className={cn(baseClass, loanStatusColors[status], className)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
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
    <span className={cn(baseClass, memberStatusColors[status], className)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function RoleBadge({
  role,
  className
}: {
  role: 'ADMIN' | 'LAB_ASSISTANT' | 'EXECUTIVE';
  className?: string;
}) {
  const roleColors = {
    ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    LAB_ASSISTANT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    EXECUTIVE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
  };
  const roleLabels = {
    ADMIN: 'Admin',
    LAB_ASSISTANT: 'Lab Assistant',
    EXECUTIVE: 'Executive'
  };
  return <span className={cn(baseClass, roleColors[role], className)}>{roleLabels[role]}</span>;
}
