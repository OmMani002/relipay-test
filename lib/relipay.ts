import { ReliPay } from '@relipay/node';

let _relipay: ReliPay | null = null;

function getReliPayInstance(): ReliPay {
  if (!_relipay) {
    _relipay = new ReliPay({
      apiUrl: process.env.RELIPAY_URL || 'https://api.relipay.dev',
      secretKey: process.env.RELIPAY_SECRET || 'rp_dummy_key_for_build',
    });
  }
  return _relipay;
}

export const relipay = new Proxy({} as ReliPay, {
  get(target, prop) {
    const instance = getReliPayInstance();
    const value = Reflect.get(instance, prop);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

