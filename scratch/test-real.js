const { resolveBankByAccountGrouped, getValidationDetails } = require('../dist/cjs/index.js');

const accountNumber = process.argv[2];
const bankCode = process.argv[3];

if (!accountNumber) {
  console.log('\nUsage: node test-real.js <account_number> [bank_code]');
  console.log('Example: node test-real.js 0000014579');
  console.log('Example: node test-real.js 0000014579 011\n');
  process.exit(1);
}

console.log(`\n==========================================`);
console.log(`Analyzing Account Number: ${accountNumber}`);
console.log(`==========================================\n`);

// 1. Resolve candidates grouped by type
console.log('--- Matching Candidate Banks ---');
const { dmb, fintech, ofi } = resolveBankByAccountGrouped(accountNumber);

console.log('\n🏢 COMMERCIAL BANKS (DMBs):');
if (dmb.length === 0) {
  console.log('  No matching commercial banks found.');
} else {
  dmb.forEach(bank => {
    console.log(`  ✅ [${bank.code}] ${bank.name}`);
  });
}

console.log('\n🚀 POPULAR FINTECHS (Moniepoint, OPay, Kuda, PalmPay, etc.):');
if (fintech.length === 0) {
  console.log('  No matching popular fintechs found.');
} else {
  fintech.forEach(bank => {
    console.log(`  🔥 [${bank.code}] ${bank.name}`);
  });
}

console.log('\n📱 OTHER MICROFINANCE & MORTGAGE BANKS (MFBs/OFIs):');
if (ofi.length === 0) {
  console.log('  No other matching banks found.');
} else {
  console.log(`  Found ${ofi.length} other matching bank(s):`);
  ofi.forEach(bank => {
    console.log(`  - [${bank.code}] ${bank.name}`);
  });
}

console.log('\n💡 Note: The NUBAN checksum is a modulo-10 algorithm (10% mathematical collision rate).');
console.log('   The correct bank is almost certainly in the Commercial or Popular Fintechs section above.');

// 2. Validate for specific bank code if provided
if (bankCode) {
  console.log('\n--- Specific Bank Validation Details ---');
  const details = getValidationDetails(accountNumber, bankCode);
  console.log(`Bank Code: ${bankCode}`);
  console.log(`Is Valid: ${details.isValid ? '✅ YES' : '❌ NO'}`);
  console.log(`Calculated Check Digit: ${details.calculatedCheckDigit}`);
  console.log(`Provided Check Digit: ${details.providedCheckDigit}`);
}

console.log('\n==========================================\n');
