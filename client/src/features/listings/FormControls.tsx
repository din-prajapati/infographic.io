import { useId, type ReactNode } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Recommended display length (guidance). */
  recommended?: number;
  /** Hard storage limit; input stops here. */
  max: number;
  error?: string;
  hint?: ReactNode;
  multiline?: boolean;
  full?: boolean;
  type?: 'text' | 'email' | 'tel';
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email';
  placeholder?: string;
  list?: string;
}

/** Text input with a live character counter and an associated error (rev-2 spec §5 Property form). */
export function TextField({ label, value, onChange, recommended, max, error, hint, multiline, full, type = 'text', inputMode, placeholder, list }: TextFieldProps) {
  const id = useId();
  const counterId = `${id}-count`, errorId = `${id}-error`, hintId = `${id}-hint`;
  const limit = recommended ?? max;
  const over = value.length > limit;
  const describedBy = [counterId, hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  const shared = { id, value, maxLength: max, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, placeholder, onChange: (event: { target: { value: string } }) => onChange(event.target.value) };
  return (
    <div className={`ws-field${full ? ' ws-field-full' : ''}`}>
      <div className="ws-field-row">
        <label htmlFor={id}>{label}</label>
        <span id={counterId} className="ws-counter" data-over={over || undefined} aria-live="polite">
          {value.length}/{limit}{over && recommended ? <span className="ws-sr-only"> — longer than the recommended length</span> : null}
        </span>
      </div>
      {multiline ? <textarea {...shared} rows={5} /> : <input {...shared} type={type} inputMode={inputMode} list={list} />}
      {hint && <span id={hintId} className="ws-hint">{hint}</span>}
      {over && recommended && <span className="ws-hint">Longer than the recommended {recommended} characters; it may not fit some templates.</span>}
      {error && <span id={errorId} className="ws-field-error" role="alert">{error}</span>}
    </div>
  );
}

export function SelectField<T extends string>({ label, value, onChange, options, error, full }: { label: string; value: T; onChange: (value: T) => void; options: readonly { value: T; label: string }[]; error?: string; full?: boolean }) {
  const id = useId();
  return (
    <div className={`ws-field${full ? ' ws-field-full' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} onChange={event => onChange(event.target.value as T)}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error && <span id={`${id}-error`} className="ws-field-error" role="alert">{error}</span>}
    </div>
  );
}
