import { IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'
import _ from 'lodash'

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

export const tUnserializable=t.custom<string,any>({
    name: "unserializable",
    fromSnapshot(value: string) {
        return 'not available'
    },
    toSnapshot(value: any) {
        return 'not available'
    },
    isTargetType(value: any): boolean {
        return typeof value!='string'
    },
    getValidationMessage(value: any): string {
        return ''
    }
})

export const tRainbowArray=(...types:IAnyType[])=>t.array(t.union(..._.unique(types)))