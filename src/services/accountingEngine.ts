import type { ChartOfAccount, JournalLine, Transaction } from '../types';

export interface LedgerBalance {
  accountCode: string;
  accountName: string;
  category: ChartOfAccount['category'] | 'UNKNOWN';
  debit: number;
  credit: number;
  balance: number;
  normalBalance?: ChartOfAccount['normalBalance'];
}

export function getJournalLines(transaction: Transaction): JournalLine[] {
  if (transaction.journalLines?.length) return transaction.journalLines;
  return [
    { accountCode: transaction.debitAccountCode, debit: transaction.totalAmount, credit: 0 },
    { accountCode: transaction.creditAccountCode, debit: 0, credit: transaction.totalAmount },
  ];
}

export function validateJournalBalance(transaction: Transaction): boolean {
  const lines = getJournalLines(transaction);
  const debit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const credit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  return Math.abs(debit - credit) < 0.01;
}

export function buildTrialBalance(
  transactions: Transaction[],
  coaList: ChartOfAccount[]
): LedgerBalance[] {
  const map = new Map<string, { debit: number; credit: number }>();

  for (const transaction of transactions) {
    if (!transaction.journalPosted) continue;
    if (!validateJournalBalance(transaction)) continue;

    for (const line of getJournalLines(transaction)) {
      const current = map.get(line.accountCode) || { debit: 0, credit: 0 };
      current.debit += line.debit || 0;
      current.credit += line.credit || 0;
      map.set(line.accountCode, current);
    }
  }

  return [...map.entries()]
    .map(([accountCode, totals]) => {
      const coa = coaList.find(item => item.code === accountCode);
      const balance = coa?.normalBalance === 'CREDIT'
        ? totals.credit - totals.debit
        : totals.debit - totals.credit;

      return {
        accountCode,
        accountName: coa?.name || 'Akun belum ada di COA',
        category: coa?.category || 'UNKNOWN',
        debit: Math.round(totals.debit * 100) / 100,
        credit: Math.round(totals.credit * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        normalBalance: coa?.normalBalance,
      };
    })
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

export function getTrialBalanceTotals(rows: LedgerBalance[]) {
  return {
    debit: rows.reduce((sum, row) => sum + row.debit, 0),
    credit: rows.reduce((sum, row) => sum + row.credit, 0),
    difference: rows.reduce((sum, row) => sum + row.debit - row.credit, 0),
  };
}
