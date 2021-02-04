import './source-maps';
import helmet from 'helmet';
import cors from 'cors';
import uuid from 'uuid';


import feathers from '@feathersjs/feathers';
import express from '@feathersjs/express';
import mongoService from 'feathers-mongodb';
import socketio from '@feathersjs/socketio';
import configuration from '@feathersjs/configuration';
import authentication from './authentication';


import '../common/index';

import config from '../config-common';
import { HelloService } from '../mods/server';
import createClientDb from '../mods/mongo/mongod';
import '../treenity/service';
import TreeService from '../treenity/tree/tree.service';
import MessageService from '../treenity/message/message.service';
import { render } from '../treenity/react/react-nil';
import React from 'react';
import { RenderMeta } from '../treenity/react/render-meta';
import { Context } from '../treenity/context/meta-context';
import { Node } from '../treenity/tree/node';
import { AppProvider } from '../treenity/react/useApp';
import services from './services';

config.isServer = true;

async function main() {
  const app = express(feathers());

  app.configure(configuration());

  app.use(helmet());
  app.use(cors());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.configure(express.rest());
  app.configure(socketio());
  authentication(app);
  app.use(express.errorHandler());

  const db = await createClientDb(app);
  const collection = (name) => app.use(
    name,
    mongoService({
      Model: db.collection(name),
    }),
  );

  collection('nodes');
  collection('changes');
  collection('edges');
  collection('users');
  const tree = app.use('tree', new TreeService())
    .service('tree').hooks({
      error: {
        all: [console.error],
      },
      after: {
        find: [
          function (context) {
            const { result } = context;
            if (result) {
              result.data = result.data.map((snap) => Node.create(snap));
            }
            return context;
          },
        ],
        get: [
          function (context) {
            if (context.result) {
              context.result = Node.create(context.result);
            }
            return context;
          },
        ],
      },
    });

  app.use('message', new MessageService());

  app.use('hello', new HelloService());

  const { host, port } = config;

  app.listen(
    {
      host,
      port,
    },
    () => {
      console.log(`App is running on http://${host}:${port}`);

      app.on('connection', (connection) => {
        connection.headers.cookie = uuid.v4();
        // app.channel('tree').join(connection);
        app.channel('anonymous').join(connection);
      });

      app.on('disconnect', (connection) => {
        app.channel('anonymous').leave(connection);
      });
    },
  );

  app.configure(services);
}

main().then(console.log, console.error);
