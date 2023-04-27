import { inject } from "@leapjs/common";
import { Middleware } from "@leapjs/router";
import { NextFunction, Request, Response } from "express";
import { UserValidationService } from "../service/userValidation";

@Middleware()
export class UserControllerValidation {
  @inject(UserValidationService)
  private readonly service!: UserValidationService;
  public async before(req: Request, res: Response, next: NextFunction): Promise<any> {
    //registration validation
    const phone: number = req.body.phone;
    //verify phone
    const verified: boolean = await this.service.verified(phone);

    if (verified) {
      next();
    }

    return res.status(422).json({ message: "Phone is not verified yet" });
  }
}
