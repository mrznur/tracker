'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { Icons } from '@/components/icons';
import { createLoanAction } from '@/app/actions/loan.actions';
import { lookupEquipmentByTagAction } from '@/app/actions/equipment.actions';
import { cn } from '@/lib/utils';

interface MemberOption {
  id: string;
  studentId: string;
  fullName: string;
  status: string;
}

interface EquipmentOption {
  id: string;
  assetTag: string;
  name: string;
  status: string;
}

interface NewLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: MemberOption[];
  equipment: EquipmentOption[];
}

const PRESET_DAYS = [
  { label: '3 days', value: 3 },
  { label: '1 week', value: 7 },
  { label: '2 weeks', value: 14 }
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function NewLoanDialog({ open, onOpenChange, members, equipment }: NewLoanDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);

  // Quick fill by asset tag
  const [quickTag, setQuickTag] = React.useState('');
  const [quickResult, setQuickResult] = React.useState<{
    found: boolean;
    available: boolean;
    name: string;
    borrowerName?: string;
    item?: EquipmentOption;
  } | null>(null);

  // Member search
  const [memberSearch, setMemberSearch] = React.useState('');
  const [selectedMember, setSelectedMember] = React.useState<MemberOption | null>(null);
  const [memberDropdown, setMemberDropdown] = React.useState(false);

  // Equipment search
  const [equipSearch, setEquipSearch] = React.useState('');
  const [selectedEquip, setSelectedEquip] = React.useState<EquipmentOption | null>(null);
  const [equipDropdown, setEquipDropdown] = React.useState(false);

  // Due date
  const [presetDays, setPresetDays] = React.useState<number>(7);
  const [customDate, setCustomDate] = React.useState('');
  const [useCustom, setUseCustom] = React.useState(false);

  const dueDateValue = useCustom ? customDate : addDays(presetDays);

  const availableEquipment = equipment.filter((e) => e.status === 'AVAILABLE');

  const filteredMembers = members
    .filter((m) => m.status === 'ACTIVE')
    .filter((m) => {
      if (!memberSearch) return true;
      const q = memberSearch.toLowerCase();
      return m.fullName.toLowerCase().includes(q) || m.studentId.toLowerCase().includes(q);
    })
    .slice(0, 10);

  const filteredEquip = availableEquipment
    .filter((e) => {
      if (!equipSearch) return true;
      const q = equipSearch.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.assetTag.toLowerCase().includes(q);
    })
    .slice(0, 10);

  // Auto-select by exact asset tag
  React.useEffect(() => {
    if (equipSearch) {
      const exact = availableEquipment.find(
        (e) => e.assetTag.toLowerCase() === equipSearch.toLowerCase()
      );
      if (exact) {
        setSelectedEquip(exact);
        setEquipSearch(exact.name);
        setEquipDropdown(false);
      }
    }
  }, [equipSearch, availableEquipment]);

  function resetForm() {
    setMemberSearch('');
    setSelectedMember(null);
    setEquipSearch('');
    setSelectedEquip(null);
    setPresetDays(7);
    setCustomDate('');
    setUseCustom(false);
    setError(null);
    setWarnings([]);
    setQuickTag('');
    setQuickResult(null);
  }

  async function handleQuickFill() {
    const tag = quickTag.trim();
    if (!tag) return;

    const result = await lookupEquipmentByTagAction(tag);

    if (!result.found) {
      setQuickResult({ found: false, available: false, name: '' });
      return;
    }

    if (result.available) {
      // Try to find in the passed equipment list first, else create a minimal EquipmentOption
      const match =
        equipment.find((e) => e.assetTag.toLowerCase() === tag.toLowerCase()) ??
        ({ id: result.id, assetTag: result.assetTag, name: result.name, status: 'AVAILABLE' } as EquipmentOption);
      setSelectedEquip(match);
      setEquipSearch('');
      setEquipDropdown(false);
      setQuickResult({ found: true, available: true, name: result.name, item: match });
    } else {
      setQuickResult({
        found: true,
        available: false,
        name: result.name,
        borrowerName: result.borrowerName
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setWarnings([]);

    if (!selectedMember) {
      setError('Please select a member.');
      return;
    }
    if (!selectedEquip) {
      setError('Please select an equipment item.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set('memberId', selectedMember.id);
    formData.set('equipmentId', selectedEquip.id);
    formData.set('dueDate', dueDateValue);

    setIsPending(true);
    try {
      const result = await createLoanAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }

      // Check for warnings in the result
      const data = result.data as { warnings?: Array<{ message: string }> };
      if (data?.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings.map((w) => w.message));
      }

      router.refresh();
      resetForm();
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>New Loan</DialogTitle>
          <DialogDescription>Issue equipment to a member.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {/* Quick fill by asset tag */}
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='nl-quick-tag'>
              Quick fill by asset tag{' '}
              <span className='text-xs text-muted-foreground font-normal'>(optional)</span>
            </Label>
            <div className='flex gap-2'>
              <Input
                id='nl-quick-tag'
                placeholder='Type asset tag (e.g. RC-0017) and press Enter'
                value={quickTag}
                onChange={(e) => {
                  setQuickTag(e.target.value);
                  setQuickResult(null);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    await handleQuickFill();
                  }
                }}
                className='font-mono'
                autoComplete='off'
              />
              <Button type='button' variant='outline' size='sm' onClick={handleQuickFill}>
                Fill
              </Button>
            </div>
            {quickResult && (
              <p
                className={cn(
                  'text-xs font-medium',
                  quickResult.available
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                )}
              >
                {quickResult.available
                  ? `${quickTag} · ${quickResult.name} · Available`
                  : quickResult.found
                    ? `${quickTag} is currently Borrowed by ${quickResult.borrowerName ?? 'someone'}`
                    : 'Asset tag not found'}
              </p>
            )}
          </div>

          {/* Member search */}
          <div className='flex flex-col gap-1.5 relative'>
            <Label htmlFor='nl-member'>
              Member <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='nl-member'
              placeholder='Search by name or student ID…'
              value={
                selectedMember
                  ? `${selectedMember.fullName} (${selectedMember.studentId})`
                  : memberSearch
              }
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setSelectedMember(null);
                setMemberDropdown(true);
              }}
              onFocus={() => setMemberDropdown(true)}
              autoComplete='off'
            />
            {memberDropdown && filteredMembers.length > 0 && !selectedMember && (
              <div className='absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-md max-h-48 overflow-y-auto'>
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type='button'
                    className='w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground'
                    onMouseDown={() => {
                      setSelectedMember(m);
                      setMemberSearch('');
                      setMemberDropdown(false);
                    }}
                  >
                    <span className='font-medium'>{m.fullName}</span>{' '}
                    <span className='text-muted-foreground text-xs'>({m.studentId})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Equipment search */}
          <div className='flex flex-col gap-1.5 relative'>
            <Label htmlFor='nl-equip'>
              Equipment <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='nl-equip'
              placeholder='Search by name or asset tag (e.g. RC-0001)…'
              value={
                selectedEquip ? `${selectedEquip.name} (${selectedEquip.assetTag})` : equipSearch
              }
              onChange={(e) => {
                setEquipSearch(e.target.value);
                setSelectedEquip(null);
                setEquipDropdown(true);
              }}
              onFocus={() => setEquipDropdown(true)}
              autoComplete='off'
            />
            {equipDropdown && filteredEquip.length > 0 && !selectedEquip && (
              <div className='absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-md max-h-48 overflow-y-auto'>
                {filteredEquip.map((e) => (
                  <button
                    key={e.id}
                    type='button'
                    className='w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground'
                    onMouseDown={() => {
                      setSelectedEquip(e);
                      setEquipSearch('');
                      setEquipDropdown(false);
                    }}
                  >
                    <span className='font-medium'>{e.name}</span>{' '}
                    <span className='text-muted-foreground text-xs font-mono'>({e.assetTag})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due date */}
          <div className='flex flex-col gap-1.5'>
            <Label>Due Date</Label>
            <div className='flex flex-wrap gap-2'>
              {PRESET_DAYS.map((preset) => (
                <button
                  key={preset.value}
                  type='button'
                  className={cn(
                    'px-3 py-1 text-xs rounded-md border transition-colors',
                    !useCustom && presetDays === preset.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  )}
                  onClick={() => {
                    setPresetDays(preset.value);
                    setUseCustom(false);
                  }}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type='button'
                className={cn(
                  'px-3 py-1 text-xs rounded-md border transition-colors',
                  useCustom
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                )}
                onClick={() => setUseCustom(true)}
              >
                Custom
              </button>
            </div>
            {useCustom ? (
              <Input
                type='date'
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className='w-40'
              />
            ) : (
              <p className='text-xs text-muted-foreground'>Due: {dueDateValue}</p>
            )}
          </div>

          {/* Purpose */}
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='nl-purpose'>
              Purpose <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='nl-purpose'
              name='purpose'
              placeholder='e.g. Competition project, lab assignment'
              required
            />
          </div>

          {/* Notes */}
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='nl-notes'>Notes</Label>
            <Input id='nl-notes' name='notes' placeholder='Optional' />
          </div>

          {/* Warnings */}
          {warnings.map((w, i) => (
            <div
              key={i}
              className='flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-2'
            >
              <Icons.warning className='size-4 mt-0.5 shrink-0' />
              {w}
            </div>
          ))}

          {error && (
            <p className='text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2'>
              {error}
            </p>
          )}

          <DialogFooter showCloseButton>
            <LoadingButton type='submit' loading={isPending}>
              Issue Loan
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
