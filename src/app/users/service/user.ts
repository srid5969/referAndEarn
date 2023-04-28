import { ConflictException, HttpStatus, inject, injectable } from "@leapjs/common";
import { OTPService } from "app/otp/service/otp";
import { ReferService } from "app/referral/service/referral";
import { TokenModel } from "app/userSession/model/usersToken";
import { User, UserModel } from "app/users/model/User";
import { ResponseMessage, ResponseReturnType } from "common/response/response.types";
import jsonwebtoken, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { configurations } from "configuration/manager";

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
        let referralId: any = data.referredBy;
        let owner: any;
        data.referralId = await this.referAppService.generateReferralId(6);

        if (data.referredBy) {
          owner = await UserModel.findOne({ referralId: data.referredBy });

          if (!owner) {
            const result: ResponseReturnType = {
              code: HttpStatus.UNPROCESSABLE_ENTITY,
              message: "Referral id does not match to any user",
              error: "User valid referral id to avoid the error",
              data: null,
              status: true,
            };
            return resolve(result);
          }
          const referringUser = owner._id;
          data.referredBy = referringUser;
        }
        const saveUser: User | any = await new UserModel(data).save();
        if (data.referredBy) {
          const push = await UserModel.updateOne({ _id: data.referredBy }, { $push: { referrals: saveUser._id } });
          console.log(push);

          const t = await this.referAppService.saveReferralUser({
            owner: owner,
            referralId: referralId,
            user: saveUser,
          });
          console.log(t);
        }

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
  
  /**
   * @login - otp verification 
   * @param {otp,token}
   * @returns {ResponseReturnType}
   */
  public async verifyOtp(payload: any): Promise<ResponseReturnType> {
    try {
      const { otp, token } = payload;
      const user = await this.otpService.verifyOTP(otp, token);

      if (user) {
        const userData = await UserModel.findOne({ _id: user });
        const payload: JwtPayload = Object.assign({}, { userId: userData._id }, { date: Date.now() }, { exp: 60 * 60 * 24 * 21 });
        const option: SignOptions = {} as SignOptions;
        const secret: Secret = configurations.jwtSecret || "";
        const jwtToken = await jsonwebtoken.sign(payload, secret, option);
        const saveToken = await new TokenModel({
          token: jwtToken,
          user: userData,
        }).save();
        return {
          code: HttpStatus.OK,
          data: { token: jwtToken, referredBy: userData.referredBy, referralId: userData.referralId, referrals: userData.referrals, referralAmount: userData.referralAmount, phone: userData.phone, id: userData._id },
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
    } catch (err: any) {
      console.log(err);

      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        data: "server side error",
        status: false,
        error: err,
        message: "server issue",
      };
    }
  }
}
