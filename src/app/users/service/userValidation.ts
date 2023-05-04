import { injectable } from "@leapjs/common";
import { UserModel } from "../model/User";

@injectable()
export class UserValidationService {
  public async verify(phone: number): Promise<boolean> {
    // const
    return true;
  }
  public async changeReferredByToObjectId(referralId: string) {
    
    const data = await UserModel.findOne({ referralId });
    if (!data) {
      return null;
    }
    if (data._id) return data._id;
    return null
  }
}
