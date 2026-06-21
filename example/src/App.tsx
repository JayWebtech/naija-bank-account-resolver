import { useState, useEffect, useRef } from 'react';
import {
  getBanks,
  getValidationDetails,
  resolveBankByAccountGrouped,
  getBankType
} from 'naija-bank-account-resolver';
import type {
  GroupedResolveResult,
  Bank
} from 'naija-bank-account-resolver';

// Custom Searchable Dropdown Component
interface SearchableBankSelectProps {
  banks: Bank[];
  value: string;
  onChange: (value: string) => void;
}

function SearchableBankSelect({ banks, value, onChange }: SearchableBankSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedBank = banks.find(b => b.code === value);
  const filtered = banks.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.code.includes(searchTerm)
  );

  return (
    <div className="custom-select-container" ref={containerRef}>
      <button
        id="bank-select-trigger"
        type="button"
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 14px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          fontSize: '14.5px',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <span style={{ color: selectedBank ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selectedBank ? `${selectedBank.name} (${selectedBank.code})` : '-- Select Target Bank --'}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '6px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color-dark)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '320px',
          overflow: 'hidden'
        }}>
          <input
            id="bank-select-search"
            type="text"
            className="custom-select-search"
            placeholder="Type bank name or code to filter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              padding: '10px 12px',
              border: 'none',
              borderBottom: '1px solid var(--border-color)',
              outline: 'none',
              fontSize: '14px',
              backgroundColor: '#fafafa',
              width: '100%'
            }}
          />
          <div className="custom-select-options" style={{
            overflowY: 'auto',
            flex: 1,
            maxHeight: '260px'
          }}>
            {filtered.length > 0 ? (
              filtered.map(b => (
                <div
                  key={b.code}
                  id={`bank-option-${b.code}`}
                  className={`custom-select-option ${b.code === value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(b.code);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  style={{
                    padding: '10px 12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: b.code === value ? 'var(--border-color-dark)' : 'transparent',
                    color: b.code === value ? '#ffffff' : 'var(--text-primary)'
                  }}
                >
                  <span style={{ fontWeight: '500' }}>{b.name}</span>
                  <span style={{
                    fontSize: '11.5px',
                    opacity: 0.8,
                    fontFamily: 'var(--font-mono)',
                    color: b.code === value ? '#ffffff' : 'var(--text-secondary)'
                  }}>{b.code}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No matching banks found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'resolver' | 'validator' | 'visualizer' | 'directory'>('resolver');
  const [accountNumber, setAccountNumber] = useState('');
  const [searchBankTerm, setSearchBankTerm] = useState('');

  // Real-time resolver state
  const [resolved, setResolved] = useState<GroupedResolveResult>({ dmb: [], fintech: [], ofi: [] });

  // Single-bank validator state
  const [manualAccount, setManualAccount] = useState('');
  const [manualBank, setManualBank] = useState('');
  const [manualResult, setManualResult] = useState<{
    checked: boolean;
    isValid: boolean;
    calculated: number;
    provided: number;
  } | null>(null);

  const allBanks = getBanks();

  // Handle real-time candidate resolution when account number changes
  useEffect(() => {
    const clean = accountNumber.trim().replace(/\D/g, '');
    if (clean.length === 10) {
      const candidates = resolveBankByAccountGrouped(clean);
      setResolved(candidates);
    } else {
      setResolved({ dmb: [], fintech: [], ofi: [] });
    }
  }, [accountNumber]);

  // Handle manual validation form submit
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualAccount.length !== 10 || !manualBank) return;

    const details = getValidationDetails(manualAccount, manualBank);
    setManualResult({
      checked: true,
      isValid: details.isValid,
      calculated: details.calculatedCheckDigit,
      provided: details.providedCheckDigit
    });
  };

  // Filtered banks for directory
  const filteredBanks = allBanks.filter(bank =>
    bank.name.toLowerCase().includes(searchBankTerm.toLowerCase()) ||
    bank.code.includes(searchBankTerm)
  );

  const cbnWeights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];

  return (
    <div className="container" style={{ maxWidth: '850px', padding: '40px 20px' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: '700',
            border: '1px solid #111111',
            padding: '2px 6px',
            textTransform: 'uppercase'
          }}>
            NUBAN Standard Resolver
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>v1.0.0</span>
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#000000', margin: '0 0 8px 0', letterSpacing: '-0.03em' }}>
          Nigerian Bank Account Resolver
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0, lineHeight: '1.5' }}>
          A minimalist validation playground for Nigerian Unified Bank Account Numbers. Select a tool tab below to validate, resolve, or explore the CBN checksum standard.
        </p>
      </header>

      {/* Tabs Navigation */}
      <div className="tab-bar">
        <button
          id="tab-resolver"
          className={`tab-button ${activeTab === 'resolver' ? 'active' : ''}`}
          onClick={() => setActiveTab('resolver')}
        >
          Auto-Detector
        </button>
        <button
          id="tab-validator"
          className={`tab-button ${activeTab === 'validator' ? 'active' : ''}`}
          onClick={() => setActiveTab('validator')}
        >
          Specific Validator
        </button>
        <button
          id="tab-visualizer"
          className={`tab-button ${activeTab === 'visualizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualizer')}
        >
          Math Visualizer
        </button>
        <button
          id="tab-directory"
          className={`tab-button ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          Supported Banks
        </button>
      </div>

      {/* Active Tab Panel */}
      <div className="tab-panel">

        {/* Tab 1: Auto Detector */}
        {activeTab === 'resolver' && (
          <section className="card" style={{ padding: '28px', border: '2px solid #111111' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Real-time Auto-Detector
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '24px', lineHeight: '1.4' }}>
              Enter a 10-digit Nigerian account number. The resolver evaluates the CBN checksum logic against all 390+ registered institutions instantly.
            </p>

            <div style={{
              padding: '12px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '12.5px',
              marginBottom: '24px',
              lineHeight: '1.4',
              backgroundColor: '#fafafa'
            }}>
              <strong>Note:</strong> Some fintech and digital wallet providers do not strictly follow the standard CBN check-digit algorithm, which may lead to resolution issues or collisions for those accounts.
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="account-input" style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                Account Number
              </label>
              <input
                id="account-input"
                type="text"
                maxLength={10}
                placeholder="e.g. 0087257936"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #111111',
                  fontSize: '16px',
                  fontWeight: '600',
                  letterSpacing: '0.05em',
                  outline: 'none'
                }}
              />
            </div>

            {/* Resolved Results */}
            {accountNumber.length === 10 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* DMBs */}
                <div>
                  <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Commercial Banks (DMBs)
                  </h4>
                  {resolved.dmb.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {resolved.dmb.map(bank => (
                        <div key={bank.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #111111', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{bank.name}</span>
                          <span className="badge badge-commercial">{bank.code}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', paddingLeft: '4px' }}>No matching commercial banks.</p>
                  )}
                </div>

                {/* Popular Fintechs */}
                <div>
                  <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Popular Fintechs & Digital Banks
                  </h4>
                  {resolved.fintech.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {resolved.fintech.map(bank => (
                        <div key={bank.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #111111', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{bank.name}</span>
                          <span className="badge badge-fintech">{bank.code}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', paddingLeft: '4px' }}>No matching popular fintechs.</p>
                  )}
                </div>

                {/* Other MFBs */}
                <div>
                  <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Other Microfinance Banks ({resolved.ofi.length})
                  </h4>
                  {resolved.ofi.length > 0 ? (
                    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px' }}>
                      {resolved.ofi.map(bank => (
                        <div key={bank.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 6px', borderBottom: '1px solid #f3f4f6' }}>
                          <span style={{ fontSize: '13px' }}>{bank.name}</span>
                          <span className="badge badge-other">{bank.code}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', paddingLeft: '4px' }}>No other matching institutions.</p>
                  )}
                </div>

                {/* Direct link helper to Visualizer */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px', textAlign: 'right' }}>
                  <button
                    id="auto-detector-visualize-btn"
                    onClick={() => setActiveTab('visualizer')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    View Checksum Calculation Math →
                  </button>
                </div>

              </div>
            ) : (
              <div style={{ border: '2px dashed var(--border-color)', padding: '32px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                  Enter all 10 digits above to evaluate matching banks.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Specific Validator */}
        {activeTab === 'validator' && (
          <section className="card" style={{ padding: '28px', border: '2px solid #111111' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Specific Bank Validator
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '24px', lineHeight: '1.4' }}>
              Directly validate an account number structural checksum against a single target bank.
            </p>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Target Bank
                </label>
                <SearchableBankSelect
                  banks={allBanks}
                  value={manualBank}
                  onChange={(val) => setManualBank(val)}
                />
              </div>

              <div>
                <label htmlFor="manual-account-input" style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Account Number
                </label>
                <input
                  id="manual-account-input"
                  type="text"
                  maxLength={10}
                  required
                  placeholder="Enter 10-digit number"
                  value={manualAccount}
                  onChange={(e) => setManualAccount(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    fontSize: '14.5px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--border-color-dark)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <button
                id="verify-button"
                type="submit"
                disabled={manualAccount.length !== 10 || !manualBank}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: (manualAccount.length === 10 && manualBank) ? '#000000' : '#e5e7eb',
                  color: (manualAccount.length === 10 && manualBank) ? '#ffffff' : '#9ca3af',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: (manualAccount.length === 10 && manualBank) ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
              >
                Verify Checksum Validity
              </button>
            </form>

            {/* Validation Outcome Alert */}
            {manualResult?.checked && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                borderRadius: '8px',
                border: `1px solid ${manualResult.isValid ? 'var(--success-border)' : 'var(--error-border)'}`,
                backgroundColor: manualResult.isValid ? 'var(--success-bg)' : 'var(--error-bg)',
                color: manualResult.isValid ? 'var(--success)' : 'var(--error)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Checksum Output</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: `2px solid ${manualResult.isValid ? 'var(--success)' : 'var(--error)'}`,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {manualResult.isValid ? 'VALID' : 'INVALID'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Calculated Check Digit:</span>
                    <strong>{manualResult.calculated}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Provided Check Digit:</span>
                    <strong>{manualResult.provided}</strong>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Math Visualizer */}
        {activeTab === 'visualizer' && (
          <section className="card" style={{ padding: '28px', border: '2px solid #111111' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Checksum Math Visualizer
            </h2>

            {accountNumber.length === 10 && (resolved.dmb.length > 0 || resolved.fintech.length > 0 || resolved.ofi.length > 0) ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px', lineHeight: '1.4' }}>
                  Step-by-step mathematical evaluation using resolved candidate:
                  <strong> {resolved.dmb[0]?.name || resolved.fintech[0]?.name || resolved.ofi[0]?.name}</strong> (Code: <code>{resolved.dmb[0]?.code || resolved.fintech[0]?.code || resolved.ofi[0]?.code}</code>).
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12.5px',
                  backgroundColor: '#f9fafb',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>1. Normalized 6-Digit Bank:</span>
                    <strong style={{ color: '#000000' }}>
                      {(() => {
                        const code = resolved.dmb[0]?.code || resolved.fintech[0]?.code || resolved.ofi[0]?.code;
                        const cleaned = code.trim().replace(/\D/g, '');
                        if (cleaned.length === 3) return '000' + cleaned;
                        if (cleaned.length === 5) return '9' + cleaned;
                        return cleaned;
                      })()}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>2. 9-Digit Account Serial:</span>
                    <strong style={{ color: '#000000' }}>{accountNumber.slice(0, 9)}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>3. Weighted Products Sum:</span>
                    <strong>
                      {(() => {
                        const code = resolved.dmb[0]?.code || resolved.fintech[0]?.code || resolved.ofi[0]?.code;
                        const cleanCode = code.trim().replace(/\D/g, '');
                        let normalized = '';
                        if (cleanCode.length === 3) normalized = '000' + cleanCode;
                        else if (cleanCode.length === 5) normalized = '9' + cleanCode;
                        else normalized = cleanCode;

                        const fullStr = normalized + accountNumber.slice(0, 9);
                        let sum = 0;
                        for (let i = 0; i < 15; i++) {
                          sum += parseInt(fullStr[i], 10) * cbnWeights[i];
                        }
                        return sum;
                      })()}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>4. Modulo 10 Remainder:</span>
                    <strong>
                      {(() => {
                        const code = resolved.dmb[0]?.code || resolved.fintech[0]?.code || resolved.ofi[0]?.code;
                        const cleanCode = code.trim().replace(/\D/g, '');
                        let normalized = '';
                        if (cleanCode.length === 3) normalized = '000' + cleanCode;
                        else if (cleanCode.length === 5) normalized = '9' + cleanCode;
                        else normalized = cleanCode;

                        const fullStr = normalized + accountNumber.slice(0, 9);
                        let sum = 0;
                        for (let i = 0; i < 15; i++) {
                          sum += parseInt(fullStr[i], 10) * cbnWeights[i];
                        }
                        return sum % 10;
                      })()}
                    </strong>
                  </div>
                  <div style={{ borderTop: '1px dashed var(--border-color)', margin: '4px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>5. Expected Check Digit:</span>
                    <strong style={{ color: 'var(--success)' }}>
                      {(() => {
                        const code = resolved.dmb[0]?.code || resolved.fintech[0]?.code || resolved.ofi[0]?.code;
                        const cleanCode = code.trim().replace(/\D/g, '');
                        let normalized = '';
                        if (cleanCode.length === 3) normalized = '000' + cleanCode;
                        else if (cleanCode.length === 5) normalized = '9' + cleanCode;
                        else normalized = cleanCode;

                        const fullStr = normalized + accountNumber.slice(0, 9);
                        let sum = 0;
                        for (let i = 0; i < 15; i++) {
                          sum += parseInt(fullStr[i], 10) * cbnWeights[i];
                        }
                        const check = 10 - (sum % 10);
                        return check === 10 ? 0 : check;
                      })()}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>6. Provided Check Digit:</span>
                    <strong style={{ color: '#000000' }}>{accountNumber[9]}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.5', marginBottom: '20px' }}>
                  The NUBAN check digit is calculated using a standard Central Bank of Nigeria (CBN) modulo 10 check digit math logic. Enter an account number in the Auto-Detector tab to run calculations.
                </p>
                <div style={{ fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fafb', fontFamily: 'var(--font-mono)' }}>
                  <code style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Central Algorithm:</code>
                  <span style={{ display: 'block', marginBottom: '8px' }}>Sum = ∑ (Digit_i * Weight_i)</span>
                  <span style={{ display: 'block', marginBottom: '8px' }}>CheckDigit = 10 - (Sum % 10)</span>
                  <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                    * Where Weights is: [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3] and target inputs are the 6-digit bank code + 9-digit account serial.
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab 4: Directory */}
        {activeTab === 'directory' && (
          <section className="card" style={{ padding: '28px', border: '2px solid #111111' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
              Supported Banks Directory
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
              Search through the 390+ Nigerian banks, fintech platforms, and microfinance organizations integrated into this library.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <input
                id="directory-search"
                type="text"
                placeholder="Search name, code or USSD..."
                value={searchBankTerm}
                onChange={(e) => setSearchBankTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--border-color-dark)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div style={{
              maxHeight: '340px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px'
            }}>
              {filteredBanks.map(bank => {
                const type = getBankType(bank);
                return (
                  <div key={bank.code} style={{
                    padding: '12px',
                    border: '1px solid #f3f4f6',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    backgroundColor: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '700' }}>{bank.name}</span>
                      <span className={`badge ${type === 'dmb' ? 'badge-commercial' : type === 'fintech' ? 'badge-fintech' : 'badge-other'}`}>
                        {type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      <span>Code: {bank.code}</span>
                      {bank.ussd && <span>USSD: {bank.ussd}</span>}
                    </div>
                  </div>
                );
              })}
              {filteredBanks.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>
                  No registered banks match your search.
                </p>
              )}
            </div>
          </section>
        )}

      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-credits">
          <p>
            Created by <a href="https://github.com/JayWebtech" target="_blank" rel="noopener noreferrer">JayWebtech</a>.
          </p>
          <p className="footer-plea">
            If you find this resolver useful, please consider giving a star to the repo and following me on GitHub! ❤️
          </p>
        </div>
        <div className="footer-cta">
          <a
            href="https://github.com/JayWebtech/naija-bank-account-resolver"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-btn footer-btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Star the Repo
          </a>
          <a
            href="https://github.com/JayWebtech"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Follow @JayWebtech
          </a>
          <a
            href="https://www.npmjs.com/package/naija-bank-account-resolver"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            npm Package
          </a>
        </div>
      </footer>
    </div>
  );
}
