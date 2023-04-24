import { injectable } from "@leapjs/common";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

@injectable()
export class AuthService {
  public async generateToken(userData: any): Promise<any> {
    if (dotenv.config().error) {        
      throw new Error("Cannot find configuration file");
    }

    let token = await jwt.sign(userData, process.env.jwtSecretKey || "", {
        // expiresIn: 100,
      algorithm: "HS256"
    });
    return token;
  }
}
