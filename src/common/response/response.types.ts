export interface ResponseReturnType {
  code: number;

  status: boolean;

  message: string;

  data: any;

  error: any;
}

export enum ResponseMessage{
    Success="Success",
    Failed="Failed"
}
