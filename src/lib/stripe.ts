import { loadStripe } from '@stripe/stripe-js';

// Replace with your Stripe publishable key
const stripePublishableKey = 'pk_test_51OxYzTLxJKXBvQPZGwVZwdXVFAVAVAVAVAVAVAVA';

export const stripePromise = loadStripe(stripePublishableKey);

export const createCheckoutSession = async (priceId: string, userId: string) => {
  try {
    // In a real implementation, this would be a call to your backend
    // which would create a Stripe Checkout session
    
    // Example of how this would work with a serverless function:
    // const response = await fetch('/api/create-checkout-session', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     priceId,
    //     userId,
    //   }),
    // });
    
    // const session = await response.json();
    // return session.id;
    
    // For demo purposes, we'll just return a mock session ID
    console.log(`Creating checkout session for price ${priceId} and user ${userId}`);
    return 'cs_test_mockSessionId';
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const createCustomerPortalSession = async (userId: string) => {
  try {
    // In a real implementation, this would be a call to your backend
    // which would create a Stripe Customer Portal session
    
    // Example of how this would work with a serverless function:
    // const response = await fetch('/api/create-customer-portal-session', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     userId,
    //   }),
    // });
    
    // const session = await response.json();
    // return session.url;
    
    // For demo purposes, we'll just return a mock URL
    console.log(`Creating customer portal session for user ${userId}`);
    return 'https://billing.stripe.com/p/session/mockPortalSessionId';
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId: string, userId: string) => {
  try {
    // In a real implementation, this would be a call to your backend
    // which would cancel the subscription in Stripe
    
    // Example of how this would work with a serverless function:
    // const response = await fetch('/api/cancel-subscription', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     subscriptionId,
    //     userId,
    //   }),
    // });
    
    // return await response.json();
    
    // For demo purposes, we'll just log the cancellation
    console.log(`Canceling subscription ${subscriptionId} for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

// Stripe price IDs for each plan
export const STRIPE_PRICE_IDS = {
  basic: 'price_basic_monthly',
  pro: 'price_pro_monthly',
  enterprise: 'price_enterprise_monthly',
};

// Plan details
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 200,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Bis zu 1.000 Leads',
      'KI-E-Mail Kampagnen',
      'Basis Support per Mail',
      'Standard E-Mail Vorlagen',
      '2 Kampagnen gleichzeitig'
    ],
    limits: {
      maxLeads: 1000,
      maxCampaigns: 2
    }
  },
  pro: {
    name: 'Pro Plan',
    price: 500,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Bis zu 25.000 Leads',
      'Alle Basic Features',
      'KI-E-Mail Kampagnen',
      'Prio Support per Slack',
      'Erweiterte E-Mail Vorlagen',
      '10 Kampagnen gleichzeitig'
    ],
    limits: {
      maxLeads: 25000,
      maxCampaigns: 10
    }
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: null, // Custom pricing
    currency: 'EUR',
    interval: 'month',
    features: [
      'Unbegrenzte Leads',
      'Alle Pro Features',
      'Dedizierter Account Manager',
      'Benutzerdefinierte Integrationen',
      'Unbegrenzte Kampagnen'
    ],
    limits: {
      maxLeads: Infinity,
      maxCampaigns: Infinity
    }
  }
};
