import { injectable } from "@leapjs/common";
import crypto from "crypto";
import { ReferralUserModel, UserReferral } from "../model/referUsers";
import { UserModel } from "app/users/model/User";
import { ResponseReturnType } from "common/response/response.types";

@injectable()
export class ReferService {
  generateReferralId(length: number) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomBytes = crypto.randomBytes(length);
    const result = new Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = characters[randomBytes[i] % characters.length];
    }
    return result.join("");
  }

  public async getMyReferralsDetails(userId: string): Promise<ResponseReturnType> {
    const users = await ReferralUserModel.find({ owner: userId }).populate({ path: "user", model: UserModel, select: "name phone _id" });
    const result: ResponseReturnType = {
      code: 200,
      status: true,
      data: users,
      error: null,
      message: "Success",
    };
    return result;
  }

  public async saveReferralUser(payload: UserReferral | any): Promise<any> {
    return await new ReferralUserModel(payload).save();
  }
}
