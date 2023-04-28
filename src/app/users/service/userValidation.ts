import { injectable } from "@leapjs/common";
import { UserModel } from "../model/User";


@injectable()
export class UserValidationService {
  public async verify(phone: number): Promise<boolean> {
    // const 
    return true;
  }
  public async changereferredByToObjectId(referralId:string){
    const data= await UserModel.findOne({referralId})
    console.log(data,"123456789");
    
    return data._id
  }
}