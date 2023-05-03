import { injectable } from "@leapjs/common";

import otp from "@distrentic/totp";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";

import { OTPModel } from "../model/otp";

@injectable()
export class OTPService {
  public async generateOtp(): Promise<number> {
    const min = 1000;
    const max = 9999;
    const otp = Math.floor(Math.random() * (max - min + 1) + min);
    return otp;
  }
  public async generateOTP(phone: number, user: ObjectId): Promise<any> {
    return this.OtpToPhone(phone, user);
  }

  public async OtpToPhone(phone: number, user: ObjectId) {
    const save = await new OTPModel({
      number: phone,
      otp: await this.generateOtp(),
      token: await uuidv4(),
      user: user,
    }).save();
    return await { token: save.token, otp: save.otp };
  }
  /**
   *
   *
   * @param {string} [secret]
   * @return {*}
   * @memberof OTPService
   * @return {authenticity_token ,otp}
   */
  public async sendOtpToPhone(secret?: string) {
    if (!secret) secret = uuidv4();
    const token = Buffer.from(secret, "utf-8");
    const code = otp.generateCode(token);

    return { authenticity_token: secret, otp: code };
  }
  public async verifyOTP(otp: any, token: any): Promise<any> {
    const t = await OTPModel.findOneAndDelete({ token, otp });

    if (t) return await t.user;
    return null;
  }
}
