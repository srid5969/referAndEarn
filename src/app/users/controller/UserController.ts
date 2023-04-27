import { HttpStatus, inject } from "@leapjs/common";
import { Body, Controller, Get, Header, Param, Post, Req, Res, UseBefore } from "@leapjs/router";
import { User } from "app/users/model/User";
import { UserService } from "app/users/service/user";
import Authentication from "common/middleware/auth";
import validate from "common/middleware/validator";
import { ResponseReturnType } from "common/response/response.types";
import { Request, Response } from "express";
import { UserControllerValidation } from "app/users/controllerValidation/userValidator";

@Controller("/user")
export class UserController {
  @inject(() => UserService) userService!: UserService;

  @Post("/logout")
  public async logout(@Header("authorization") token: string, @Res() res: Response): Promise<Response> {
    try {
      const data = await this.userService.logout(token);
      return data.code ? res.status(data.code).json(data) : res.status(HttpStatus.ACCEPTED).send(data);
    } catch (error: any) {
      return error.status ? res.status(error.code).json(error) : res.status(HttpStatus.CONFLICT).send(error);
    }
  }

  @Post("/login")
  @UseBefore(validate(User, ["login"]))
  public async login(@Body() req: any, @Res() res: Response): Promise<Response> {
    try {
      const data = await this.userService.loginOrRegister(req.phone);
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
  @UseBefore(UserControllerValidation)
  @UseBefore(validate(User, ["create"]))
  public async signUp(@Req() req: Request, @Res() res: Response): Promise<Response> {
    return new Promise<Response>((resolve) => {
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
  @Post("/verify-otp")
  public async verifyOTP(@Body() req: any, @Res() res: Response): Promise<Response> {
    try {
      const data = await this.userService.verifyOtp(req);
      return data.code ? res.status(data.code).json(data) : res.status(HttpStatus.ACCEPTED).send(data);
    } catch (error: any) {
      return error.status ? res.status(error.code).json(error) : res.status(HttpStatus.CONFLICT).send(error);
    }
  }
}
