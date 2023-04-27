import { inject } from "@leapjs/common";
import { Controller, Get, Req, Res, UseBefore } from "@leapjs/router";
import { ReferService } from "app/referral/service/referral";
import Authentication from "common/middleware/auth";
import { Response } from "express";

@Controller("/referral")
export class ReferralController {
  @inject(ReferService)
  private readonly referralService!: ReferService;
  @UseBefore(Authentication)
  @Get("/")
  public async getMyReferral(@Req() req: any, @Res() res: Response): Promise<Response> {
    const result = await this.referralService.getMyReferralsDetails(req.user);
    return res.status(result.code).json(result);
  }
}
