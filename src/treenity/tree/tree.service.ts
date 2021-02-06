import { Application, Id, NullableId, Paginated, Params, Service, ServiceMethods } from '@feathersjs/feathers';
import { each, some } from 'lodash';
import Oplog from 'mongo-oplog';
import sift from 'sift';


import { makeUpdateFromActions } from '../model/make-patch-update';
import { Node } from './node';

import { randomId } from '../../common/random-id';
import assert from 'assert';
import { Instance, SnapshotIn } from 'mobx-state-tree';
import { check } from '../../utils/check';
import { Channel, RealTimeConnection } from '@feathersjs/transport-commons/lib/channels/channel/base';

const cache = {};
const subscriptions: {
  [cookie: string]: {
    ids: { [_id: string]: number },
    queries: { [subId: string]: any },
    subs: { [subId: string]: { [_id: string]: boolean } }
    connection: RealTimeConnection,
  }
} = {};

type InNode = SnapshotIn<typeof Node>;

export default class TreeService implements ServiceMethods<InNode> {
  collection!: Service<any>;
  changes!: Service<any>;
  app: any;

  oplogQueue: string[] = [];

  setup(app: Application, path: string) {
    this.app = app;
    this.collection = app.service('nodes');
    this.changes = app.service('changes');
    const service = app.service(path);

    // try to enable oplog for tree
    const mongoUrl = app.get('mongodb');
    const lastSlash = mongoUrl.lastIndexOf('/');
    const oplogUrl = mongoUrl.slice(0, lastSlash) + '/local';
    const dbName = mongoUrl.slice(lastSlash + 1);


    this.oplog = Oplog(oplogUrl, { ns: `${dbName}\.nodes` });
    this.oplog.on('insert', doc => {
      this.checkObject(doc.o, true);
      this.emit('created', doc.o);
    });
    this.oplog.on('delete', doc => this.emit('removed', doc.o._id));
    this.oplog.on('update', doc => {
      if (this.oplogQueue.remove(doc._id) >= 0) return;
      this.checkObject(doc.o, false);
      this.emit('updated', doc.o);
    });
    this.oplog.tail();


    service.publish('created', (data, { channel }) => {
      return channel || app.channel(data._id);
    });
    service.publish('patched', (data) => {
      // publish this changes to object channel and parent object channel
      return app.channel(data._id);
    });
    service.publish('removed', (id, { channel }) => {
      if (channel) return channel;

      const chan = app.channel(id);
      chan.emit('empty'); // remove channel
      return chan;
    });

    app.on('disconnect', (connection) => {
      delete subscriptions[connection.headers.cookie];
    });

    const disableEvent = (ctx) => {
      ctx.event = null;
      return ctx;
    };
    service.hooks({
      after: {
        create: [disableEvent],
        update: [disableEvent],
        remove: [disableEvent],
      },
    });
  }

  subscribe(connection: RealTimeConnection, objects: InNode[], subId: string = randomId(), query) {
    const { cookie } = connection.headers;
    const { ids, queries } = (subscriptions[cookie] ||= { ids: {}, subs: {}, queries: {}, connection });
    (queries[subId] ||= []).push(query);

    // create optimizedd tree matcher, maybe in Rust to fast-filter queries
    // all subscription queries making a tree, soo ony tree matched, and all the same aueries batched to one
    // like we have: [{ _id: 'root' }, { _id: 'test' }, { _id: 'root' }], merged to _id -> ['root']: [0, 2], ['test']: [1]
    // [{ _id: 'root' }, { _id: 'root', _m.num: 10 }] => _id: ['root']: [0] -> '_m.num': 10: [1]
    objects.forEach((o) => {
      const id = o._id.toString();
      // increment info count
      if (!ids[id]) {
        ids[id] = 1;
        this.app.channel(id).join(connection);
      }
    });

    return subId;
  }

