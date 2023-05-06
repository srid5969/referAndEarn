import {mongoErrorHandler} from "@leapjs/common";
import {Ref, getModelForClass, index, post, prop} from "@typegoose/typegoose";
import {UserReferral} from "app/referral/model/referUsers";
import {Expose} from "class-transformer";
import {IsAlpha, IsDefined, IsEnum, IsPhoneNumber} from "class-validator";
import {Roles} from "common/constants";
import {ObjectId} from "mongodb";
import {EMPTY_PHONE} from "resources/strings/app/auth";
import {INVALID_NAME} from "resources/strings/app/role";
import {EMPTY_FIRST_NAME, ENTER_DEVICE_ID, INVALID_FIRST_NAME, INVALID_PHONE} from "resources/strings/app/user";

@index({referralId: 1}, {unique: true})
@post("save", mongoErrorHandler("users"))
@post("findOneAndUpdate", mongoErrorHandler("users"))
class User {
    @prop({_id: true, id: ObjectId})
    public id?: ObjectId;

    @prop({required: true, default: "Pending"})
    @IsAlpha("en-US", {groups: ["create"], message: INVALID_FIRST_NAME})
    @IsDefined({groups: ["create"], message: EMPTY_FIRST_NAME})
    public name?: string;

    @prop({required: true, unique: true})
    @IsDefined({groups: ["login"], message: EMPTY_PHONE})
    @IsPhoneNumber("IN", {message: INVALID_PHONE})
    public phone!: number;

    @prop({required: true, default: Roles.Employee})
    @Expose({groups: ["admin"]})
    @IsEnum(Roles, {groups: ["create", "update"], message: INVALID_NAME})
    public role!: string;

    @prop({required: true, default: false})
    public verified!: boolean;

    @prop({unique: true, required: true})
    public referralId!: string;

    @prop({type: ObjectId, default: null})
    public referredBy!: Ref<User>;

    @prop({required: false})
    @IsDefined({groups: ["create"], message: ENTER_DEVICE_ID})
    public deviceId!: string;

    @prop({type: ObjectId})
    public referrals!: [Ref<UserReferral>];

    @prop({default: 0})
    public referralAmount!: number;
}

const UserModel = getModelForClass(User, {
    schemaOptions: {
        collection: "users",
        versionKey: false,
        timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"},
    },
});

export {User, UserModel};
