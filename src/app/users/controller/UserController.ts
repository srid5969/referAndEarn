import { Request, Response } from "express";
import { UserService } from "app/users/service/user";
import { Body, Controller, Get, Header, Param, Post, Req, Res, UseBefore } from "@leapjs/router";
import { HttpStatus, inject } from "@leapjs/common";
import { User } from "app/users/model/User";
import validate from "common/middleware/validator";
import Authentication from "common/middleware/auth";
import { ResponseReturnType } from "common/response/response.types";

@Controller("/user")
export class UserController {
  @inject(() => UserService) userService!: UserService;

  @Post("/logout")
  public async logout(@Header("authorization") token: string, @Res() res: Response): Promise<Response> {
    try {
        
        const data =await this.userService.logout(token);
        return data.code ? res.status(data.code).json(data) : res.status(HttpStatus.ACCEPTED).send(data);

    } catch (error: any) {
        return error.status ? res.status(error.code).json(error) : res.status(HttpStatus.CONFLICT).send(error);
      }
  }

  @Post("/login")
  @UseBefore(validate(User, ["login"]))
  public async login(@Body() req: any, @Res() res: Response): Promise<Response> {
    try {
      const data = await this.userService.login(req.phone, req.password);
      return data.code ? res.status(data.code).json(data) : res.status(HttpStatus.ACCEPTED).send(data);
    } catch (error: any) {
      return error.status ? res.status(error.code).json(error) : res.status(HttpStatus.CONFLICT).send(error);
    }
  }
  @Get("/get/:id")
  @UseBefore(Authentication)
  public async getUserById(@Param("id") id: string, @Res() res: Response): Promise<Response> {
    const result = await this.userService.getUserById(id);
    return res.send(result);
  }

  @Post("/signup")
  @UseBefore(validate(User, ["create"]))
  public async signUp(@Req() req: Request, @Res() res: Response): Promise<Response> {
    return new Promise<Response>(resolve => {
      const data: User = req.body;
      return this.userService
        .userSignUp(data)
        .then((result: ResponseReturnType) => {
          return resolve(res.status(HttpStatus.OK).send(result));
        })
        .catch((err: ResponseReturnType): any => {
          return resolve(res.status(err.code).json(err));
        });
    });
  }
}
