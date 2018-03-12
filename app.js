import server from './api/server';

server({
  appRoot: __dirname, // required config
  // swaggerSecurityHandlers: {handler: () => {}},
});
