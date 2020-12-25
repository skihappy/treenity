import { typecheck,IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'
import {MWithId} from './utils'
import {NodeVM, VMScript} from 'vm2'

const vm = new NodeVM({
    console: 'inherit',
    sandbox: {},
    require: {
        external: {
            transitive:true,
            modules:['*']
        },
        root: "./never/ever"
    }
})

/*
Its possible to record the history of script execution thru a hook that serializes args and return values,  or
by extending type with a history array specifying
 */
const getMScript=(definition:{argTypes:IAnyType[],resultType:IAnyType}={argTypes:[t.undefined],resultType:t.undefined}):IAnyModelType=>{
    const {argTypes,resultType}=definition
    const MScriptHistoryRecord=t.model('scriptHistoryRecord',{
        args:t.array(t.union(...argTypes)),
        result:resultType
    })

    return t.compose('block',MWithId,t.model('',{
        name:t.string,
        script:t.string,
        history:t.optional(t.array(MScriptHistoryRecord),[]),
        isRecorded:t.optional(t.boolean,false)
    })).actions(self=>{
        const script=new VMScript(`module.exports=${self.script}`)
        const func=vm.run(script)

        return {
            execute:(...args)=>{
                // @ts-ignore
                const {argTypes,resultType}=self.definition
                if(argTypes){
                    assert(argTypes.length>=args.length)
                    args.forEach((arg,index)=>typecheck(argTypes[index],arg))
                }
                const result= func(...scriptArgs)
                if(resultType)typecheck(resultType,result)
                if(self.isRecorded)self.history.push(MScriptHistoryRecord.create({args,result}))
                return result
            },
            record:(isRecorded:boolean=false)=>{self.isRecorded=isRecorded}
        }
    }).volatile(self=>{
        return {
            definition:{
                argTypes:undefined,
                resultType:undefined
            }
        }
    })
}


export default getMScript