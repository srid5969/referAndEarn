import { injectable } from "@leapjs/common";
import { UserModel } from "../model/User";

@injectable()
export class UserValidationService {
  public async verify(phone: number): Promise<boolean> {
    // const
    return true;
  }
  public async changeReferredByToObjectId(referralId: string) {
    const { _id: data } = await UserModel.findOne({ referralId }, { _id: 1 });
    console.log(data, "kjqbfsbfkabsdlfkbahskdflkhasldf");

    if (!data) {
      return false;
    }
    if (data) return data;
    return false;
  }
}
