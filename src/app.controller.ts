import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PaymentsDto, StkPushDto } from './dto/payment.dto';
import { PaymentsService } from './app.service';

@Controller('payments/')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}

  @Get('token')
  async getToken(): Promise<string> {
    var token = await this.paymentsService.generateToken();
    this.logger.warn('Token from Daraja', token);
    return token;
  }

  @Post('stkpush')
  async generateSTKPush(@Body() stkPushDto: StkPushDto) {
    const token = await this.getToken();
    const response = await this.paymentsService.generateSTKPush(
      stkPushDto.phoneNumber,
      stkPushDto.amount,
      token,
      stkPushDto.quoteId
    );
    return response;
  }

  @Post('callback')
  async handleCallback(@Body() body: any) {
      try {
          const token = await this.getToken();
          console.log('STK PUSH CALLBACK BODY', body);
  
          const stkCallback = body?.Body?.stkCallback;
  
          if (!stkCallback) {
              throw new Error('Invalid callback body');
          }
  
          const {
              MerchantRequestID,
              CheckoutRequestID,
              ResultCode,
              ResultDesc,
              CallbackMetadata
          } = stkCallback;
  
          if (ResultCode === 0) {
              console.log('User has paid, querying results...');
              
              const amount = CallbackMetadata?.Item[0]?.Value;
              const mpesaReceiptNumber = CallbackMetadata?.Item[1]?.Value;
              const transactionDate = CallbackMetadata?.Item[3]?.Value;
              const phoneNumber = CallbackMetadata?.Item[4]?.Value;
              
              const queryResponse = await this.paymentsService.confirmsMpesaPayment(
                  CheckoutRequestID,
                  token,
              );
  
              const paymentDetails = new PaymentsDto();
              paymentDetails.mpesaRecieptNumber = mpesaReceiptNumber;
              paymentDetails.phoneNumber = phoneNumber;
              paymentDetails.amount = amount;
              paymentDetails.transactionDate = transactionDate;
              paymentDetails.merchantRequestId = MerchantRequestID;
              paymentDetails.resultsDescription = ResultDesc;
              paymentDetails.checkoutRequestId = CheckoutRequestID;
  
              console.log('Payment details', paymentDetails);
  
              // Save payment details to the database
  
              return queryResponse;
          } else {
              console.log('User has NOT paid');
              return 'Transaction not completed';
          }
      } catch (error) {
          console.error('Error processing callback:', error.message);
          return 'Error processing callback';
      }
  }
  
}
