import { ConflictException, HttpStatus, inject, injectable } from "@leapjs/common";
import { OTPService } from "app/otp/service/otp";
import { ReferService } from "app/referral/service/referral";
import { TokenModel } from "app/userSession/model/usersToken";
import { User, UserModel } from "app/users/model/User";
import { ResponseMessage, ResponseReturnType } from "common/response/response.types";
import jsonwebtoken, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { configurations } from "configuration/manager";
import { ObjectId } from "mongodb";

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
        let owner: any = null;
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
    return await this.registeringMobile(phone);
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
        return await this.generateJWT(userData);
      }
      return {
        code: HttpStatus.UNAUTHORIZED,
        data: "Cannot verify",
        status: false,
        error: "Wrong otp",
        message: "OTP cannot be verified",
      };
    } catch (err: any) {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        data: "server side error",
        status: false,
        error: err,
        message: "server issue",
      };
    }
  }

  public async signUpWithId(_id: ObjectId, payload: User): Promise<ResponseReturnType> {
    if (payload.referredBy) {
      // checking if the device id is not presented in database - to avoid multiple time registration in same mobile with multiple referral code
      const existingDeviceId = await UserModel.findOne({ deviceId: payload.deviceId, _id: { $ne: _id } });

      if (existingDeviceId) {
        return {
          code: HttpStatus.NOT_ACCEPTABLE,
          data: null,
          error: "This device has been already registered using another phone number",
          message: "This device trying multiple referrals",
          status: false,
        };
      }
    }

    const updateProfile = await UserModel.findOneAndUpdate({ _id }, payload);

    if (!updateProfile) {
      return {
        code: HttpStatus.NOT_MODIFIED,
        message: "This doc cannot be modified",
        error: "Must be a server side issue",
        data: null,
        status: false,
      };
    }
    return {
      code: HttpStatus.OK,
      data: await this.generateJWT(updateProfile),
      error: null,
      message: "Successfully registered",
      status: true,
    };
  }

  /**
   * @params {number}
   */
  public async registeringMobile(phone: number): Promise<ResponseReturnType> {
    try {
      const saveNumber = await new UserModel({ phone, verified: false, referralId: await this.referAppService.generateReferralId(6) }).save();

      const token = await this.otpService.generateOTP(phone, saveNumber._id);
      return {
        code: 200,
        message: "OTP has been successfully sended",
        data: token,
        error: null,
        status: true,
      };
    } catch (error) {
      return {
        code: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "Trouble in paradise",
        error,
        data: null,
        status: false,
      };
    }
  }
  public async verifyOTP(payload: any): Promise<ResponseReturnType> {
    const { otp, token } = payload;

    const user: ObjectId | boolean = await this.otpService.verifyOTP(otp, token);
    if (user) {
      await UserModel.updateOne({ _id: user }, { $set: { verified: true } });
      return {
        code: 200,
        status: true,
        message: "Otp has been successfully verified",
        error: null,
        data: null,
      };
    }
    return {
      code: HttpStatus.NON_AUTHORITATIVE_INFORMATION,
      status: false,
      message: "Otp  cannot verified",
      error: null,
      data: null,
    };
  }
  public async generateJWT(userData: any) {
    const payload: JwtPayload = Object.assign({}, { userId: userData._id }, { date: Date.now() }, { exp: 60 * 60 * 24 * 21 });
    const option: SignOptions = {} as SignOptions;
    const secret: Secret = configurations.jwtSecret || "";
    const jwtToken = await jsonwebtoken.sign(payload, secret, option);
    await new TokenModel({
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
}
