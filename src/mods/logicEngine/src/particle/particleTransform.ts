/**
 * Particles can transform along the transforms defined in particle group laws, traversing the transform graph
 * Its similar to casting. The [[particleTypes.flavor.flavorName]] specifies transform path, for a given particle
 * composition. As long as transforms of the path are allowed, this composition is cast thru the path ,
 * to its final destination.
 * @remark Multiple paths are possible between same end point groups,  so a transform must be defined implicitly,
 * by exact sequence of steps.
 * @module
 */
import type { particleComposition, particle } from './particle.types'
import { vParticleComposition, vParticleFlavor } from './particle.types'
import { Instance } from 'mobx-state-tree'
import { logicEngineModel } from '../logicEngine.model'
import { assert } from '../utils'
import type { particleGroupLaw } from './particleGroupLaw.type'
import { particleClass } from './particle.class'

/**
 * given a particle, transforms it along the transform path specified by [[particleTypes.particleFlavor.flavorName]].
 * A particle can be specified either by its flavor, to reference it in the logicEngine in one of the groups, or
 * it can be defined as a raw [[particleTypes.particleComposition]]. Then, flavor of that composition specifies the transform path.
 * Transform paths must traverse transformations allowed by [[particleGroupLawType.particleGroupLaw]]s.
 * Its possible to register a particle as a reference to another particle, by its flavor, with its own transform path.
 * Then, transform paths will add up into a composite extended path.
 * The transform paths stay with particle instances for their lifetime, and can be used as markers,carrying information
 * about functionality of particles.
 * @param logicEngine instance of logic engine
 * @param particle particle to be transformed
 * @param errMsg
 */
export const particleTransform = (logicEngine: Instance<logicEngineModel>) => (
  particle: particle,
  errMsg: string | string[] = ['']
): particleClass => {
  const localErrMsg = (transformPath: string[]) => [errMsg, `invalid transform ${transformPath}`]

  const transform = (
    sourceFlavorName: string,
    sourceGroupName: string,
    transformPath: string[],
    sourceComposition: particleComposition,
    errMsg
  ): particleClass => {
    const targetComposition = transformPath.reduce((targetComposition, sourceGroupName, index) => {
      if (index === transformPath.length) return targetComposition

      const toGroup = transformPath[index + 1]
      const toGroupCompositionType = logicEngine.group(toGroup, errMsg).law.compositionType

      return toGroupCompositionType.create(targetComposition, errMsg)
    }, sourceComposition)

    //@ts-ignore
    targetComposition.flavor.flavorName = [
      ...sourceFlavorName,
      sourceGroupName,
      ...transformPath,
      //@ts-ignore
      ...sourceComposition.flavor.flavorName,
    ]
    const targetGroupName = transformPath.reverse()[0]
    return new particleClass(targetGroupName)(targetComposition)
  }

  if (vParticleFlavor.is(particle as object)) {
    const { flavorName } = vParticleFlavor.create(particle)
    const [sourceFlavorName, sourceGroupName, ...transformPath] = flavorName

    const sourceFlavor = Object.assign(Object.create(particle as object), {
      flavorName: [sourceFlavorName, sourceGroupName],
    })

    const sourceComposition = logicEngine.read(sourceFlavor, errMsg).composition
    return transform(sourceFlavorName, sourceGroupName, transformPath, sourceComposition, localErrMsg(flavorName))
  }

  const {
    flavor: { flavorName },
  } = vParticleComposition.create(particle)
  const [sourceFlavorName, sourceGroupName, ...transformPath] = flavorName
  return transform(
    sourceFlavorName,
    sourceGroupName,
    transformPath,
    particle as particleComposition,
    localErrMsg(flavorName)
  )
}
