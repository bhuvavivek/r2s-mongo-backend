import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express, { Express } from 'express';
import optionsAdmin from './swagger/admin'
import optionsMember from './swagger/member'

export default (app: Express) => {
  app.use('/api-member', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(optionsMember)));
  app.use('/api-admin', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(optionsAdmin)));
}