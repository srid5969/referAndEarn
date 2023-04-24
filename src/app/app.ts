import 'reflect-metadata';
import morgan from 'morgan';
import { Logger } from '@leapjs/common';
import { LeapApplication } from '@leapjs/core';
import { ExpressAdapter } from '@leapjs/router';
import { mongoose } from '@typegoose/typegoose';
import helmet from 'helmet';
import ErrorHandler from 'common/Handle-Error/error-handler';
import { configurations } from 'configuration/manager';
import { UserController } from 'app/users/controller/UserController';
export const main = () => {
  const port = configurations.port;
  const application: LeapApplication = new LeapApplication();
  mongoose.connect(configurations.mongodbHostName || '', {
    dbName: configurations.dataBaseName || '',
  });

  const database = mongoose.connection;
  database.on('error', (error) => console.error());
  database.once('connected', () => Logger.log(`Connected to the database`, 'LeapApplication'));

  const server = application.create(new ExpressAdapter(), {
    corsOptions: {
      origin: '*',
      credentials: true,
    },
    beforeMiddlewares: [helmet(), morgan('dev')],
    controllers: [UserController],
    afterMiddlewares: [ErrorHandler],
  });
  server.listen(port, () => {
    Logger.log(`⚡️[server]: Server is running at http://localhost:${port}`, 'NODE Server');
  });
  Logger.log(`Initializing settings`, 'ConfigurationManager');
};
