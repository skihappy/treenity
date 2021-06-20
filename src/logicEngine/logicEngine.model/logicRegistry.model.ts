import { collectionModel } from '../collection.model'
import { vClass, Shape, Union, Func, objectType, Dict, functionType } from '../types'
import { particleClass } from './particle.class'
import type { logicEngine, registryRef } from './types/particle.types'
import { groupRef as vRegistryRef } from './types/particle.types'
import { mapShape } from '../utils'

interface componentSpec {
  component: () => any
  props: {
    [propName: string]: vClass<{ registryName: string }>
  }
}

export const logicRegistryModel = (registryName: string, vElementSpec: vClass, logicEngine: logicEngine) => {
  const vComponentSpec = Shape({
    propTypes: {
      component: functionType,
      props: Dict({
        propType: vRegistryRef({
          registryName: 'types',
        }),
      }),
    },
  })

  const vRegistryValue = Union(
    {
      types: [vElementSpec, vComponentSpec],
    },
    `${registryName}RegistrySpec`
  )

  const elementClass = particleClass(logicEngine, registryName, vElementSpec)

  return collectionModel(logicEngine.vm)(vRegistryValue).actions((self) => {
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
