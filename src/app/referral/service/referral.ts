import { injectable } from '@leapjs/common';
import crypto from 'crypto';

@injectable()
export class ReferService {
  generateReferralId(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = crypto.randomBytes(length);
    const result = new Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = characters[randomBytes[i] % characters.length];
    }
    return result.join('');
  }

  
}
