import getMScript from "./script.getModel"
import { typecheck,IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'

console.log('hey')
const helloWorld=(who)=>{
    const msg=`hello ${who}`
    console.log(msg)
    return msg
}
const helloWorldScript=getMScript('helloWorld',[['name',t.string]],t.string).create({
    script:helloWorld.toString()
})

helloWorldScript.run('world')