  checkObject(obj, isCreate) {
    const joined: RealTimeConnection[] = [];
    const leaved: RealTimeConnection[] = [];
    each(subscriptions, ({ queries, ids, connection }, cookie) => {
      const _id = obj._id;
      const onClient = !isCreate && !!ids[_id];
      const matched = some(queries, (qs) => qs.find(query => sift(query)(obj)));
      if (matched === onClient) return;
      if (matched) {
        ids[_id] = 1;
        this.app.channel(_id).join(connection);
        if (!isCreate) joined.push(connection);
      } else {
        delete ids[_id];
        this.app.channel(_id).leave(connection);
        leaved.push(connection);
      }
    });
    if (joined.length) this.emit('created', obj, { channel: new Channel(joined) });
    if (leaved.length) this.emit('removed', obj._id, { channel: new Channel(leaved) });
  }

  removeFromSubs(id: Id): void {
    each(subscriptions, (ids, subs) => {
      if (!ids[id]) return;

      // each(subs, (sub) => delete sub[id]);
      delete ids[id];
    });
  }

  unsubscribe(connection, subId) {
    if (!subId) return;

    const cookie = connection.headers.cookie;
    const info = subscriptions[cookie];

    if (!info) return; // XXX

    // XXX check all the objs in subs
    const { queries, subs, ids } = info;
    delete queries[subId];

    // const sub = subs[subId];
    // delete subs[subId];
    //
    // each(sub, (_, id) => {
    //   const n = --ids[id];
    //   assert(n >= 0, 'invalid id');
    //   if (n === 0) {
    //     delete ids[id];
    //     this.app.channel(id).leave(connection);
    //   }
    // });
  }

  async find(params: Params): Promise<InNode | InNode[] | Paginated<InNode> | null> {
    let { subscribe, subId, ...query } = params.query || {};

    if (subscribe === false && params.connection) {
      this.unsubscribe(params.connection, subId);
      return null;
    }

    const data = await this.collection.find({ query });
    if (subscribe === true && params.connection) {
      const subId = this.subscribe(params.connection, data, randomId(), query);

      return { data, subId };
    }
    return { data, total: data.length, skip: 0, limit: data.length };
  }

  async get(id: Id, params: Params) {
    return this.collection.get(id);
  }
  async create(data: any, params: Params) {
    data._id = randomId();
    if (this.opQueue) this.opQueue.push(data._id);
    const obj = await this.collection.create(data, params);
    await this.changes.create({ _id: obj._id, _: [{ op: 'add', path: '/', value: data }] }, params);
    // const subId = this.subscribe(params.connection, [obj], 'create');
    return obj;
  }

  // async update(id: NullableId, data: any, params: Params) {
  //   console.log('updating');
  // }
  async patch(id: string, actions: any, params: Params) {
    const snapshot = await this.collection.get(id);
    const node = Node.create(snapshot);
    const [[update, extraUpdate], patch] = makeUpdateFromActions('', node, actions);
    update.$set = update.$set || {};
    update.$set.updatedAt = Date.now();
    update.$inc = { _r: 1 };

    console.log('patching', id, actions);

    this.oplogQueue.push(id);

    let obj = await this.collection.patch(id, update);
    if (extraUpdate) obj = await this.collection.patch(id, extraUpdate);

    await this.changes.patch(id, { $push: { _: { ...patch, at: new Date() } } });

    this.checkObject(obj, false);
    // this.emit('patched', { id, patch });
    return { id, p: obj._p, r: obj._r, patch };
    // return patch;
    // this.emit(id, patch);
    // this.app.channel(id).send(patch);
  }

  async remove(id: Id, params: Params): Promise<NullableId> {
    check(id, 'id not defined');
    if (id && (await this.collection.remove(id).catch(() => false)) !== false) {
      this.removeFromSubs(id);
    }
    return id;
  }

  update(
    id: NullableId,
    data: Instance<typeof Node>,
    params?: Params,
  ): Promise<Instance<typeof Node>[] | Instance<typeof Node>> {
    throw new Error('update not implemented');
  }

  [key: string]: any;
}
