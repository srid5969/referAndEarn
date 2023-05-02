import { Middleware } from "@leapjs/router";
import { Response ,Request,NextFunction} from "express";

@Middleware()
export class GenerateTokenForSignedUpUser{
    public async after(req:Request,res:Response,next:NextFunction){
        
    }
}