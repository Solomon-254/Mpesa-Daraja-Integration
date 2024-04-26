import {  Logger, Module } from '@nestjs/common';
import { PaymentsService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { PaymentsController } from './app.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

  ],
  controllers:  [PaymentsController],
  providers: [PaymentsService, Logger],
})
export class AppModule {}
