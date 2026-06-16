import { ReliPay } from '@relipay/node';

export const relipay = new ReliPay({
  apiUrl: process.env.RELIPAY_URL || 'https://api.relipay.dev',
  secretKey: process.env.RELIPAY_SECRET || '',
});
