const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module'); // Import your NestJS AppModule

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();

  // Define your Azure Function handler
  const azureFunctionHandler = async (context, req) => {
    // You can use NestJS's request handling capabilities here
    const response = await app.handle(req); //passes http requests to the nestjs app fromthe azure funcs

    // Set the response status and body
    context.res = {
      status: response.getStatus(),
      body: response.body,
    };
  };

  // Export the Azure Function handler
  module.exports = azureFunctionHandler;
}

bootstrap(); //kicks of the azure function runtime