export interface Bank {
  id: string;
  name: string;
  slug: string;
  code: string; // CBN bank code (can be 3, 5, or 6 digits)
  ussd: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  calculatedCheckDigit: number;
  providedCheckDigit: number;
}

export interface ResolveOptions {
  /**
   * Filter candidates by bank type:
   * - 'dmb': Deposit Money Banks (Commercial Banks)
   * - 'fintech': Popular digital banks & payment apps (OPay, Kuda, Moniepoint, etc.)
   * - 'ofi': Other Financial Institutions (smaller MFBs, mortgages, etc.)
   * - 'all': Return all matching candidates (default)
   */
  bankType?: 'dmb' | 'fintech' | 'ofi' | 'all';
}

export interface GroupedResolveResult {
  dmb: Bank[];
  fintech: Bank[];
  ofi: Bank[];
}

