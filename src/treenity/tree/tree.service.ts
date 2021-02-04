import { Id, NullableId, Paginated, Params, Service, ServiceMethods } from '@feathersjs/feathers';
import { each } from 'lodash';
import Oplog from 'mongo-oplog';

import { makeUpdateFromActions, makeUpdateFromPatch } from '../model/make-patch-update';
import { Node } from './node';

import { randomId } from '../../common/random-id';
import assert from 'assert';
import { Instance, SnapshotIn } from 'mobx-state-tree';
import { check } from '../../utils/check';

const cache = {};
const subscriptions = {};

type InNode = SnapshotIn<typeof Node>;

export default class TreeService implements ServiceMethods<InNode> {
  collection!: Service<any>;
  changes!: Service<any>;
  app: any;

  setup(app: any, path: string) {
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
    this.oplog.on('insert', doc => this.emit('created', doc.o));
    this.oplog.on('delete', doc => this.emit('removed', doc.o));
    this.oplog.on('update', doc => this.emit('updated', doc.o));
    this.oplog.tail();


    service.publish('created', (data) => {
      return app.channel(data._p);
    });
    service.publish('patched', (data) => {
      // publish this changes to object channel and parent object channel
      return [app.channel(data._id), app.channel(data._p)];
    });
    service.publish('removed', (id) => {
      return app.channel(id);
    });

    app.on('disconnect', (connection) => {
      const cookie = connection.headers.cookie;
      delete subscriptions[cookie];
    });
  }

  subscribe(connection, objects: InNode[], subId?: string) {
    subId = subId || randomId();
    const cookie = connection.headers.cookie;

    const info = subscriptions[cookie] || (subscriptions[cookie] = { ids: {}, subs: {} });
    const sub: string[] = (info.subs[subId] = []);
    const ids = info.ids;

    objects.forEach((o) => {
      const id = o._id.toString();
      sub.push(id);
      // increment info count
      const n = ++ids[id];
      if (Number.isNaN(n)) {
        ids[id] = 1;
        this.app.channel(id).join(connection);
      }
    });

    return subId;
  }

  removeSub(connection, id: Id): void {
    const cookie = connection.headers.cookie;

    const { ids, subs } = subscriptions[cookie] ?? {};
    if (!ids) return;

    each(subs, (sub) => delete sub[id]);
    delete ids[id];
    // this.app.channel(id).leave(connection);
  }

  unsubscribe(connection, subId) {
    const cookie = connection.headers.cookie;
    const info = subscriptions[cookie];

    if (!subId || !info) return; // XXX

    const sub = info.subs[subId];
    delete info.subs[subId];

    const ids = info.ids;

    sub.forEach((id) => {
      const n = --ids[id];
      assert(n >= 0, 'invalid id');
      if (n === 0) {
        delete ids[id];
        this.app.channel(id).leave(connection);
      }
    });
  }

  async find(params: Params): Promise<InNode | InNode[] | Paginated<InNode> | null> {
    let { subscribe, subId, ...query } = params.query || {};
    if (!params.connection) subscribe = undefined; // local server call
    if (subscribe === false) {
      this.unsubscribe(params.connection, subId);
      return null;
    }

    const data = await this.collection.find({ query });
    if (subscribe === true) {
      const subId = this.subscribe(params.connection, data);

      return { data, subId };
    }
    return { data, total: data.length, skip: 0, limit: data.length };
  }

  async get(id: Id, params: Params) {
    return this.collection.get(id);
  }
  async create(data: any, params: Params) {
    const obj = await this.collection.create(data, params);
    await this.changes.create({ _id: obj._id, _: [{ op: 'add', path: '/', value: data }] }, params);
    const subId = this.subscribe(params.connection, [obj], 'create');
    return obj;
  }
  // async update(id: NullableId, data: any, params: Params) {
  //   console.log('updating');
  // }
  async patch(id: NullableId, actions: any, params: Params) {
    const snapshot = (await this.collection.find({ query: { _id: id } }))[0];
    const node = Node.create(snapshot);
    const [[update, extraUpdate], patch] = makeUpdateFromActions('', node, params.actions);
    update.$set = update.$set || {};
    update.$set.updatedAt = Date.now();
    update.$inc = { _r: 1 };

    console.log('patching', id, actions);

    const obj = await this.collection.patch(id, update);
    if (extraUpdate) await this.collection.patch(id, extraUpdate);

    await this.changes.patch(id, { $push: { _: { ...patch, at: new Date() } } });

    // this.emit('patched', { id, patch });
    return { id, p: obj._p, r: obj._r, patch };
    // return patch;
    // this.emit(id, patch);
    // this.app.channel(id).send(patch);
  }

  async remove(id: NullableId, params: Params): Promise<NullableId> {
    check(id, 'id not defined');
    if (id && (await this.collection.remove(id).catch(() => false)) !== false) {
      this.removeSub(params.connection, id);
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
