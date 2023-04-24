import { HttpStatus, injectable } from "@leapjs/common";
import { ResponseReturnType } from "common/response/response.types";
import { TransactionModel, Transactions } from "../model/transactionsDTO";

@injectable()
class TransactionService {
  public async makePayment(payload: Transactions): Promise<ResponseReturnType> {
    return new Promise<ResponseReturnType>(async (resolve) => {
      try {
        const transaction = new TransactionModel(payload);

        const saveTransaction = await transaction.save();

        resolve({
          code: HttpStatus.OK,
          data: saveTransaction,
          error: null,
          message: "Successfully saved",
          status: true,
        });
      } catch (error) {
        resolve({
          code: HttpStatus.NOT_ACCEPTABLE,
          data: null,
          error: error,
          message: "Cannot save the transaction",
          status: false,
        });
      }
    });
  }
}
export { TransactionService };
