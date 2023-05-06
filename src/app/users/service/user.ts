import {ConflictException, HttpStatus, inject, injectable} from "@leapjs/common";
import {OTPService} from "app/otp/service/otp";
import {ReferService} from "app/referral/service/referral";
import {TokenModel} from "app/userSession/model/usersToken";
import {User, UserModel} from "app/users/model/User";
import {ResponseMessage, ResponseReturnType} from "common/response/response.types";
import jsonwebtoken, {JwtPayload, Secret, SignOptions} from "jsonwebtoken";
import {configurations} from "configuration/manager";
import {ObjectId} from "mongodb";

@injectable()
export class UserService {
    @inject(() => ReferService)
    private readonly referAppService!: ReferService;
    @inject(() => OTPService)
    private readonly otpService!: OTPService;

    public async checkUserPhoneNumber(phone: number): Promise<any> {
        return new Promise<boolean>(async (resolve): Promise<any> => {
            const registeredUser = await UserModel.findOne({phone: phone});
            if (registeredUser) {
                return resolve(registeredUser);
            }
            return resolve(false);
        });
    }

    public async getUserById(id: any): Promise<ResponseReturnType> {
        const data = await UserModel.findOne({_id: id});
        return {
            code: HttpStatus.ACCEPTED,
            message: ResponseMessage.Success,
            data,
            error: null,
            status: true,
        };
    }

    /**
     * login
     */
    public async loginOrRegister(phone: number): Promise<ResponseReturnType | any> {
        const userData = await this.checkUserPhoneNumber(phone);
        if (!userData) return await this.registeringMobile(phone);
        if (userData.verified) {
            const token = await this.otpService.generateOTP(phone, userData);
            return {
                code: HttpStatus.OK,
                existingUser: true,
                data: token,
                error: null,
                message: "The otp has been sent successfully",
                status: true,
            };
        } else if (!userData.verified) {
            const token = await this.otpService.generateOTP(phone, userData);
            return {
                code: HttpStatus.OK,
                existingUser: false,
                data: token,
                error: null,
                message: "The otp has been sent successfully and the user verification is still pending",
                status: true,
            };
        } else {
            return await this.registeringMobile(phone);
        }
    }

    public async logout(bearerToken: string): Promise<ResponseReturnType> {
        try {
            const token: string = bearerToken.split(" ")[1];

            const deletedToken = await TokenModel.updateOne({token, expired: false}, {token: null, expired: true});
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
     * @returns {ResponseReturnType}
     * @param payload
     */

    public async signUpWithId({_id, payload}: { _id: ObjectId; payload: User | any }): Promise<ResponseReturnType> {
        console.log(payload);

        if (payload.referredBy) {
            // checking if the device id is not presented in database - to avoid multiple time registration in same mobile with multiple referral code
            const existingDeviceId = await UserModel.findOne({deviceId: payload.deviceId, _id: {$ne: _id}});

            if (existingDeviceId) {
                return {
                    code: HttpStatus.NOT_ACCEPTABLE,
                    data: null,
                    error: "This device has been already registered using another phone number",
                    message: "This device trying multiple referrals",
                    status: false,
                };
            }
            const update = await UserModel.updateOne({_id}, {$set: payload});
            console.log(update);

            if (update.modifiedCount == 1) {
                payload.user = _id;
                payload.referralId = payload.referralid;
                payload.owner = payload.referredBy;
                console.log(payload);

                const up = await this.referAppService.saveReferralUser({
                    owner: payload.referredBy,
                    referralId: payload.referralid,
                    user: _id
                });
                console.log(up);

                return {
                    code: HttpStatus.OK,
                    message: "success",
                    data: null,
                    error: null,
                    status: true,
                };
            }
            return {
                code: HttpStatus.FORBIDDEN,
                status: false,
                message: "repeated changes not allowed",
                data: null,
                error: "null",
            };
        }

        const updateProfile = await UserModel.findOneAndUpdate({_id}, payload);

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
    public async registeringMobile(phone: number): Promise<ResponseReturnType | any> {
        try {
            const saveNumber = await new UserModel({
                phone,
                verified: false,
                referralId: await this.referAppService.generateReferralId(6)
            }).save();

            const token = await this.otpService.generateOTP(phone, saveNumber._id);
            return {
                code: 200,
                existingUser: false,
                message: "OTP has been successfully send",
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
        const {otp, token} = payload;

        const user: ObjectId | boolean = await this.otpService.verifyOTP(otp, token);

        if (user) {
            const userData = await UserModel.findOneAndUpdate({_id: user}, {verified: true});
            const data: any = await this.generateJWT(userData);
            data.existingUser = userData.verified;
            return data;
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
        const payload: JwtPayload = Object.assign({}, {userId: userData._id}, {date: Date.now()}, {exp: 60 * 60 * 24 * 21});
        const option: SignOptions = {} as SignOptions;
        const secret: Secret = configurations.jwtSecret || "";
        const jwtToken = await jsonwebtoken.sign(payload, secret, option);
        await new TokenModel({
            token: jwtToken,
            user: userData,
        }).save();
        return {
            code: HttpStatus.OK,
            data: {
                token: jwtToken,
                referredBy: userData.referredBy,
                referralId: userData.referralId,
                referrals: userData.referrals,
                referralAmount: userData.referralAmount,
                phone: userData.phone,
                id: userData._id
            },
            status: true,
            error: null,
            message: "OTP successfully verified",
        };
    }
}
