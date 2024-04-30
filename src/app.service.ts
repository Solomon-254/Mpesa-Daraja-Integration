import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as dotenv from 'dotenv';


dotenv.config();
@Injectable()
export class PaymentsService {
  constructor(
    private readonly logger: Logger,
    private readonly httpService: HttpService,
  ) {}

  private passKey = process.env.PASS_KEY;
  private bussinessShortCode = process.env.BUSINESS_SHORTCODE;
  private stkPushUrl = process.env.MPESA_STK_PUSH_URL;
  private queryTransactionUrl = process.env.MPESA_STK_QUERY_URL;

  private consumerKey = process.env.CONSUMER_KEY;
  private consumerSecret = process.env.CONSUMER_SECRET;
  private mpesaAuthUrl = process.env.MPESA_AUTH_URL;

  async generateToken(): Promise<string> {
    const buffer = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`,
    ).toString('base64');

    try {
      const response = await this.httpService
        .get(this.mpesaAuthUrl, {
          headers: {
            Authorization: `Basic ${buffer}`,
          },
        })
        .toPromise();

      const token = response.data.access_token;
      this.logger.log('Token from api', token);
      return token;
    } catch (error) {
      console.error('Error generating token:', error.response.data);
      throw error;
    }
  }

  async generateSTKPush(phoneNumber: string, amount: number, token: string, quoteId: string) {
    const timestamp = this.getCurrentKenyanTimestamp();
    const password = Buffer.from(
      `${this.bussinessShortCode}${this.passKey}${timestamp}`,
    ).toString('base64');
    const stkPushUrl = this.stkPushUrl;
    const callBackUrl = 'https://britamquotations-gi-prd.azurewebsites.net/api/payments/callback';

    try {
      const stkPushResponse = await this.httpService
        .post(
          stkPushUrl,
          {
            BusinessShortCode: this.bussinessShortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: this.bussinessShortCode,
            PhoneNumber: phoneNumber,
            CallBackURL: callBackUrl,
            AccountReference: quoteId,
            TransactionDesc: 'Test Payment',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise();
      this.logger.log('STK Push response:', stkPushResponse.data);
      return stkPushResponse.data;
    } catch (error) {
      console.error('Error generating STK push:', error.response.data);
      throw error;
    }
  }

  getCurrentKenyanTimestamp = (): string => {
    const kenyanTimezone = 'Africa/Nairobi';
    const now = new Date().toLocaleString('en-US', {
      timeZone: kenyanTimezone,
    });
    const kenyanDate = new Date(now);

    const year = kenyanDate.getFullYear();
    const month = String(kenyanDate.getMonth() + 1).padStart(2, '0');
    const day = String(kenyanDate.getDate()).padStart(2, '0');
    const hours = String(kenyanDate.getHours()).padStart(2, '0');
    const minutes = String(kenyanDate.getMinutes()).padStart(2, '0');
    const seconds = String(kenyanDate.getSeconds()).padStart(2, '0');

    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
    return timestamp;
  };

  async confirmsMpesaPayment(checkoutRequestID: string, token: string) {
    const timestamp = this.getCurrentKenyanTimestamp();
    const password = Buffer.from(
      `${this.bussinessShortCode}${this.passKey}${timestamp}`,
    ).toString('base64');
    const queryResponseUrl = this.queryTransactionUrl;

    try {
      const queryResponse = await this.httpService
        .post(
          queryResponseUrl,
          {
            BusinessShortCode: this.bussinessShortCode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestID,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise();
      this.logger.log('Query Results:', queryResponse.data);
      return queryResponse.data;
    } catch (error) {
      console.error('Error querying transaction:', error.response.data);
      throw error;
    }
  }
}