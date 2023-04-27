import { injectable } from "@leapjs/common";
import { ResponseReturnType } from "common/response/response.types";

@injectable()
export class PhoneNumberVerifyService {
  /**
   * @param {number} phone
   * @return {*}  {Promise<ResponseReturnType>}
   * @memberof PhoneNumberVerifyService
   */
  public async verifyNumber(phone: number): Promise<ResponseReturnType> {
    /**
     * @kind first get the valid number to sent otp
     * @event signup - this verification is used for sign up verification
     */

    // const {token,otp}=sentOtp(phone);

    return {
      code: 200,
      data: null,
      error: null,
      message: "Otp has been sended successfully",
      status: true,
    };
  }
}
