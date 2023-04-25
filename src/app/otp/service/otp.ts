import { BadRequestException, HttpException, HttpStatus, inject, injectable } from "@leapjs/common";
import { User } from "app/users/model/User";
import { UserService } from "app/users/service/user";
import { OTP, OTPModel } from "../model/otp";
import { ObjectId } from "mongodb";

@injectable()
export class OTPService {
  @inject(UserService)
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
}
