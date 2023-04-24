import { ConflictException, HttpStatus, inject, injectable } from '@leapjs/common';
import bcrypt from 'bcrypt';
import { ResponseMessage, ResponseReturnType } from 'common/response/response.types';
import { AuthService } from 'common/services/auth';
import { User, UserModel } from 'app/users/model/User';
import { TokenModel } from 'app/userSession/model/usersToken';
import { ReferService } from 'app/referral/service/referral';

@injectable()
export class UserService {
  @inject(() => ReferService)
  private readonly referAppService!: ReferService;
  @inject(() => AuthService)
  private readonly authService!: AuthService;

  public async getUserById(id: any): Promise<ResponseReturnType> {
    const data = await UserModel.findOne({ _id: id });
    return {
      code: HttpStatus.ACCEPTED,
      message: ResponseMessage.Success,
      data,
      error: null,
      status: true,
    };
  }

  public async userSignUp(data: User): Promise<ResponseReturnType> {
    return new Promise<ResponseReturnType>(async (resolve, reject) => {
      try {
        data.referralId = await this.referAppService.generateReferralId(6);
        const saveUser = await new UserModel(data).save();
        return resolve({
          code: HttpStatus.ACCEPTED,
          message: ResponseMessage.Success,
          data: saveUser,
          error: null,
          status: true,
        });
      } catch (error: any) {
        return reject({
          code: error.status || HttpStatus.CONFLICT,
          message: ResponseMessage.Failed,
          data: null,
          error,
          status: false,
        });
      }
    });
  }
  /**
   * login
   */
  public async login(phone: number, plainPassword: string) {
    return new Promise<ResponseReturnType>(async (resolve) => {
      if (!(phone && plainPassword)) {
        const res: ResponseReturnType = {
          code: 404,
          message: 'please enter phone number and password',
          data: '',
          error: 'please enter phone number and password',
          status: false,
        };
        return resolve(res);
      }
      const data: User = await UserModel.findOne({ phone: phone }, { password: 1, name: 1, email: 1, phone: 1, empId: 1, gender: 1, birthDate: 1, _id: 0, id: '$_id' });

      if (data) {
        /**
         * TODO : Login
         * !comparing
         * @param password  plain text password
         * @param data.password bcrypt password
         */

        const Data = await bcrypt.compare(plainPassword, data.password);
        if (Data) {
          const token = await this.authService.generateToken(JSON.stringify(data));
          await new TokenModel({
            user: data.id,
            token: token,
          }).save();
          const res: ResponseReturnType = {
            code: HttpStatus.ACCEPTED,
            data: {
              id: data.id,
              phone: data.phone,
              email: data.email,
              empId: data.empId,
              gender: data.gender,
              birthDate: data.birthDate,
              token,
            },
            error: null,
            message: 'Success',
            status: true,
          };
          return resolve(res);
        } else {
          const res: ResponseReturnType = {
            code: HttpStatus.CONFLICT,
            data: null,
            error: 'invalid_password',
            message: 'invalid_password',
            status: false,
          };
          return resolve(res);
        }
      } else {
        const res: ResponseReturnType = {
          code: HttpStatus.NOT_FOUND,
          data: null,
          error: 'User cannot be found',
          message: 'User cannot be found',
          status: false,
        };
        return resolve(res);
      }
    });
  }
  public async getAllUsers() {
    return UserModel.find({});
  }
  public async logout(bearerToken: string): Promise<ResponseReturnType> {
    try {
      const token: string = bearerToken.split(' ')[1];

      const deletedToken = await TokenModel.updateOne({ token, expired: false }, { token: null, expired: true });
      if (deletedToken.modifiedCount == 0) {
        throw new ConflictException('cannot modify', 'this token has been expired already');
      }
      return {
        code: HttpStatus.OK,
        data: 'Thank you',
        error: null,
        message: 'Successfully logged out',
        status: true,
      };
    } catch (error) {
      return {
        code: HttpStatus.UNAUTHORIZED,
        data: null,
        error,
        message: 'something went wrong',
        status: false,
      };
    }
  }
}
