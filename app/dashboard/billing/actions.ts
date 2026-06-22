'use server';

import { auth } from '@relipay/nextjs/server';
import { revalidatePath } from 'next/cache';
import { relipay } from '../../../lib/relipay';
import { saveMockSubscription } from '../../../lib/db';

// Create a real checkout session using the ReliPay SDK
export async function createCheckoutAction(planSlug: string, provider?: 'stripe' | 'paypal' | 'razorpay') {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized: You must be signed in to access billing checkout.' };
  }

  // Define checkout redirection target pages
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing?status=success`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing?status=cancelled`;

  try {
    const outcome = await relipay.billing.createCheckout(session.accessToken, {
      planSlug,
      successUrl,
      cancelUrl,
      provider,
    });
    
    return { url: outcome.url };
  } catch (error: any) {
    console.error('ReliPay Billing SDK Checkout Creation Failed:', error);
    return {
      error: error.message || 'ReliPay checkout is currently unavailable. Please check panel settings or use the local bypass.'
    };
  }
}

// Persist a mock subscription locally to test limits immediately
export async function upgradeMockSubscriptionAction(planSlug: 'monthly' | 'yearly') {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized: You must be signed in to modify subscription status.');
  }

  await saveMockSubscription(session.user.id, planSlug);
  
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/billing');
  return { success: true };
}

// Reset the local mock subscription, returning the user to the Free tier
export async function resetToFreeAction() {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized: You must be signed in to modify subscription status.');
  }

  await saveMockSubscription(session.user.id, 'free');
  
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/billing');
  return { success: true };
}
