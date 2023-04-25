import { BadRequestException, inject, injectable } from "@leapjs/common";
import { User } from "app/users/model/User";
import { UserService } from "app/users/service/user";

import otp from "@distrentic/totp";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";

import { OTPModel } from "../model/otp";

@injectable()
export class OTPService {
  @inject(() => UserService)
  private userService!: UserService;

  public async generateOtp(): Promise<number> {
    const min = 1000;
    const max = 9999;
    const otp = Math.floor(Math.random() * (max - min + 1) + min);
    return otp;
  }
  public async sendOtpToPhone(phone: number, user: ObjectId): Promise<any> {
    return this.OtpToPhone(phone, await this.generateOtp(), user);
  }

  public async OtpToPhone(phone: number, otp: number, user: ObjectId) {
    const checkUser: User = await this.userService.checkUserPhoneNumber(phone);
    if (checkUser) {
      const save = await new OTPModel({
        number: phone,
        otp: otp,
        user,
      }).save();
      return save;
    }
    throw new BadRequestException("Phone number is not registered");
  }

  public async generateOTP() {
    const secret = uuidv4();
    console.log(secret);

    const token = Buffer.from(secret, "utf-8");
    const code = otp.generateCode(token);
    console.log(token);
    return { token: secret, otp: code };
  }
  public async verifyOTP(code: any, securityStamp: any) {
    const token = Buffer.from(securityStamp, "utf-8");
    const isValid = await otp.validateCode(code, token);
    console.log(isValid);
    return isValid;
  }
}
