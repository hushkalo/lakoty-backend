export class OrderCallbackCreateDto {
  invoiceId: string;
  status: string;
  amount: number;
  ccy: number;
  createdDate: string;
  modifiedDate: string;
  reference: string;
  destination: number;
}

export class OrderCallbackProcessingDto extends OrderCallbackCreateDto {
  finalAmount: number;
}

class OrderPaymentInfoFailDto {
  terminal: string;
  bank: string;
  paymentSystem: string;
  country: string;
  fee: number;
  paymentMethod: string;
  maskedPan: string;
}

export class OrderCallbackFailureDto extends OrderCallbackProcessingDto {
  failureReason: string;
  errCode: string;
  payMethod: string;
  paymentInfo: OrderPaymentInfoFailDto;
}

class OrderPaymentInfoSuccessDto extends OrderPaymentInfoFailDto {
  rrn: string;
  approvalCode: string;
  tranId: string;
}
export class OrderCallbackSuccessDto extends OrderCallbackProcessingDto {
  paymentInfo: OrderPaymentInfoSuccessDto;
}
