/**
 * Tests for the loan service layer.
 * Cases covered:
 *   1. Loan AVAILABLE item → item becomes BORROWED
 *   2. Loan the same item again → rejected with clear message
 *   3a. Return as GOOD → item becomes AVAILABLE
 *   3b. Return as DAMAGED → item becomes DAMAGED
 *   3c. Return as LOST → item becomes LOST
 *   4. Return an already-returned loan → fails safely
 *   5. Overdue logic — due yesterday appears in overdue list; due today does not
 *   6. Retired / lost / damaged items cannot be loaned; inactive members cannot borrow
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/server/db';
import { createLoan, returnLoan, getLoanList } from '@/server/services/loan.service';
import { seedCategory, seedEquipment, seedMember, seedUser } from './helpers/seed';
import { overdueWhereClause, getTodayInAppTimezone } from '@/server/timezone';

// ─── Shared test fixtures ────────────────────────────────────────────────────

let categoryId: string;
let issuedByUserId: string;

beforeEach(async () => {
  const category = await seedCategory({ name: `Cat-${Date.now()}` });
  categoryId = category.id;
  const user = await seedUser();
  issuedByUserId = user.id;
});

// ─── Case 1 & 2: Creating loans ───────────────────────────────────────────────

describe('createLoan', () => {
  it('case 1: loaning an AVAILABLE item sets its status to BORROWED', async () => {
    const equipment = await seedEquipment(categoryId, { status: 'AVAILABLE' });
    const member = await seedMember();

    const result = await createLoan({
      equipmentId: equipment.id,
      memberId: member.id,
      issuedByUserId,
      purpose: 'Project work'
    });

    expect(result.loan).toBeTruthy();

    const updated = await prisma.equipment.findUnique({ where: { id: equipment.id } });
    expect(updated?.status).toBe('BORROWED');
  });

  it('case 2: trying to loan the same item again is rejected with a clear message', async () => {
    const equipment = await seedEquipment(categoryId, { status: 'AVAILABLE' });
    const member1 = await seedMember();
    const member2 = await seedMember();

    // First loan succeeds
    await createLoan({
      equipmentId: equipment.id,
      memberId: member1.id,
      issuedByUserId,
      purpose: 'First loan'
    });

    // Second loan on the same item should throw
    await expect(
      createLoan({
        equipmentId: equipment.id,
        memberId: member2.id,
        issuedByUserId,
        purpose: 'Second loan'
      })
    ).rejects.toThrow(/already borrowed|not available/i);
  });

  it('case 6a: DAMAGED item cannot be loaned', async () => {
    const equipment = await seedEquipment(categoryId, { status: 'DAMAGED' });
    const member = await seedMember();

    await expect(
      createLoan({ equipmentId: equipment.id, memberId: member.id, issuedByUserId, purpose: 'X' })
    ).rejects.toThrow(/damaged/i);
  });

  it('case 6b: LOST item cannot be loaned', async () => {
    const equipment = await seedEquipment(categoryId, { status: 'LOST' });
    const member = await seedMember();

    await expect(
      createLoan({ equipmentId: equipment.id, memberId: member.id, issuedByUserId, purpose: 'X' })
    ).rejects.toThrow(/lost/i);
  });

  it('case 6c: RETIRED item cannot be loaned', async () => {
    const equipment = await seedEquipment(categoryId, { status: 'RETIRED' });
    const member = await seedMember();

    await expect(
      createLoan({ equipmentId: equipment.id, memberId: member.id, issuedByUserId, purpose: 'X' })
    ).rejects.toThrow(/retired/i);
  });

  it('case 6d: inactive member cannot borrow', async () => {
    const equipment = await seedEquipment(categoryId, { status: 'AVAILABLE' });
    const member = await seedMember({ status: 'INACTIVE' });

    await expect(
      createLoan({ equipmentId: equipment.id, memberId: member.id, issuedByUserId, purpose: 'X' })
    ).rejects.toThrow(/inactive/i);
  });
});

// ─── Cases 3 & 4: Returning loans ────────────────────────────────────────────

describe('returnLoan', () => {
  async function createActiveLoan(status = 'AVAILABLE') {
    const equipment = await seedEquipment(categoryId, { status });
    const member = await seedMember();
    const { loan } = await createLoan({
      equipmentId: equipment.id,
      memberId: member.id,
      issuedByUserId,
      purpose: 'Test'
    });
    return { loan: loan as { id: string; equipmentId: string }, member };
  }

  it('case 3a: returning as GOOD makes item AVAILABLE', async () => {
    const { loan } = await createActiveLoan();

    await returnLoan({ loanId: loan.id, returnedToUserId: issuedByUserId, returnCondition: 'GOOD' });

    const equipment = await prisma.equipment.findUnique({ where: { id: loan.equipmentId } });
    expect(equipment?.status).toBe('AVAILABLE');
  });

  it('case 3b: returning as DAMAGED makes item DAMAGED', async () => {
    const { loan } = await createActiveLoan();

    await returnLoan({
      loanId: loan.id,
      returnedToUserId: issuedByUserId,
      returnCondition: 'DAMAGED'
    });

    const equipment = await prisma.equipment.findUnique({ where: { id: loan.equipmentId } });
    expect(equipment?.status).toBe('DAMAGED');
  });

  it('case 3c: returning as LOST makes item LOST', async () => {
    const { loan } = await createActiveLoan();

    await returnLoan({ loanId: loan.id, returnedToUserId: issuedByUserId, returnCondition: 'LOST' });

    const equipment = await prisma.equipment.findUnique({ where: { id: loan.equipmentId } });
    expect(equipment?.status).toBe('LOST');
  });

  it('case 4: returning an already-returned loan fails safely', async () => {
    const { loan } = await createActiveLoan();

    // First return succeeds
    await returnLoan({ loanId: loan.id, returnedToUserId: issuedByUserId, returnCondition: 'GOOD' });

    // Second return on the same loan should throw
    await expect(
      returnLoan({ loanId: loan.id, returnedToUserId: issuedByUserId, returnCondition: 'GOOD' })
    ).rejects.toThrow(/already been returned/i);
  });
});

// ─── Case 5: Overdue logic ────────────────────────────────────────────────────

describe('overdue logic', () => {
  it('case 5a: loan due yesterday appears in the overdue list', async () => {
    const equipment = await seedEquipment(categoryId, { status: 'AVAILABLE' });
    const member = await seedMember();

    // Create a loan with a due date in the past
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const { loan } = await createLoan({
      equipmentId: equipment.id,
      memberId: member.id,
      issuedByUserId,
      purpose: 'Overdue test',
      // Pass an explicit past due date — we set it directly in DB to bypass service validation
      dueDate: new Date(Date.now() + 86400 * 1000 * 10) // service needs future date; adjust below
    });

    // Back-date the loan directly in DB to simulate it being overdue
    await prisma.loan.update({
      where: { id: (loan as { id: string }).id },
      data: { dueDate: yesterday }
    });

    const { items } = await getLoanList({ tab: 'overdue' });
    const loanIds = (items as Array<{ id: string }>).map((l) => l.id);
    expect(loanIds).toContain((loan as { id: string }).id);
  });

  it('case 5b: loan due today does NOT appear in the overdue list', async () => {
    const equipment = await seedEquipment(categoryId, { status: 'AVAILABLE' });
    const member = await seedMember();

    // Get today's midnight in the app timezone (same as the service does)
    const today = getTodayInAppTimezone();

    const { loan } = await createLoan({
      equipmentId: equipment.id,
      memberId: member.id,
      issuedByUserId,
      purpose: 'Due today test',
      dueDate: new Date(Date.now() + 86400 * 1000 * 10)
    });

    // Set due date to today's midnight in app timezone
    await prisma.loan.update({
      where: { id: (loan as { id: string }).id },
      data: { dueDate: today }
    });

    const { items } = await getLoanList({ tab: 'overdue' });
    const loanIds = (items as Array<{ id: string }>).map((l) => l.id);
    expect(loanIds).not.toContain((loan as { id: string }).id);
  });

  it('case 5 — overdueWhereClause excludes today: dueDate.lt equals today in app timezone', async () => {
    const clause = overdueWhereClause();
    // getTodayInAppTimezone returns midnight of today in APP_TIMEZONE
    const today = getTodayInAppTimezone();
    // The lt boundary must equal today in the app timezone, not UTC midnight
    expect(clause.dueDate.lt.getTime()).toBe(today.getTime());
  });
});

// ─── Case 8: Asset tag uniqueness ────────────────────────────────────────────

describe('asset tag uniqueness', () => {
  it('case 8: two pieces of equipment cannot share the same asset tag', async () => {
    const cat = await seedCategory({ name: `AssetTagCat-${Date.now()}` });
    const tag = `UNIQUE-TAG-${Date.now()}`;

    await prisma.equipment.create({
      data: {
        assetTag: tag,
        name: 'Item A',
        categoryId: cat.id,
        status: 'AVAILABLE',
        condition: 'GOOD',
        storageLocation: 'Shelf B'
      }
    });

    // Attempting to create another item with the same tag must fail
    await expect(
      prisma.equipment.create({
        data: {
          assetTag: tag,
          name: 'Item B',
          categoryId: cat.id,
          status: 'AVAILABLE',
          condition: 'GOOD',
          storageLocation: 'Shelf C'
        }
      })
    ).rejects.toThrow();
  });
});
