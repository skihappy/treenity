import type {
  jsonComponentProps,
  shapeComponentProps,
  arrayComponentProps,
  tupleComponentProps,
  unionComponentProps,
  lateComponentProps,
  refineComponentProps,
} from '../types'
import { vClass, Union, any as vAny, Json, array, objectType } from '../types'
import { mapShape, once } from '../utils'
import type { logicEngine, registryRefProps } from './types'
import { registryRef as vRegistryRef } from './types'

export const logicElementClass = (logicEngine: logicEngine, registryName: string, specType: vClass) => {
  return class logicElementClass {
    public specType = Union(
      {
        types: [
          specType,
          vRegistryRef({
            registryName,
          }),
        ],
      },
      `${registryName} spec`
    )
    public registryName = registryName
    public message: string = ''

    constructor(public elementName: string, private specDraft) {}

    private addMessage(msg): string {
      const addMessage = (msg: string) => {
        if (!msg) return
        this.message = `
        ${msg}
        ${this.message}`
      }

      if (msg) {
        if (!this.message) addMessage(`logic element ${this.registryName}.${this.elementName}`)
        addMessage(msg)
      }
      return msg
    }

    protected validate(guard: boolean, message: string): string {
      return this.addMessage(guard ? message : '')
    }

    // @ts-ignore
    get spec() {
      return once(() => {
        const { specType, specDraft, message } = this

        if (!this.addMessage(specType.validate(specDraft))) return specDraft
        return specType.create(specDraft)
      })()
    }

    // @ts-ignore
    get def() {
      const def = () => {
        const mapSpec = (spec: {}, specType: vClass) => {
          //we can not make any assumptions about spec. Its a fault tolerant draft, not type checked
          if (!spec) return

          if (specType.isFlavor('registerRef')) {
            if (!specType.is(spec)) return spec
            const registryName = (specType.props as registryRefProps).registryName

            const logicElement = logicEngine.registries[registryName].read(spec)
            const def = logicElement.def
            this.addMessage(logicElement.message)
            return def
          }

          if (specType.isFlavor('tuple')) {
            if (!array.is(spec)) return spec
            return (specType.props as tupleComponentProps).elementTypes.map((type, index) => mapSpec(spec[index], type))
          }

          if (specType.isFlavor('array')) {
            if (!array.is(spec)) return spec
            return (spec as []).map((specElement, index) =>
              mapSpec(specElement, (specType.props as arrayComponentProps).elementType)
            )
          }

          if (specType.isFlavor('shape')) {
            if (!objectType.is(spec)) return spec
            return mapShape(
              ((specType.props || { propTypes: {} }) as shapeComponentProps).propTypes,
              (type, propName) => mapSpec(spec[propName], type)
            )
          }

          if (specType.isFlavor('union')) {
            const type = (specType.props as unionComponentProps).types.find((type) => type.is(spec))
            if (!type) return spec
            return mapSpec(spec, type as vClass)
          }

          if (specType.isFlavor('Json')) {
            if (!Json({ type: vAny }).is(spec)) return spec
            return mapSpec(JSON.parse(spec as string), (specType.props as jsonComponentProps).type)
          }

          if (specType.isFlavor('late')) return mapSpec(spec, (specType.props as lateComponentProps).typeFactory())

          if (specType.isFlavor('refined')) return mapSpec(spec, (specType.props as refineComponentProps).type)
        }

        return mapSpec(this.spec, this.specType)
      }

      return once(def)()
    }
  }
}
