import { Middleware } from "@leapjs/router";
import { NextFunction, Request, Response } from "express";

@Middleware()
export class UserControllerValidation {
  public async before(req: Request, res: Response, next: NextFunction): Promise<any> {
    //registration validation
    const phone: number = req.body.phone;
    //verify phone
    /**
     * if(verified(phone)){
     *  next()
     * }
     */

    return res.status(422).json({ message: "Phone is not verified yet" });
  }
}
