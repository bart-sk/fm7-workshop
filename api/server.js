import logger from 'morgan';
import SwaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import optimist from 'optimist';
import rfs from 'rotating-file-stream';
import fs from 'fs';
import config from 'config';
import debug from 'debug';
import SwaggerExpress from 'swagger-express-mw';
import Express from 'express';

import Acl from './services/acl_service';
import { finalErrorHandler } from './helpers/errors';

import * as mongo from './helpers/db.mongo';
import * as redis from './helpers/db.redis';

const server = (c) => {
  // console+logger
  // logger
  let logStream = process.stdout;
  if (optimist.argv.l) {
    const logDirectory = path.resolve(__dirname, path.dirname(optimist.argv.l));
    const logName = path.basename(optimist.argv.l);
    // create a rotating write stream
    logStream = rfs(logName, {
      interval: '1d', // rotate daily
      path: logDirectory,
      maxFiles: 30,
    });
    // upravime consolu
    debug.log = (a) => {
      logStream.write(a);
    };
  }
  
  let accessLogStream = process.stdout;
  if (optimist.argv.a) {
    const logDirectoryA = path.resolve(__dirname, path.dirname(optimist.argv.a));
    const logNameA = path.basename(optimist.argv.a);
    // create a rotating write stream
    accessLogStream = rfs(logNameA, {
      interval: '1d', // rotate daily
      path: logDirectoryA,
      maxFiles: 30,
    });
  }
  
  debug('log')('\n\nStarting server...');
  const app = Express();
  SwaggerExpress.create(c, (err, swaggerExpress) => {
    if (err) {
      throw err;
    }
  
    Promise.all([
      mongo.connect(config.get('mongodb')),
      // redis.connect(config.get('redis')),
    ])
      .then(async () => {
        const swaggerObject = YAML.load(`${__dirname}/swagger/swagger.yaml`);
        const acl = new Acl(swaggerObject);
  
        // ACL
        app.use((req, res, next) => {
          req.ACL = acl;
          next();
        });
  
        // request logger
        if (config.get('server.logger.format')) {
          app.use(logger(config.get('server.logger.format'), { stream: accessLogStream }));
        }
  
        // install middleware
        swaggerExpress.register(app);
  
        // dokumentacia
        let { basePath } = swaggerObject;
        if (basePath[basePath.length - 1] === '/') {
          basePath = basePath.substring(0, basePath.length - 1);
        }
        app.use(
          `${basePath}/docs`,
          SwaggerUi.serve,
          SwaggerUi.setup(
            swaggerObject,
            false,
            {
              displayOperationId: true,
            },
            false,
            false,
            null,
            swaggerObject.info.title,
          ),
        );
  
        // Handle last 404 error
        app.use(finalErrorHandler);
  
        const listenCfgs = config.get('server.listen');
        for (const listenCfg of listenCfgs) {
          if (listenCfg.path) {
            try {
              fs.unlinkSync(listenCfg.path);
            } catch (e) {
              // nothing to do here...
            }
          }
          app
            .listen(listenCfg, () => {
              if (listenCfg.path) {
                // nastavime mod
                fs.chmodSync(listenCfg.path, '0777');
              }
              app.emit('APP_START');
              debug('log')(`Listening on ${Object.keys(listenCfg).map(k => (`${k} = ${listenCfg[k]}`)).join(', ')}`);
            })
            .on('error', e => {
              debug('error')('Error starting server: ', e);
            });
        }
      })
      .catch(e => {
        debug('error')('Error starting server: ', e);
        redis.disconnect();
        mongo.close();
      });
  });
  return app;
}

export default server;
