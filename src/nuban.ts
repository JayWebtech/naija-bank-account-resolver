import { Bank, ValidationResult, ResolveOptions, GroupedResolveResult } from './types';
import { BANKS } from './banks-data';

// Known 3-digit commercial bank (DMB) routing codes assigned by the CBN
const COMMERCIAL_BANK_CODES = new Set([
  '011', '032', '033', '035', '044', '050', '057', '058', '063', '068',
  '070', '076', '082', '100', '101', '103', '105', '106', '107', '214',
  '215', '221', '232', '300', '301', '302', '303', '304', '526'
]);

// Known codes for popular digital banks & fintech apps
const POPULAR_FINTECH_CODES = new Set([
  '50515', '950515', // Moniepoint MFB
  '950588', '50588', '305', '100004', '999992', // OPay
  '50211', '950211', '090267', // Kuda MFB
  '999991', '100033', // PalmPay
  '100002', // Paga
  '565', '090270', // Carbon
  '51318', '090551', // FairMoney
  '00803', // SmartCash
  '120002', // Momo
  '120001', // 9PSB
  '50547', '090110' // VFD Bank
]);

/**
 * Checks whether a bank is a Deposit Money Bank (DMB/Commercial Bank), a Popular Fintech Bank, or an Other Financial Institution (OFI/MFB/PSB).
 */
export function getBankType(bank: Bank): 'dmb' | 'fintech' | 'ofi' {
  const cleanCode = bank.code.trim().replace(/\D/g, '');
  
  // 1. Check DMB (Commercial Banks)
  if (cleanCode.length === 6 && cleanCode.startsWith('000')) {
    const originalThree = cleanCode.slice(3);
    if (COMMERCIAL_BANK_CODES.has(originalThree)) {
      return 'dmb';
    }
  }
  if (COMMERCIAL_BANK_CODES.has(cleanCode)) {
    return 'dmb';
  }

  // 2. Check Popular Fintech Banks
  if (POPULAR_FINTECH_CODES.has(cleanCode)) {
    return 'fintech';
  }
  
  const normalized = normalizeBankCode(cleanCode);
  if (POPULAR_FINTECH_CODES.has(normalized)) {
    return 'fintech';
  }

  return 'ofi';
}

/**
 * Normalizes a bank code to a 6-digit string based on CBN guidelines.
 * - 3-digit DMB codes are prepended with '000' (e.g., '011' -> '000011')
 * - 5-digit OFI/MFB codes are prepended with '9' (e.g., '50515' -> '950515')
 * - 6-digit codes are left as-is
 */
export function normalizeBankCode(code: string): string {
  const cleaned = code.trim().replace(/\D/g, '');
  if (cleaned.length === 3) {
    return '000' + cleaned;
  }
  if (cleaned.length === 5) {
    return '9' + cleaned;
  }
  if (cleaned.length === 6) {
    return cleaned;
  }
  // Fallback for unexpected lengths: pad with leading zeros up to 6 digits, or truncate to last 6
  return cleaned.padStart(6, '0').slice(-6);
}

/**
 * Calculates the NUBAN check digit for a 9-digit serial number and a bank code.
 * Uses the CBN approved weighted algorithm (weights: 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3)
 */
export function calculateCheckDigit(serialNumber: string, bankCode: string): number {
  const cleanSerial = serialNumber.trim().replace(/\D/g, '');
  if (cleanSerial.length !== 9) {
    throw new Error('NUBAN account serial number must be exactly 9 digits');
  }

  const normalizedBankCode = normalizeBankCode(bankCode);
  const codeString = normalizedBankCode + cleanSerial;

  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];
  let sum = 0;

  for (let i = 0; i < 15; i++) {
    const digit = parseInt(codeString[i], 10);
    sum += digit * weights[i];
  }

  const remainder = sum % 10;
  const checkDigit = 10 - remainder;

  return checkDigit === 10 ? 0 : checkDigit;
}

/**
 * Validates whether an account number is a valid NUBAN for a given bank code.
 */
