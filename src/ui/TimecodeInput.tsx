import { useLayoutEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import styles from './TimecodeInput.module.css';

const DIGITS = 8;

const toDigits = (value: string) => value.replace(/\D/g, '').padEnd(DIGITS, '0').slice(0, DIGITS);
const toTimecode = (digits: string) => digits.match(/.{2}/g)!.join(':');

/** Posizione nel testo `HH:MM:SS:FF` della cifra con indice `index` (0–7) */
const textPosition = (index: number) => index + Math.floor(index / 2);

/** Indice della cifra (0–7) corrispondente a una posizione nel testo; sui `:` passa alla cifra successiva */
const digitIndex = (position: number) => {
  const segment = Math.floor(position / 3);
  const offset = position % 3;
  return Math.min(segment * 2 + Math.min(offset, 2), DIGITS - 1);
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  onEscape: () => void;
  onBlur?: () => void;
  invalid?: boolean;
  disabled?: boolean;
  label: string;
};

/**
 * Campo timecode `HH:MM:SS:FF` a maschera fissa.
 * Le cifre si scrivono da sinistra verso destra sovrascrivendo quella evidenziata; i `:` vengono saltati.
 * Frecce sinistra/destra spostano il cursore, Backspace torna indietro di una cifra.
 */
export function TimecodeInput({ value, onChange, onEnter, onEscape, onBlur, invalid, disabled, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState(0);

  // Evidenzia la cifra che verrà sovrascritta
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input || document.activeElement !== input) return;
    const position = textPosition(Math.min(cursor, DIGITS - 1));
    if (cursor >= DIGITS) input.setSelectionRange(value.length, value.length);
    else input.setSelectionRange(position, position + 1);
  }, [cursor, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const digits = toDigits(value);

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      if (cursor >= DIGITS) return;
      onChange(toTimecode(digits.slice(0, cursor) + event.key + digits.slice(cursor + 1)));
      setCursor(cursor + 1);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      const target = Math.max(cursor - 1, 0);
      onChange(toTimecode(digits.slice(0, target) + '0' + digits.slice(target + 1)));
      setCursor(target);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setCursor(Math.max(Math.min(cursor, DIGITS) - 1, 0));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setCursor(Math.min(cursor + 1, DIGITS - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setCursor(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setCursor(DIGITS - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onEnter();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    } else if (event.key !== 'Tab' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    onChange(toTimecode(toDigits(event.clipboardData.getData('text'))));
    setCursor(DIGITS - 1);
  };

  const placeCursorFromClick = () => {
    const input = inputRef.current;
    if (!input) return;
    const index = digitIndex(input.selectionStart ?? 0);
    setCursor(index);
    // forza l'evidenziazione anche se l'indice non cambia
    const position = textPosition(index);
    input.setSelectionRange(position, position + 1);
  };

  return (
    <input
      ref={inputRef}
      className={`${styles.input} ${invalid ? styles.invalid : ''}`}
      value={value}
      onChange={() => {}}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onMouseUp={placeCursorFromClick}
      onFocus={(event) => event.currentTarget.setSelectionRange(0, 1)}
      onBlur={onBlur}
      disabled={disabled}
      aria-label={label}
      aria-invalid={invalid}
      inputMode="numeric"
      autoFocus
      spellCheck={false}
    />
  );
}
