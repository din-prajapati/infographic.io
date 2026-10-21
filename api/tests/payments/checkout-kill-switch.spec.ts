/**
 * The checkout kill-switch (BETA_MODE) — D2.
 *
 * BL-29 happened because a guard that could never fire was believed to be
 * protecting checkout. These tests exist so that belief is checkable: they assert
 * the switch fires on the paths that take money, stays out of the way on the paths
 * that must keep working, and refuses to engage on anything but an exact `'true'`.
 *
 * Mock-based — the switch reads `process.env` and the controller's collaborators
 * are injected, so no database is needed.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import {
  isCheckoutDisabled,
  CHECKOUT_DISABLED_CODE,
  CHECKOUT_DISABLED_MESSAGE,
} from '../../src/modules/payments/checkout-kill-switch';
import { PaymentsController } from '../../src/modules/payments/controllers/payments.controller';

const ORIGINAL = process.env.BETA_MODE;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.BETA_MODE;
  else process.env.BETA_MODE = ORIGINAL;
});

describe('isCheckoutDisabled() — the switch itself', () => {
  it('engages on exactly "true"', () => {
    process.env.BETA_MODE = 'true';
    expect(isCheckoutDisabled()).toBe(true);
  });

  it('leaves checkout open when unset — the normal state', () => {
    delete process.env.BETA_MODE;
    expect(isCheckoutDisabled()).toBe(false);
  });

  // A mistyped variable that silently stopped all revenue would be a worse outage
  // than the one the switch was reached for, so it fails OPEN on anything fuzzy.
  it.each(['TRUE', 'True', '1', 'yes', 'on', '', ' true', 'false'])(
    'leaves checkout open for the non-exact value %o',
    (value) => {
      process.env.BETA_MODE = value;
      expect(isCheckoutDisabled()).toBe(false);
    },
  );

  it('is read per call, so a change within a process takes effect immediately', () => {
    delete process.env.BETA_MODE;
    expect(isCheckoutDisabled()).toBe(false);
    process.env.BETA_MODE = 'true';
    expect(isCheckoutDisabled()).toBe(true);
  });
});

describe('PaymentsController — which routes the switch covers', () => {
  let controller: PaymentsController;
  let payments: any;
  let analytics: any;

  beforeEach(() => {
    payments = {
      createSubscription: vi.fn().mockResolvedValue({ subscription: { id: 'sub_1' } }),
      updateSubscriptionPlan: vi.fn().mockResolvedValue({ id: 'sub_1' }),
      cancelSubscription: vi.fn().mockResolvedValue({ id: 'sub_1' }),
      verifyPayment: vi.fn().mockResolvedValue(true),
      getPaymentHistory: vi.fn().mockResolvedValue([]),
    };
    analytics = {};
    controller = new PaymentsController(payments, analytics);
  });

  const req = { user: { id: 'user_1' } } as any;

  describe('while the switch is ENGAGED', () => {
    beforeEach(() => {
      process.env.BETA_MODE = 'true';
    });

    it('refuses create-subscription with the documented code', async () => {
      await expect(
        controller.createSubscription({ planTier: 'SOLO' } as any, req),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(payments.createSubscription).not.toHaveBeenCalled();
    });

    it('carries the kill-switch code and message, not a generic 403', async () => {
      const err = await controller
        .createSubscription({ planTier: 'SOLO' } as any, req)
        .catch((e) => e);
      expect(err.getResponse()).toMatchObject({
        code: CHECKOUT_DISABLED_CODE,
        message: CHECKOUT_DISABLED_MESSAGE,
      });
    });

    // The hole this story closed: update-plan cancels the existing subscription and
    // creates a new one at the new tier, so it takes money — and it was unguarded.
    it('refuses update-plan — the path that was unguarded before D2', async () => {
      await expect(
        controller.updatePlan({ planTier: 'TEAM' } as any, req),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(payments.updateSubscriptionPlan).not.toHaveBeenCalled();
    });

    it('logs every refusal, so an engaged switch is never silent', async () => {
      const warn = vi.spyOn((controller as any).logger, 'warn');
      await controller.createSubscription({ planTier: 'SOLO' } as any, req).catch(() => {});
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('BETA_MODE'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('create-subscription'));
    });

    // A switch that strands in-flight money is worse than the problem it solves.
    it('still allows cancel — a customer must always be able to stop paying', async () => {
      await expect(controller.cancelSubscription({} as any, req)).resolves.toBeTruthy();
      expect(payments.cancelSubscription).toHaveBeenCalled();
    });

    it('still allows verify — a customer mid-checkout must not be stranded', async () => {
      await expect(
        controller.verifyPayment({
          razorpayPaymentId: 'pay_1',
          razorpaySubscriptionId: 'sub_1',
          razorpaySignature: 'sig',
        } as any),
      ).resolves.toMatchObject({ verified: true });
    });

    it('still allows reading payment history — billing off is not a reason to hide records', async () => {
      await expect(controller.getPaymentHistory(req)).resolves.toBeTruthy();
    });
  });

  describe('while the switch is OFF — the normal state', () => {
    beforeEach(() => {
      delete process.env.BETA_MODE;
    });

    it('allows create-subscription through to the service', async () => {
      await controller.createSubscription({ planTier: 'SOLO' } as any, req);
      expect(payments.createSubscription).toHaveBeenCalled();
    });

    it('allows update-plan through to the service', async () => {
      await controller.updatePlan({ planTier: 'TEAM' } as any, req);
      expect(payments.updateSubscriptionPlan).toHaveBeenCalled();
    });
  });
});
