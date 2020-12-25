import { IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'

export function randomId(length = 12): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export const MWithId = t.model('withId', {
    _id: t.identifier,
}).actions((self) => ({
    afterCreate: () => {
        self._id = randomId()
    }
}))