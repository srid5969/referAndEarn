import { plainToClass } from "class-transformer";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { Validator as ModelValidator } from "class-validator";
import { ValidationException, InternalServerException, HttpStatus } from "@leapjs/common";
import { ResponseReturnType } from "common/response/response.types";

function parse(errors: any): any {
  if (errors.constraints !== undefined) {
    return new ValidationException("Validation Error", Object.values(errors.constraints).reverse());
  }
  if (errors.children !== undefined) {
    return parse(errors.children[0]);
  }
  return new InternalServerException("Error object does not contain any constraints or children");
}

function validate(classType: any, groups?: string[]): RequestHandler {
  const validator = new ModelValidator();
  return (req: Request, res: Response, next: NextFunction): void => {
    const input: any = plainToClass(classType, req.body);
    validator
      .validate(input, {
        groups,
        skipMissingProperties: true,
        validationException: { target: false }
      })
      .then((errors: any): any => {
        if (errors.length > 0) {
          let err = parse(errors[0]);
          const res: ResponseReturnType = {
            message: err.message,
            code: err.status || HttpStatus.UNPROCESSABLE_ENTITY,
            status: false,
            data: null,
            error: err.errors
          };
          return next(res);
        }
        req.body = input;
        return next();
      });
  };
}

export default validate;
