import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class StkPushDto {
  @IsString()
  @IsNotEmpty()
  quoteId: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

 
  
}



export class PaymentsDto {
  // quotesID: string;

  mpesaRecieptNumber: string;

  phoneNumber: string;

  transactionDate: string;

  merchantRequestId: string;

  checkoutRequestId: string;

  amount: string;

  resultsDescription: string;
}
