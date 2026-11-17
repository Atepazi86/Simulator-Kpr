import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  helperText?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 100_000_000_000,
  helperText,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    Math.round(value).toLocaleString('id-ID')
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(Math.round(value).toLocaleString('id-ID'));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (rawDigits === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }
    const numeric = Math.min(max, Math.max(min, Number(rawDigits)));
    setDisplayValue(numeric.toLocaleString('id-ID'));
    onChange(numeric);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(Math.round(value).toLocaleString('id-ID'));
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-sm font-medium text-slate-500 select-none pointer-events-none">
          Rp
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onChange={handleChange}
          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-semibold tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-colors"
        />
      </div>
      {helperText && <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};
