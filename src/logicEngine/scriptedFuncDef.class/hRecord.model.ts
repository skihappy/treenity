import { types as t } from 'mobx-state-tree/dist/types'
import { modelWithID, tRainbowArray } from '../utils'
import ScriptedFuncDef from './index'

const serializableArgType = (type) => {
  return typeof type === 'function' ? 'unserializable' : type
}

const tNamedArg=t.array(t.union(t.string,))
const MHRecord = (def: ScriptedFuncDef) =>{
    const tUnnamedArg=t.union(...def.serializableArgTypes)
    const tNamedArg=t.array(t.union(t.string,tUnnamedArg))
    const tArg=t.union(tUnnamedArg,tNamedArg)

    const tArgRecord=tRainbowArray(
        ...def.argDefs.map((argDef) => {
            const isNamed = argDef.length === 2
            const argType = !isNamed ? argDef[0] : argDef[1]

            return tRainbowArray(...(!isNamed ? [serializableArgType(argType)] : [t.string, serializableArgType(argType)]))
        })
    )

    return modelWithID(`${def.name}MHRecord`, {
        args:t.array(tArg),
        // @ts-ignore
        result: serializableArgType(def.resultType),
    }).views(self=>{
        return {
            toArgRecord(args:any[]){
                def.
            }
        }
    })
}


export default MHRecord
