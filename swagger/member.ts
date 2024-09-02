import swaggerJSDoc, { Options } from 'swagger-jsdoc';
// Define swaggerAdminDefinition and swaggerMemberDefinition
const swaggerMemberDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'R2S',
      version: '1.0.0',
      description:
        'This is a REST API application made with Express. It retrieves data from JSONPlaceholder.',
      license: {
        name: 'Licensed Under MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'JSONPlaceholder',
        url: 'https://jsonplaceholder.typicode.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Member server',
      },
    ],
  };
  
  // Update options objects
   const optionsMember: Options = {
    swaggerDefinition: swaggerMemberDefinition,
    apis: ['./routes/member/*.ts'], // This should point to member routes
  };

export default optionsMember;
  