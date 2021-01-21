/*
import getMScript from "./script.get.model"
import { getSnapshot,IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'

console.log('hey')
const helloWorld=(who)=>{
    const msg=`hello ${who}`
    console.log(msg)
    return msg
}
const helloWorldScript=getMScript(
    'helloWorld',
    {
        argDefs:[['name',t.string]],
        resultType:t.string
    },
    {
        isTypechecked:true
    }
).create({
    script:helloWorld.toString()
})

helloWorldScript.run('world')
console.log(getSnapshot(helloWorldScript))
 */
import { getType,getSnapshot,IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'

const model=t.model('m',{
    a:t.string
}).actions((self)=>{
    return {
        define:(type:IAnyType)=>{
            getType(self).props({})
            const model=t.compose('',getType(self),t.model('',{type}))
        }
    }
})