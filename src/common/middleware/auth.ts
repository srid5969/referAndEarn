import { Middleware } from "@leapjs/router";
import { NextFunction, Response } from "express";
import { TokenModel } from "./../../app/userSession/model/usersToken";
import { AUTH_TOKEN_INVALID } from "./../../resources/strings/middleware/authentication";

@Middleware()
class Authentication {
  public async before(req: any, res: Response, next: NextFunction): Promise<any> {
    if (!req.headers.authorization) {
      return res.status(404).json({ message: "Token Not Found", status: "Failed" });
    }

    let token: any = req.headers.authorization.split(" ") || "";
    if (token[1]) {
      const data = await TokenModel.findOne({ token: token[1], expired: false });
      if (data) {
        req.user = data.user;
        console.log(data);
        
        console.log(req.user,"Middleware");
        
        return next();
      }
    return  res.json({ message: AUTH_TOKEN_INVALID });
    } else {
      return res.status(404).json({ message: "Bearer Token Not Found", status: "Failed" });
    }
  }
}

export default Authentication;
