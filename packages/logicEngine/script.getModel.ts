/*
This models a serializable function.  The script passed to  the model at creation is a stringified function.
It is rehydrated on creation and, wrapped into run action, runs in vm when invoked. Theres a require in that func scope.
Use it to require outside modules, but use it inside the func.  The format of the string must be 'function(...){...}'.
Its to be decided which packages and paths to be allowed to be required. This can be a huge security risk if not handled right.
But, it can be very secure, at expense of functionality. Perhaps, a good idea to provide admins with access to vm
configuration, but I dont know if possessing admin privileges qualifies a person to be making these super important
and complicated decisions. It takes an experienced web dev, more like a team.  I would not trust myself.

To record execution history, provide definition of args and result. args can be individually named, or not, or
declared as dont-care by specifying null for a type, in which case, either named or unnamed, a 'not available' will be recorded
for its value. History is meant to be serializable and persistent(potentially), so keep  types serializable. Use snapshotProcessors for
models if needed. The only problem is theres no dispatch func for similar shaped but dissimilar args. So, if you have
some of those, you might get strange results in historic records. If so, consider using a single dict of an arg.
 */

import { typecheck,IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'
import {MWithId,tRainbowArray} from './utils'
import {NodeVM, VMScript} from 'vm2'
import {tUnserializable} from "./utils";

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

type TUnnamedArgDef=IAnyType
type TNamedArgDef= [name:string,type:TUnnamedArgDef ]
type TArgDef=TUnnamedArgDef | TNamedArgDef
function isNamed(argDef: TArgDef): argDef is TNamedArgDef {
    return Array.isArray(argDef)
}

/*
this is like a named function definition. Then, at model instantiation, a new func is created with its own, possibly
 different name
 */
const getMScript=(defName:string,argDefs?:TArgDef[],resultType?:IAnyType):IAnyModelType=>{
    const argTypes=argDefs
        ?argDefs.map(argDef=>(isNamed(argDef)?argDef[1]:argDef))
        :t.undefined
    const tArg=argDef=>(
        isNamed(argDef)?tRainbowArray(t.string,argDef[1]):argDef
    )
    const tArgs=argDefs
        ?tRainbowArray(...argDefs.map(tArg))
        :t.undefined
    const MScriptHistoryRecord=t.model('scriptHistoryRecord',{
        args:tArgs,
        result:resultType?resultType:t.undefined
    })

    return t.compose(defName,MWithId,t.model('',{
        name:t.maybe(t.string),
        script:t.string,
        history:t.optional(t.array(MScriptHistoryRecord),[]),
        isRecorded:t.optional(t.boolean,false)
    })).actions(self=>{
        const script=new VMScript(`module.exports=${self.script}`)
        const func=vm.run(script)

        return {
            run:(...args)=>{
                // @ts-ignore
                const [argDefs,resultType]=self.definition
                if(argTypes){
                    // @ts-ignore
                    assert(argDefs.length>=args.length)
                    args.forEach((arg,index)=>typecheck(argDefs[index],arg))
                }
                const result= func(...args)
                if(resultType)typecheck(resultType,result)
                if(self.isRecorded)self.history.push(MScriptHistoryRecord.create({args,result}))
                return result
            },
            record:(isRecorded:boolean=false)=>{self.isRecorded=isRecorded}
        }
    }).volatile(self=>{
        return {
            definition:[argDefs,resultType]
        }
    })
}


export default getMScript