export function validateNuban(accountNumber: string, bankCode: string): boolean {
  const cleanAccount = accountNumber.trim().replace(/\D/g, '');
  if (cleanAccount.length !== 10) {
    return false;
  }

  const serial = cleanAccount.slice(0, 9);
  const providedCheckDigit = parseInt(cleanAccount[9], 10);

  try {
    const calculatedCheckDigit = calculateCheckDigit(serial, bankCode);
    return calculatedCheckDigit === providedCheckDigit;
  } catch {
    return false;
  }
}

/**
 * Validates whether an account number is a valid NUBAN for a given bank code and returns detailed results.
 */
export function getValidationDetails(accountNumber: string, bankCode: string): ValidationResult {
  const cleanAccount = accountNumber.trim().replace(/\D/g, '');
  if (cleanAccount.length !== 10) {
    return { isValid: false, calculatedCheckDigit: -1, providedCheckDigit: -1 };
  }

  const serial = cleanAccount.slice(0, 9);
  const providedCheckDigit = parseInt(cleanAccount[9], 10);

  try {
    const calculatedCheckDigit = calculateCheckDigit(serial, bankCode);
    return {
      isValid: calculatedCheckDigit === providedCheckDigit,
      calculatedCheckDigit,
      providedCheckDigit
    };
  } catch {
    return { isValid: false, calculatedCheckDigit: -1, providedCheckDigit: -1 };
  }
}

/**
 * Identifies the candidate banks that match and validate a given 10-digit account number.
 * Can be filtered using the `options` parameter to restrict candidate types.
 */
export function resolveBankByAccount(accountNumber: string, options?: ResolveOptions): Bank[] {
  const cleanAccount = accountNumber.trim().replace(/\D/g, '');
  if (cleanAccount.length !== 10) {
    return [];
  }

  const bankType = options?.bankType || 'all';

  // Find all banks where the account number passes validation
  const candidates = BANKS.filter(bank => validateNuban(cleanAccount, bank.code));

  if (bankType === 'all') {
    // Sort DMBs first, then Fintechs, then OFIs, then alphabetically
    return candidates.sort((a, b) => {
      const typeA = getBankType(a);
      const typeB = getBankType(b);
      const rank = { dmb: 1, fintech: 2, ofi: 3 };
      
      if (rank[typeA] !== rank[typeB]) {
        return rank[typeA] - rank[typeB];
      }
      return a.name.localeCompare(b.name);
    });
  }

  return candidates.filter(bank => getBankType(bank) === bankType).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Identifies the candidate banks that match and validate a given 10-digit account number,
 * returning them grouped into Commercial Banks (DMBs), Popular Fintechs, and Other Financial Institutions.
 */
export function resolveBankByAccountGrouped(accountNumber: string): GroupedResolveResult {
  const cleanAccount = accountNumber.trim().replace(/\D/g, '');
  if (cleanAccount.length !== 10) {
    return { dmb: [], fintech: [], ofi: [] };
  }

  const candidates = BANKS.filter(bank => validateNuban(cleanAccount, bank.code));
  const dmb: Bank[] = [];
  const fintech: Bank[] = [];
  const ofi: Bank[] = [];

  for (const bank of candidates) {
    const type = getBankType(bank);
    if (type === 'dmb') {
      dmb.push(bank);
    } else if (type === 'fintech') {
      fintech.push(bank);
    } else {
      ofi.push(bank);
    }
  }

  const sortByName = (a: Bank, b: Bank) => a.name.localeCompare(b.name);
  dmb.sort(sortByName);
  fintech.sort(sortByName);
  ofi.sort(sortByName);

  return { dmb, fintech, ofi };
}

/**
 * Returns the complete list of supported banks.
 */
export function getBanks(): Bank[] {
  return BANKS;
}

/**
 * Retrieves a bank from the database by its code.
 */
export function getBankByCode(code: string): Bank | undefined {
  const cleanCode = code.trim().replace(/\D/g, '');
  return BANKS.find(bank => bank.code === cleanCode);
}

/**
 * Retrieves a bank from the database by its slug.
 */
export function getBankBySlug(slug: string): Bank | undefined {
  const cleanSlug = slug.trim().toLowerCase();
  return BANKS.find(bank => bank.slug === cleanSlug);
}
