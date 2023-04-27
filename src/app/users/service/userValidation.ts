import { injectable } from "@leapjs/common";


@injectable()
export class UserValidationService {
  public async verified(phone: number): Promise<boolean> {
    return true;
  }
}