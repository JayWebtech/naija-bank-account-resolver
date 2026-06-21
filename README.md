# naija-bank-account-resolver

A lightweight, zero-dependency Nigerian bank account resolver and NUBAN validator in TypeScript. Instantly auto-detects candidate banks from a 10-digit account number across 390+ traditional Deposit Money Banks (3-digit codes) and Other Financial Institutions / Microfinance Banks (5/6-digit codes).

🚀 **Live Playground / Interactive Example**: [https://naija-bank-account-resolver.vercel.app/](https://naija-bank-account-resolver.vercel.app/)
📦 **npm Package**: [https://www.npmjs.com/package/naija-bank-account-resolver](https://www.npmjs.com/package/naija-bank-account-resolver)

---

## Features

- **NUBAN Validation**: Validates any 10-digit bank account number against a bank code using the CBN-approved check digit algorithm.
- **Support for Commercial & MFBs**: Handles standard DMBs (e.g. Access, GTB) and OFIs/MFBs/PSBs (e.g. Kuda, OPay, Moniepoint, PalmPay) uniformly using the generalized 15-digit NUBAN standard.
- **Account Resolution**: Identifies possible candidate banks matching a given 10-digit account number (perfect for auto-detecting banks).
- **Built-in Database**: Contains an embedded, clean database of 390+ Nigerian banks with names, codes, slugs, and USSD codes.
- **Hybrid ESM/CJS Support**: Fully compatible with both Node.js CommonJS (`require`) and ES Modules (`import`).
- **Fully Typed**: Written in TypeScript with full type declarations.

---

## Installation

Install via npm:

```bash
npm install naija-nuban-resolver
```

Or via yarn:

```bash
yarn add naija-nuban-resolver
```

Or via pnpm:

```bash
pnpm add naija-nuban-resolver
```

---

## Quickstart

### ES Modules (TypeScript / Modern JS)

```typescript
import { validateNuban, resolveBankByAccount, getBankByCode } from 'naija-nuban-resolver';

// 1. Validate an account number
const isValid = validateNuban('0000014579', '011'); // First Bank of Nigeria
console.log(isValid); // true

// 2. Auto-detect bank from account number (returns sorted: DMBs first, then popular Fintechs, then other MFBs)
const candidateBanks = resolveBankByAccount('0000014579');

// 3. Auto-detect grouped by bank type
const { dmb, fintech, ofi } = resolveBankByAccountGrouped('0000014579');
console.log(dmb); // Commercial Banks (DMBs)
console.log(fintech); // Popular Fintechs (OPay, Kuda, Moniepoint, etc.)
console.log(ofi); // Other Microfinance Banks / OFIs
/*
Output:
[
  {
    "id": "136",
    "name": "First Bank of Nigeria",
    "slug": "first-bank-of-nigeria",
    "code": "011",
    "ussd": "*894#"
  },
  ...
]
*/

// 3. Lookup bank info
const bank = getBankByCode('044');
console.log(bank?.name); // "Access Bank"
```

### CommonJS (Legacy Node.js)

```javascript
const { validateNuban, resolveBankByAccount } = require('naija-nuban-resolver');

const isValid = validateNuban('0000014579', '011');
console.log(isValid); // true
```

---

## API Reference

### `validateNuban(accountNumber: string, bankCode: string): boolean`
Validates whether a 10-digit account number matches the specified bank code using the CBN NUBAN checksum. Returns `true` if valid, `false` otherwise.
* **`accountNumber`**: The 10-digit Nigerian bank account number.
* **`bankCode`**: The bank's unique CBN identifier (can be a 3-digit commercial bank code, 5-digit MFB code, or 6-digit code).

### `getValidationDetails(accountNumber: string, bankCode: string): ValidationResult`
Validates the account number and returns details including the calculated and provided check digits.
Returns a `ValidationResult` object:
```typescript
interface ValidationResult {
  isValid: boolean;
  calculatedCheckDigit: number;
  providedCheckDigit: number;
}
```

### `resolveBankByAccount(accountNumber: string, options?: ResolveOptions): Bank[]`
Predicts which banks the given account number could belong to. It checks the account number against all 390+ built-in banks using the NUBAN validation check digit and returns an array of matching banks sorted by priority (Commercial Banks first, then Popular Fintechs, then other MFBs).
* **`options.bankType`**: Filter candidates by bank type: `'dmb'` (commercial), `'fintech'` (popular digital banks), `'ofi'` (other smaller MFBs/mortgages), or `'all'` (default).

### `resolveBankByAccountGrouped(accountNumber: string): GroupedResolveResult`
Predicts matching banks and returns them grouped into three distinct arrays:
* **`dmb`**: Matching Commercial Banks (Deposit Money Banks).
* **`fintech`**: Matching Popular Digital Banks/Payment Apps (Moniepoint, OPay, Kuda, PalmPay, etc.).
* **`ofi`**: Other matching Microfinance and Mortgage institutions.

Returns a `GroupedResolveResult` object:
```typescript
interface GroupedResolveResult {
  dmb: Bank[];
  fintech: Bank[];
  ofi: Bank[];
}
```

### `getBankType(bank: Bank): 'dmb' | 'fintech' | 'ofi'`
Determines the classification category of a bank based on its CBN code.

### `calculateCheckDigit(serialNumber: string, bankCode: string): number`
Calculates the expected check digit (0-9) for a 9-digit serial number and a bank code. Throws an error if the serial number is not exactly 9 digits.

### `getBanks(): Bank[]`
Returns the array of all 390+ supported banks. Each bank object has the following shape:
```typescript
interface Bank {
  id: string;
  name: string;
  slug: string;
  code: string;
  ussd: string | null;
}
```

### `getBankByCode(code: string): Bank | undefined`
Looks up a bank by its CBN code.

### `getBankBySlug(slug: string): Bank | undefined`
Looks up a bank by its URL-friendly slug.

### `normalizeBankCode(code: string): string`
Normalizes any given bank code string to a standard 6-digit string:
- 3-digit DMB codes are prepended with `000` (e.g. `'011'` becomes `'000011'`).
- 5-digit OFI/MFB codes are prepended with `9` (e.g. `'50515'` becomes `'950515'`).
- 6-digit codes are returned as-is.

---

## Developer Guide

### Testing
To run the unit tests:
```bash
npm run test
```

### Building
To compile the package to CommonJS and ESM outputs:
```bash
npm run build
```

---

## Support & Contribution

If you find this library useful, please consider:
- Giving the repository a ⭐ [on GitHub](https://github.com/JayWebtech/naija-bank-account-resolver)!
- Following [JayWebtech](https://github.com/JayWebtech) on GitHub for more updates and tools.

Developed with ❤️ by [JayWebtech](https://github.com/JayWebtech).

---

## License

MIT License.
