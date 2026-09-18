import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isDisposableEmail,
  isInternalTestEmail,
  normalizeEmail,
  EXTRA_BLOCKED_DOMAINS,
} from '../../src/modules/auth/utils/email-policy';

// ---------------------------------------------------------------------------
// US-LAUNCH-014 — AC3 (alias normalization) + AC2 (disposable domains)
// Pure functions: no prisma, no DI, no network.
// ---------------------------------------------------------------------------

describe('normalizeEmail — AC3', () => {
  it('strips a +tag and Gmail dots, and lower-cases (AC3 example 1)', () => {
    expect(normalizeEmail('John.Doe+promo@GMail.com')).toBe('johndoe@gmail.com');
  });

  it('folds googlemail.com into gmail.com and drops dots (AC3 example 2)', () => {
    expect(normalizeEmail('j.o.h.n.doe@googlemail.com')).toBe('johndoe@gmail.com');
  });

  it('strips a +tag on a non-Gmail domain (AC3 example 3)', () => {
    expect(normalizeEmail('jane+x@company.com')).toBe('jane@company.com');
  });

  it('leaves dots alone on a non-Gmail domain (AC3 example 4)', () => {
    expect(normalizeEmail('jane.smith@company.com')).toBe('jane.smith@company.com');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeEmail('  Jane@Company.com  ')).toBe('jane@company.com');
  });

  it('is idempotent — normalizing an already-normalized address is a no-op', () => {
    const once = normalizeEmail('John.Doe+promo@GMail.com');
    expect(normalizeEmail(once)).toBe(once);
  });

  it('keeps only the first +tag boundary, so a later + in the tag is discarded too', () => {
    expect(normalizeEmail('jane+a+b@company.com')).toBe('jane@company.com');
  });

  // null-input branch (AC13)
  it('returns an empty string for empty input', () => {
    expect(normalizeEmail('')).toBe('');
  });

  it('returns the lower-cased input unchanged when there is no @ to split on', () => {
    expect(normalizeEmail('NotAnEmail')).toBe('notanemail');
  });

  it('does not throw on an address with a missing local part or missing domain', () => {
    expect(normalizeEmail('@gmail.com')).toBe('@gmail.com');
    expect(normalizeEmail('jane@')).toBe('jane@');
  });
});

describe('isDisposableEmail — AC2', () => {
  it('blocks a listed apex domain', () => {
    expect(isDisposableEmail('a@mailinator.com')).toBe(true);
  });

  it('blocks a subdomain of a listed domain (parent-domain match)', () => {
    expect(isDisposableEmail('a@x.mailinator.com')).toBe(true);
  });

  it('allows a real mailbox provider', () => {
    expect(isDisposableEmail('a@gmail.com')).toBe(false);
  });

  it('is case-insensitive and tolerant of whitespace', () => {
    expect(isDisposableEmail('  A@MailInator.COM ')).toBe(true);
  });

  it('blocks entries from the local EXTRA_BLOCKED_DOMAINS list', () => {
    for (const domain of EXTRA_BLOCKED_DOMAINS) {
      expect(isDisposableEmail(`a@${domain}`)).toBe(true);
    }
  });

  it('never blocks on the bare TLD alone — a .com address is not disposable by itself', () => {
    expect(isDisposableEmail('a@buildographic.com')).toBe(false);
  });

  // null-input branch (AC13)
  it('returns false for empty or malformed input instead of throwing', () => {
    expect(isDisposableEmail('')).toBe(false);
    expect(isDisposableEmail('no-at-sign')).toBe(false);
    expect(isDisposableEmail('jane@')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC14/AC18 — internal test-account allowlist.
// The env var is saved and restored around every case so no test leaks state.
// ---------------------------------------------------------------------------
describe('isInternalTestEmail — AC14', () => {
  const original = process.env.INTERNAL_TEST_EMAIL_DOMAINS;

  beforeEach(() => {
    delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;
    else process.env.INTERNAL_TEST_EMAIL_DOMAINS = original;
  });

  describe('when the variable is unset or empty (the production posture)', () => {
    it('is false for every input, including an address on the usual test domain', () => {
      for (const value of [undefined, '', '   ', ',', ' , ']) {
        if (value === undefined) delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;
        else process.env.INTERNAL_TEST_EMAIL_DOMAINS = value;

        expect(isInternalTestEmail('a@test.local')).toBe(false);
        expect(isInternalTestEmail('a@gmail.com')).toBe(false);
        expect(isInternalTestEmail('e2e-1@test.local')).toBe(false);
      }
    });
  });

  describe('when set to test.local', () => {
    beforeEach(() => {
      process.env.INTERNAL_TEST_EMAIL_DOMAINS = 'test.local';
    });

    it('matches an address on exactly that domain', () => {
      expect(isInternalTestEmail('a@test.local')).toBe(true);
      expect(isInternalTestEmail('e2e-1758000000000@test.local')).toBe(true);
    });

    it('is case-insensitive on the address', () => {
      expect(isInternalTestEmail('a@TEST.LOCAL')).toBe(true);
      expect(isInternalTestEmail('  A@Test.Local  ')).toBe(true);
    });

    // The security property: allow lists must never widen the way block lists do.
    it('does NOT match a look-alike domain that merely ends with the allowlisted one', () => {
      expect(isInternalTestEmail('a@evil-test.local')).toBe(false);
    });

    it('does NOT match a subdomain of the allowlisted domain', () => {
      expect(isInternalTestEmail('a@sub.test.local')).toBe(false);
    });

    it('does NOT match a parent of the allowlisted domain', () => {
      expect(isInternalTestEmail('a@local')).toBe(false);
    });

    it('does not match an unrelated domain', () => {
      expect(isInternalTestEmail('a@gmail.com')).toBe(false);
    });

    // null-input branches (AC18)
    it('returns false for empty, malformed or non-string-ish input instead of throwing', () => {
      expect(isInternalTestEmail('')).toBe(false);
      expect(isInternalTestEmail(undefined as unknown as string)).toBe(false);
      expect(isInternalTestEmail(null as unknown as string)).toBe(false);
      expect(isInternalTestEmail('not-an-email')).toBe(false);
      expect(isInternalTestEmail('@test.local')).toBe(false);
      expect(isInternalTestEmail('a@')).toBe(false);
    });
  });

  it('accepts a comma-separated list with padding and mixed case', () => {
    process.env.INTERNAL_TEST_EMAIL_DOMAINS = ' Test.Local ,  qa.buildographic.com ';

    expect(isInternalTestEmail('a@test.local')).toBe(true);
    expect(isInternalTestEmail('a@qa.buildographic.com')).toBe(true);
    expect(isInternalTestEmail('a@buildographic.com')).toBe(false);
  });

  it('re-reads the variable on every call rather than caching it at import time', () => {
    expect(isInternalTestEmail('a@test.local')).toBe(false);

    process.env.INTERNAL_TEST_EMAIL_DOMAINS = 'test.local';
    expect(isInternalTestEmail('a@test.local')).toBe(true);

    delete process.env.INTERNAL_TEST_EMAIL_DOMAINS;
    expect(isInternalTestEmail('a@test.local')).toBe(false);
  });
});
