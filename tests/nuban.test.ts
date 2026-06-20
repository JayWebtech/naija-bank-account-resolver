import {
  normalizeBankCode,
  calculateCheckDigit,
  validateNuban,
  getValidationDetails,
  resolveBankByAccount,
  resolveBankByAccountGrouped,
  getBankType,
  getBankByCode,
  getBankBySlug,
  getBanks
} from '../src/nuban';

describe('NUBAN Validation and Resolution Tests', () => {
  
  describe('Bank Code Normalization', () => {
    test('should pad 3-digit bank codes with 000', () => {
      expect(normalizeBankCode('011')).toBe('000011');
      expect(normalizeBankCode('044')).toBe('000044');
      expect(normalizeBankCode('058')).toBe('000058');
    });

    test('should prefix 5-digit bank codes with 9', () => {
      expect(normalizeBankCode('50515')).toBe('950515'); // Moniepoint MFB
      expect(normalizeBankCode('50211')).toBe('950211'); // Kuda MFB
    });

    test('should leave 6-digit bank codes as-is', () => {
      expect(normalizeBankCode('090267')).toBe('090267'); // Kuda MFB (alternative code)
      expect(normalizeBankCode('950515')).toBe('950515');
      expect(normalizeBankCode('100004')).toBe('100004'); // Paycom
    });

    test('should handle edge cases and clean characters', () => {
      expect(normalizeBankCode(' 011 ')).toBe('000011');
      expect(normalizeBankCode('011-abc')).toBe('000011');
      expect(normalizeBankCode('1')).toBe('000001');
    });
  });

  describe('Check Digit Calculation', () => {
    // Examples from the CBN Proposal Document
    test('should calculate correct check digit for First Bank Example 1 (000001457 -> 9)', () => {
      const serial = '000001457';
      const bankCode = '011'; // First Bank
      expect(calculateCheckDigit(serial, bankCode)).toBe(9);
    });

    test('should calculate correct check digit for First Bank Example 2 (000000022 -> 0)', () => {
      const serial = '000000022';
      const bankCode = '011'; // First Bank
      expect(calculateCheckDigit(serial, bankCode)).toBe(0);
    });

    test('should throw error for invalid serial number lengths', () => {
      expect(() => calculateCheckDigit('12345678', '011')).toThrow();
      expect(() => calculateCheckDigit('1234567890', '011')).toThrow();
    });
  });

  describe('NUBAN Validation', () => {
    test('should validate correct NUBAN numbers', () => {
      expect(validateNuban('0000014579', '011')).toBe(true);
      expect(validateNuban('0000000220', '011')).toBe(true);
    });

    test('should fail validation for incorrect NUBAN check digit', () => {
      expect(validateNuban('0000014578', '011')).toBe(false);
      expect(validateNuban('0000000225', '011')).toBe(false);
    });

    test('should fail validation for incorrect account number lengths', () => {
      expect(validateNuban('000001457', '011')).toBe(false);
      expect(validateNuban('00000002201', '011')).toBe(false);
      expect(validateNuban('abc', '011')).toBe(false);
    });

    test('should return detailed validation results', () => {
      const details = getValidationDetails('0000014579', '011');
      expect(details.isValid).toBe(true);
      expect(details.calculatedCheckDigit).toBe(9);
      expect(details.providedCheckDigit).toBe(9);

      const invalidDetails = getValidationDetails('0000014578', '011');
      expect(invalidDetails.isValid).toBe(false);
      expect(invalidDetails.calculatedCheckDigit).toBe(9);
      expect(invalidDetails.providedCheckDigit).toBe(8);
    });
  });

  describe('Bank Lookup and Account Resolution', () => {
    test('should resolve possible candidate banks for a valid account number', () => {
      // First Bank example: '0000014579'
      const candidates = resolveBankByAccount('0000014579');
      expect(candidates.length).toBeGreaterThan(0);
      
      // First Bank should be in the list of candidate banks
      const hasFirstBank = candidates.some(bank => bank.code === '011');
      expect(hasFirstBank).toBe(true);
    });

    test('should resolve candidates with filtering options', () => {
      const allCandidates = resolveBankByAccount('0000014579');
      const commercialOnly = resolveBankByAccount('0000014579', { bankType: 'dmb' });
      const fintechOnly = resolveBankByAccount('0000014579', { bankType: 'fintech' });
      const ofiOnly = resolveBankByAccount('0000014579', { bankType: 'ofi' });

      expect(commercialOnly.length + fintechOnly.length + ofiOnly.length).toBe(allCandidates.length);
      expect(commercialOnly.every(b => getBankType(b) === 'dmb')).toBe(true);
      expect(fintechOnly.every(b => getBankType(b) === 'fintech')).toBe(true);
      expect(ofiOnly.every(b => getBankType(b) === 'ofi')).toBe(true);
    });

    test('should resolve candidate banks grouped by DMB, Fintech, and OFI types', () => {
      const result = resolveBankByAccountGrouped('0000014579');
      expect(result.dmb).toBeDefined();
      expect(result.fintech).toBeDefined();
      expect(result.ofi).toBeDefined();
      expect(result.dmb.some(b => b.code === '011')).toBe(true);
      expect(result.dmb.every(b => getBankType(b) === 'dmb')).toBe(true);
      expect(result.fintech.every(b => getBankType(b) === 'fintech')).toBe(true);
      expect(result.ofi.every(b => getBankType(b) === 'ofi')).toBe(true);
    });

    test('should return empty list for invalid account numbers', () => {
      expect(resolveBankByAccount('123')).toEqual([]);
      expect(resolveBankByAccount('abcdefghij')).toEqual([]);
    });

    test('should list all banks', () => {
      const banks = getBanks();
      expect(banks.length).toBe(390);
    });

    test('should find bank by code', () => {
      const accessBank = getBankByCode('044');
      expect(accessBank).toBeDefined();
      expect(accessBank?.name.toLowerCase()).toContain('access');
    });

    test('should find bank by slug', () => {
      const gtBank = getBankBySlug('guaranty-trust-bank');
      // Some databases might slug it as gtbank or guaranty-trust-bank
      const found = gtBank || getBankBySlug('gtbank') || getBankBySlug('guaranty-trust-bank-plc');
      expect(found).toBeDefined();
    });
  });
});
