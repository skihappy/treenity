import { registryModel } from '../registry.model'
import { vClass, Shape, Union, Func, objectType, Dict, functionType } from '../types'
import { logicElementClass } from './logicElement.class'
import type { logicEngine, registryRef } from './types'
import { registryRef as vRegistryRef } from './types'
import { mapShape } from '../utils'

interface componentSpec {
  component: () => any
  props: {
    [propName: string]: vClass<{ registryName: string }>
  }
}

export const logicRegistryModel = (registryName: string, vElementSpec: vClass, logicEngine: logicEngine) => {
  const vComponentSpec = Shape(
    {
      propTypes: {
        component: functionType,
        props: Dict(
          {
            propType: vRegistryRef({
              registryName: 'types',
            }),
          },
          `${registryName}ComponentProps`
        ),
      },
    },
    `${registryName}Component`
  )

  const vRegistryValue = Union(
    {
      types: [vElementSpec, vComponentSpec],
    },
    `${registryName}RegistrySpec`
  )

  const elementClass = logicElementClass(logicEngine, registryName, vElementSpec)

  return registryModel(logicEngine.vm)(vRegistryValue).actions((self) => {
    return {
      read(ref: registryRef) {
        const { name: componentName, props: componentProps } = vRegistryRef({
          registryName,
        }).create(ref)

        const registryValue = self.read(componentName)
        const componentSpec = vElementSpec.is(registryValue)
          ? { component: () => registryValue, props: {} }
          : registryValue

        const componentPropTypes = mapShape(componentSpec.props, (typeRef) =>
          logicEngine.registries.types.read(typeRef)
        )
        const vComponentProps = Shape(
          {
            propTypes: componentPropTypes,
          },
          `props of ${componentName} of ${registryName}`
        )

        const render = Func(
          {
            args: [vComponentProps],
            result: vElementSpec,
          },
          `${componentName} component of ${registryName} registry`
        ).create(componentSpec.component)(componentProps)

        return new elementClass(render(componentProps))
      },
    }
  })
}
