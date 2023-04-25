import { ConflictException, HttpStatus, inject, injectable } from "@leapjs/common";
import { OTPService } from "app/otp/service/otp";
import { ReferService } from "app/referral/service/referral";
import { TokenModel } from "app/userSession/model/usersToken";
import { User, UserModel } from "app/users/model/User";
import { ResponseMessage, ResponseReturnType } from "common/response/response.types";

@injectable()
export class UserService {
  @inject(() => ReferService)
  private readonly referAppService!: ReferService;
  @inject(() => OTPService)
  private readonly otpService!: OTPService;
  public async checkUserPhoneNumber(phone: number): Promise<any> {
    return new Promise<boolean>(async (resolve) => {
      const registeredUser = await UserModel.findOne({ phone: phone });
      if (registeredUser) {
        return resolve(registeredUser);
      }
      return resolve(false);
    });
  }
  public async getUserById(id: any): Promise<ResponseReturnType> {
    const data = await UserModel.findOne({ _id: id });
    return {
      code: HttpStatus.ACCEPTED,
      message: ResponseMessage.Success,
      data,
      error: null,
      status: true,
    };
  }

  public async userSignUp(data: User): Promise<ResponseReturnType> {
    return new Promise<ResponseReturnType>(async (resolve, reject) => {
      try {
        data.referralId = await this.referAppService.generateReferralId(6);
        const saveUser = await new UserModel(data).save();
        return resolve({
          code: HttpStatus.ACCEPTED,
          message: ResponseMessage.Success,
          data: saveUser,
          error: null,
          status: true,
        });
      } catch (error: any) {
        return reject({
          code: error.status || HttpStatus.CONFLICT,
          message: ResponseMessage.Failed,
          data: null,
          error,
          status: false,
        });
      }
    });
  }
  /**
   * login
   */
  public async loginOrRegister(phone: number): Promise<ResponseReturnType | any> {
    const userData = await this.checkUserPhoneNumber(phone);
    if (userData) {
      const token = await this.otpService.generateOTP(phone, userData);
      return {
        code: HttpStatus.OK,
        existingUser: true,
        data: token,
        error: null,
        message: "The otp has been sent successfully",
        status: true,
      };
    }
    return {
      code: HttpStatus.PERMANENT_REDIRECT,
      existingUser: false,
      data: null,
      error: null,
      message: "New User",
      status: true,
    };
  }
  public async getAllUsers() {
    return UserModel.find({});
  }
  public async logout(bearerToken: string): Promise<ResponseReturnType> {
    try {
      const token: string = bearerToken.split(" ")[1];

      const deletedToken = await TokenModel.updateOne({ token, expired: false }, { token: null, expired: true });
      if (deletedToken.modifiedCount == 0) {
        throw new ConflictException("cannot modify", "this token has been expired already");
      }
      return {
        code: HttpStatus.OK,
        data: "Thank you",
        error: null,
        message: "Successfully logged out",
        status: true,
      };
    } catch (error) {
      return {
        code: HttpStatus.UNAUTHORIZED,
        data: null,
        error,
        message: "something went wrong",
        status: false,
      };
    }
  }

  public async verifyOtp(payload: any): Promise<ResponseReturnType> {
    const { otp, token } = payload;
    const isVerified = await this.otpService.verifyOTP(otp, token);
    if (isVerified) {
      return {
        code: HttpStatus.OK,
        data: "Welcome user",
        status: true,
        error: null,
        message: "OTP successfully verified",
      };
    }
    return {
      code: HttpStatus.UNAUTHORIZED,
      data: "Cannot verify",
      status: false,
      error: "Wrong otp",
      message: "OTP cannot be verified",
    };
  }
}
