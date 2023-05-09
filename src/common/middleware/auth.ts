import { Middleware } from "@leapjs/router";
import { NextFunction, Response } from "express";
import { TokenModel } from "./../../app/userSession/model/usersToken";
import { AUTH_TOKEN_INVALID } from "./../../resources/strings/middleware/authentication";
import { HttpStatus } from "@leapjs/common";

@Middleware()
class Authentication {
  public async before(req: any, res: Response, next: NextFunction): Promise<any> {
    if (!req.headers.authorization) {
      return res.status(404).json({ message: "Token Not Found", status: "Failed" });
    }

    let token: any = req.headers.authorization.split(" ") || "";
    try {
      if (token[1]) {
        const {user} = await TokenModel.findOne({ token: token[1], expired: false },{_id:0,user:1});
        if (user) {
          req.user = user;
          console.log("mile",user);
          
          return next();
        }
      return  res.json({ message: AUTH_TOKEN_INVALID });
      } else {
        return res.status(404).json({ message: "Bearer Token Not Found", status: "Failed" }); 
      }
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized token", status: "Failed" });

    }
    
  }
}

export default Authentication;
