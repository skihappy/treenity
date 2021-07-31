/**
 * Particles can transform along the transforms defined in particle group laws, traversing the transform graph
 * Its similar to casting. The [[particleTypes.flavor.flavorName]] specifies transform path, for a given particle
 * composition. As long as transforms of the path are allowed, this composition is cast thru the path ,
 * to its final destination.
 * @remark Multiple paths are possible between same end point groups,  so a transform must be defined implicitly,
 * by exact sequence of steps.
 * @module
 */
import type {particleComposition,particle} from "./particle.types";
import {vParticleFlavor} from "./particle.types";
import {Instance} from "mobx-state-tree";
import {logicEngineModel} from "../logicEngine.model";
import {assert} from "../utils";
import type {particleGroupLaw} from './particleGroupLaw.type'
import {particleClass} from './particle.class'

export const particleTransform= (logicEngine:Instance<logicEngineModel>)=>
    (particle:particle,errMsg:string=''):particleClass=>{
    const particleComposition=vParticleFlavor.is
    const flavor=vParticleFlavor.create(particleComposition.flavor)
    const {flavorName:transformPath}=flavor
    const transformPathArr=transformPath.split('.')
    const destinationGroupName=transformPathArr.reverse[0]

    const destinationComposition= transformPathArr.reduce((destinationComposition,fromGroupName,index)=>{
        if(index===transformPathArr.length)return destinationComposition

        const findGroup=(name:string):particleGroupLaw=>{
            const group=logicEngine.groups[name]
            assert(!!group,[`invalid transform ${transformPath}, group ${name} does not exist`,errMsg])
            return group.law
        }

        const toGroupCompositionType=findGroup(transformPathArr[index+1]).compositionType
        findGroup(fromGroupName).compositionType

        return toGroupCompositionType.create(destinationComposition)
    },particleComposition)

    return new particleClass(destinationGroupName)(destinationComposition)
}