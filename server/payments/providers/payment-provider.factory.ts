import { IPaymentProvider, PaymentProviderType } from '../interfaces/payment-provider.interface';
import { RazorpayProvider } from './razorpay.provider';
import { StripeProvider } from './stripe.provider';

/**
 * Payment Provider Factory
 * 
 * Manages provider selection based on:
 * - Feature flags (STRIPE_ENABLED)
 * - Currency (INR → RazorPay, USD/EUR → Stripe when enabled)
 * - Region-based selection
 * - Explicit provider choice
 * 
 * ROUTING LOGIC:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Currency/Region        │  STRIPE_ENABLED=false │ =true    │
 * ├─────────────────────────┼───────────────────────┼──────────┤
 * │  INR / India            │  RazorPay             │ RazorPay │
 * │  USD / US, Canada       │  RazorPay             │ Stripe   │
 * │  EUR / Europe           │  RazorPay             │ Stripe   │
 * │  Other                  │  RazorPay             │ RazorPay │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * Usage:
 *   const factory = new PaymentProviderFactory();
 *   const provider = factory.getProvider('IN');           // RazorPay
 *   const provider = factory.getProvider('US');           // Stripe (if enabled)
 *   const provider = factory.getProviderByCurrency('USD'); // Stripe (if enabled)
 */
export class PaymentProviderFactory {
  private razorpayProvider: RazorpayProvider;
  private stripeProvider: StripeProvider | null = null;

  constructor() {
    this.razorpayProvider = new RazorpayProvider();
    
    // Only initialize Stripe if enabled via feature flag
    if (StripeProvider.isEnabled()) {
      this.stripeProvider = new StripeProvider();
    }
  }

  /**
   * Check if Stripe is enabled via feature flag
   */
  isStripeEnabled(): boolean {
    return StripeProvider.isEnabled();
  }

  /**
   * Get payment provider based on region or explicit selection
   * @param region - User's region code (e.g., 'IN', 'US', 'SG')
   * @param explicitProvider - Explicit provider to use (overrides region)
   */
  getProvider(region?: string | null, explicitProvider?: PaymentProviderType): IPaymentProvider {
    // If explicit provider is specified, use that
    if (explicitProvider) {
      return this.getProviderByType(explicitProvider);
    }

    // If region is specified, select optimal provider for that region
    if (region) {
      return this.getProviderByRegion(region);
    }

    // Default to RazorPay
    return this.razorpayProvider;
  }

  /**
   * Get provider based on currency
   * This is the primary routing method for payments
   * @param currency - Currency code (e.g., 'INR', 'USD', 'EUR')
   */
  getProviderByCurrency(currency: string): IPaymentProvider {
    const normalizedCurrency = currency.toUpperCase();

    // INR always goes to RazorPay (best for Indian payments)
    if (normalizedCurrency === 'INR') {
      return this.razorpayProvider;
    }

    // USD, EUR, GBP → Stripe (when enabled)
    if (['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(normalizedCurrency)) {
      if (this.isStripeEnabled() && this.stripeProvider) {
        return this.stripeProvider;
      }
    }

    // Default to RazorPay
    return this.razorpayProvider;
  }

  /**
   * Get provider by explicit type
   */
  private getProviderByType(provider: PaymentProviderType): IPaymentProvider {
    switch (provider) {
      case 'RAZORPAY':
        return this.razorpayProvider;
      case 'STRIPE':
        if (!this.isStripeEnabled()) {
          throw new Error('Stripe is not enabled. Set STRIPE_ENABLED=true to use Stripe.');
        }
        if (!this.stripeProvider) {
          this.stripeProvider = new StripeProvider();
        }
        return this.stripeProvider;
      case 'PADDLE':
        throw new Error('Paddle provider not yet implemented');
      case 'PAYPAL':
        throw new Error('PayPal provider not yet implemented');
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Select optimal provider based on user's region
   */
  private getProviderByRegion(region: string): IPaymentProvider {
    const normalizedRegion = region.toUpperCase();

    // India → RazorPay (always, regardless of feature flag)
    if (normalizedRegion === 'IN') {
      return this.razorpayProvider;
    }

    // Asia-Pacific → RazorPay (good APAC support)
    if (['SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'HK'].includes(normalizedRegion)) {
      return this.razorpayProvider;
    }

    // North America → Stripe (when enabled)
    if (['US', 'CA'].includes(normalizedRegion)) {
      if (this.isStripeEnabled() && this.stripeProvider) {
        return this.stripeProvider;
      }
      return this.razorpayProvider;
    }

    // Europe → Stripe (when enabled)
    if (['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT'].includes(normalizedRegion)) {
      if (this.isStripeEnabled() && this.stripeProvider) {
        return this.stripeProvider;
      }
      return this.razorpayProvider;
    }

    // Australia/NZ → Stripe (when enabled)
    if (['AU', 'NZ'].includes(normalizedRegion)) {
      if (this.isStripeEnabled() && this.stripeProvider) {
        return this.stripeProvider;
      }
      return this.razorpayProvider;
    }

    // Default fallback to RazorPay
    return this.razorpayProvider;
  }

  /**
   * Check if a provider is available/configured
   * Respects feature flags
   */
  isProviderAvailable(provider: PaymentProviderType): boolean {
    switch (provider) {
      case 'RAZORPAY':
        return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
      case 'STRIPE':
        // Must be enabled AND configured
        return StripeProvider.isEnabled() && StripeProvider.isConfigured();
      case 'PADDLE':
        return !!process.env.PADDLE_API_KEY;
      case 'PAYPAL':
        return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
      default:
        return false;
    }
  }

  /**
   * Get list of all available providers
   * Only returns providers that are enabled AND configured
   */
  getAvailableProviders(): PaymentProviderType[] {
    const providers: PaymentProviderType[] = [];
    
    if (this.isProviderAvailable('RAZORPAY')) providers.push('RAZORPAY');
    if (this.isProviderAvailable('STRIPE')) providers.push('STRIPE');
    if (this.isProviderAvailable('PADDLE')) providers.push('PADDLE');
    if (this.isProviderAvailable('PAYPAL')) providers.push('PAYPAL');
    
    return providers;
  }

  /**
   * Get provider info for frontend display
   * Returns which provider will be used for a given currency/region
   */
  getProviderInfo(currency?: string, region?: string): {
    provider: PaymentProviderType;
    name: string;
    stripeEnabled: boolean;
  } {
    let selectedProvider: IPaymentProvider;
    
    if (currency) {
      selectedProvider = this.getProviderByCurrency(currency);
    } else if (region) {
      selectedProvider = this.getProviderByRegion(region);
    } else {
      selectedProvider = this.razorpayProvider;
    }

    const providerType = selectedProvider.getProviderName();
    const displayNames: Record<PaymentProviderType, string> = {
      RAZORPAY: 'RazorPay',
      STRIPE: 'Stripe',
      PADDLE: 'Paddle',
      PAYPAL: 'PayPal',
    };

    return {
      provider: providerType,
      name: displayNames[providerType],
      stripeEnabled: this.isStripeEnabled(),
    };
  }
}

export const paymentProviderFactory = new PaymentProviderFactory();
