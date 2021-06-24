import { LogicError, mapShape, typechecked, assert, toArray, reduceShape, deepDefault } from './utils'
import { IAnyType, isType, types as t } from 'mobx-state-tree'
import { string } from 'mobx-state-tree/dist/types/primitives'

export interface func {
  (...[]): any
}

interface funcFactory<funcValue extends func = func, flavorProps extends object = object> {
  (flavor: componentFlavor<flavorProps>): funcValue
}

type assertFactory<value = any, flavorProps extends object = object> = funcFactory<assert<value>, flavorProps>

type createFactory<value = any, flavorProps extends object = object> = funcFactory<create<value>, flavorProps>

export interface assert<value> {
  (value: value): void
}

export interface create<value> {
  (value: value, message?: string | string[]): value
}

export type elementFlavor<flavorName extends string = string> = flavorName
export interface componentFlavor<flavorProps extends object = object, flavorName extends string = string> {
  flavorName: elementFlavor<flavorName>
  typeName?: string
  props: flavorProps
}
export type flavor<flavorProps extends object = object, flavorName extends string = string> =
  | elementFlavor<flavorName>
  | componentFlavor<flavorProps, flavorName>

export interface cast<toValue = any> {
  castName?: string // defaults to name of fromType
  fromType: vClass<any>
  cast: (fromValue: any) => toValue
}

export interface castFactory<toValue = any, flavorProps extends object = object> {
  (flavor: flavor<flavorProps>): cast<toValue>
}

export interface castFactories<toValue = any, flavorProps extends object = object> {
  [castName: string]: castFactory<toValue, flavorProps>
}

export type casts<toValue> = cast<toValue>[]

interface vClass_props<value = any, flavorProps extends object = object> {
  create?: create<value>
  assert: assert<value>
  flavor?: flavor<flavorProps>
  casts?: casts<value>
}

export class vClass<value = any, flavorProps extends object = object> {
  protected readonly assertion: assert<value>
  public readonly typeName: string
  public readonly flavorName: string
  public readonly flavorProps: flavorProps
  public readonly flavor: flavor<flavorProps>
  public readonly casts: casts<value>
  private readonly _constructorProps: vClass_props<value, flavorProps>

  constructor(vClass_props: vClass_props<value, flavorProps>) {
    this._constructorProps = deepDefault(vClass_props, {
      flavor: { flavorName: '', props: {}, typeName: '' },
      casts: {},
      create: (value) => value,
    })

    const { assert, flavor, casts } = this._constructorProps

    this.assertion = assert
    this.flavor = flavor as flavor<flavorProps>
    // @ts-ignore
    const { flavorName, typeName = flavorName, props: flavorProps } =
      typeof flavor === 'string' ? { flavorName: flavor as elementFlavor } : (flavor as componentFlavor<flavorProps>)
    this.typeName = typeName
    this.flavorName = flavorName
    this.flavorProps = flavorProps || {}
    this.casts = (casts as casts<value>).map(({ castName, fromType, ...rest }) => ({
      castName: castName || fromType.typeName,
      fromType,
      ...rest,
    }))
  }

  assert(value: value, errMessage: string[] | string = '') {
    try {
      this.assertion(value)
    } catch (e) {
      throw new LogicError([`bad value=${value} of flavor ${this.flavorName}`, ...toArray(errMessage || '')], e)
    }
  }

  validate(value: value, message: string | string[] = ''): string | '' {
    try {
      this.assert(value, message)
      return ''
    } catch (e) {
      return e.message
    }
  }

  is(value: value): boolean {
    try {
      this.assert(value)
      return true
    } catch (e) {
      return false
    }
  }

  create(value: value, errMessage: string[] | string = ''): value {
    const castEntry = this.casts.find(({ fromType }) => fromType.is(value))

    if (castEntry) {
      const { castName, cast, fromType } = castEntry as cast
      const castedValue = cast(fromType.create(value))
      this.assert(castedValue, [...toArray(errMessage), `bad cast ${castName}`])
      return castedValue
    }

    this.assert(value, errMessage)
    return (this._constructorProps.create as create<value>)(value)
  }

  //transform path is read backwards - toCastName,...,fromCastName
  transform(value: any, transformPath: string[]): value {
    const { cast } = transformPath.reverse().reduce(
      ({ toType, cast }: { toType: vClass; cast: (any) => any }, castName) => {
        const currentCast = toType.casts.find((cast) => cast.castName === castName)
        assert(!!currentCast, `type ${this.typeName}: bad cast name ${castName} in transform ${transformPath}`)
        return { toType: (currentCast as cast).fromType, cast: (value) => (currentCast as cast).cast(cast) }
      },
      { toType: this, cast: (value) => value }
    )

    return cast(value)
  }

  refined(refine: assert<value>) {
    return Refine({
      type: this as vClass<any, any>,
      refine,
    })
  }

  defaultsTo(defaultValue: value) {
    return Optional({
      type: this as vClass<any, any>,
      defaultValue,
    })
  }

  maybe(): vClass<maybeFlavorProps> {
    return Maybe({
      type: this as vClass<any, any>,
    })
  }

  dictOf() {
    return Dict({ type: this as vClass<any, any> })
  }

  unionWith(types: vClass[]): vClass<unionFlavorProps> {
    return Union({ types: [this as vClass<any, any>, ...types] })
  }

  arrayOf(): vClass<any[], arrayFlavorProps> {
    return ArrayType({ type: this as vClass })
  }

  setCasts(casts: casts<value> = []): vClass<value, flavorProps> {
    const { casts: oldCasts } = this._constructorProps
    return new vClass<value, flavorProps>({
      ...this._constructorProps,
      casts: { ...this._constructorProps.casts, ...casts },
    })
  }
}

interface createVComponent_Props<value = any, flavorProps extends object = object> {
  defaultFlavorProps?: Partial<flavorProps>
  create?: createFactory<value, flavorProps>
  assert: assertFactory<value, flavorProps>
  flavorName: string
  flavorPropsConstraint?: (flavor: componentFlavor<flavorProps>) => void
  casts?: castFactories<value, flavorProps>
}

export function createVComponent<value = any, flavorProps extends object = object>(
  props: createVComponent_Props<value, flavorProps>
) {
  const {
    defaultFlavorProps,
    assert: assertFactory,
    create: createFactory,
    casts: castFactories,
    flavorName,
    flavorPropsConstraint,
  } = deepDefault(props, {
    flavorPropsConstraint: () => {},
    defaultFlavorProps: {},
    casts: {},
    create: () => (value) => value,
  })

  return <instanceValue extends value = value>(flavorProps: flavorProps, typeName?: string) => {
    const defaultedFlavorProps = deepDefault(flavorProps, defaultFlavorProps)
    const flavor = {
      typeName,
      flavorName,
      props: flavorProps,
    }

    flavorPropsConstraint(flavor)

    return new vClass<instanceValue, flavorProps>({
      flavor: flavor as flavor<flavorProps>,
      assert: assertFactory(flavor),
      create: createFactory(flavor),
      casts: castFactories.map((castFactory) => castFactory(flavor)),
    })
  }
}

export interface createVOptions<value = any> {
  typeName?: string
  casts?: casts<value>
  create?: create<value>
}

export const createV = <value = any>(assert: assert<value>, options?: createVOptions<value>): vClass<value> => {
  const { typeName, casts, create } = deepDefault(options || {}, {
    typeName: '',
    casts: [],
    create: (value) => value,
  })

  return new vClass<value>({ assert, casts, create, flavor: { typeName, flavorName: typeName, props: {} } })
}

export const v = <vClass<object, any>>(
  createV((value) => assert(value instanceof vClass, `not logic type`), { typeName: 'v' })
)

export const any = createV(() => {})

const vTypeof = <value = any>(type: string): vClass<value> =>
  createV<value>((value) => typeof value === type, {
    typeName: type,
  })

export const stringType = vTypeof<string>('string')
export const functionType = vTypeof<() => any>('function')
export const numberType = vTypeof<number>('number')
export const undefinedType = vTypeof<undefined>('undefined')
export const objectType = vTypeof<object>('object')
export const booleanType = vTypeof<boolean>('boolean')
export const bigintType = vTypeof<bigint>('bigint')
export const symbolType = vTypeof<symbol>('symbol')

export interface literalFlavorProps {
  value: any
}

export const Literal = createVComponent<any, literalFlavorProps>({
  assert: ({ props: { value: literalValue } }) => (value) => assert(value === literalValue, `must be ${literalValue}`),
  flavorName: 'literal',
})

export interface lateFlavorProps {
  typeFactory: () => vClass<any, any>
}

export const Late = createVComponent<any, lateFlavorProps>({
  assert: ({ props: { typeFactory } }) => (value) => assert(typeFactory().is(value)),
  create: ({ props: { typeFactory } }) => (value) => typeFactory().create(value),
  flavorName: 'late',
})

export interface maybeFlavorProps {
  type: vClass
}
export const Maybe = createVComponent<any, maybeFlavorProps>({
  assert: ({ props: { type } }) => (value) => {
    if (typeof value === 'undefined') return
    type.assert(value)
  },
  flavorPropsConstraint: ({ props: { type } }) => {
    assert(type.flavorName === 'maybe', 'maybe: target flavor can not be maybe')
    assert(type.flavorName === 'optional', 'maybe: target flavor can not be optional')
  },
  create: ({ props: { type } }) => (value) => {
    if (typeof value === 'undefined') return value
    return type.create(value)
  },
  flavorName: 'maybe',
})

export interface optionalFlavorProps {
  type: vClass<any, any>
  defaultValue: any
}
export const Optional = createVComponent<any, optionalFlavorProps>({
  flavorPropsConstraint: ({ props: { defaultValue, type } }) => {
    assert(type.flavorName === 'maybe', 'optional: target flavor can not be maybe')
    assert(type.flavorName === 'optional', 'optional: target flavor can not be optional')
    type.assert(defaultValue, 'optional: bad default value')
  },
  assert: ({ props: { type, defaultValue } }) => (value) => {
    if (typeof value === 'undefined') return
    type.assert(value)
  },
  create: ({ props: { defaultValue, type } }) => (value) => {
    return typeof value === 'undefined' ? defaultValue : type.create(value)
  },
  flavorName: 'optional',
})

const vVoid = createV((value) => assert(typeof value === 'undefined'), { typeName: 'void' })

export interface funcFlavorProps {
  args?: vClass<any, any>[]
  result?: vClass<any, any>
}
export const Func = createVComponent<(...[]) => any, funcFlavorProps>({
  defaultFlavorProps: { args: [], result: any },
  assert: () => (func) => assert(typeof func === 'function', `not function type`),
  create: ({ props: { args, result } }) => (func) => typechecked(args, result)(func),
  flavorName: 'func',
})

export interface refineFlavorProps {
  type: vClass<any, any>
  refine: (any) => void
}

export const Refine = createVComponent<any, refineFlavorProps>({
  assert: ({ props: { type, refine } }) => (value) => {
    type.assert(value)
    refine(value)
  },
  create: ({ props: { type } }) => (value) => type.create(value),
  flavorName: 'refine',
})

export interface selfishHelper {
  (self: object): any
}
export interface selfishHelpers {
  [name: string]: selfishHelper
}

interface propTypes {
  [propName: string]: vClass
}

export interface shapeFlavorProps {
  propTypes: propTypes
  helpers?: selfishHelpers
  isStrict?: boolean
}

const assertShape = (flavor: componentFlavor<shapeFlavorProps>) => {
  const {
    props: { propTypes, isStrict },
  } = flavor

  const assertNoExtraProps: assert<object> = (shape) => {
    const extraEntries = Object.entries(shape).filter(([propName]) => !propTypes[propName])
    assert(!extraEntries.length, `shape=${shape}: extra props ${extraEntries}`)
  }

  return (shape) => {
    assert(typeof shape === 'object', 'not an object')

    const errMessages = Object.entries(propTypes).map(([propName, propType]) => {
      try {
        propType.assert(shape[propName])
      } catch (e) {
        return e.message
      }

      return ''
    })

    assert(
      !errMessages.length,
      `shape=${shape}: bad or missing props
     ${new LogicError(errMessages).message}`
    )

    isStrict && assertNoExtraProps(shape)
  }
}

export const Shape = createVComponent<object, shapeFlavorProps>({
  defaultFlavorProps: {
    propTypes: {},
    isStrict: true,
    helpers: {},
  },
  assert: assertShape,
  create: ({ props: { propTypes, helpers } }) => (shape: { [key: string]: any }) => {
    const helperSpecs = mapShape(helpers as selfishHelpers, (helper) => ({
      get: () => helper(self),
      enumerable: false,
    }))

    const propSpecs = mapShape(shape, (prop, propName) => ({
      value: propTypes[propName].create(prop, `bad prop ${propName}`),
    }))

    const self = Object.create({}, propSpecs)
    Object.defineProperties(self, helperSpecs)
    return Object.freeze(self)
  },
  flavorName: 'shape',
})

export interface dictFlavorProps {
  type?: vClass
}
export const Dict = createVComponent<object, dictFlavorProps>({
  defaultFlavorProps: {
    type: any,
  },
  assert: ({ props: { type } }) => (shape) => {
    objectType.assert(shape)
    const errMessages: string[] = Object.entries(shape).reduce((messages: string[], [name, prop]) => {
      const errMessage = (type as vClass).validate(prop, `bad prop ${name}`)
      return errMessage ? [...messages, errMessage] : messages
    }, [])
    assert(!errMessages.length, errMessages)
  },
  create: ({ props: { type } }) => (shape: { [key: string]: any }) => {
    const self = mapShape(shape, (prop) => (type as vClass).create(prop))
    return Object.freeze(self)
  },
  flavorName: 'dict',
})

const findType = (types: vClass[]) => (value) => types.find((vType) => vType.is(value))

export interface unionFlavorProps {
  types: vClass[]
}

export const Union = createVComponent<any, unionFlavorProps>({
  assert: ({ props: { types } }) => (value) => assert(!!findType(types)(value), `does not match any types in union`),
  create: ({ props: { types } }) => (value) => (findType(types)(value) as vClass).create(value),
  flavorName: 'union',
})

export const array = createV((value) => assert(Array.isArray(value), 'not an array'))

export interface arrayFlavorProps {
  type: vClass
}

export const ArrayType = createVComponent<any[], arrayFlavorProps>({
  defaultFlavorProps: {
    type: any,
  },
  assert: ({ props: { type } }) => (arr) => {
    array.assert(arr)
    arr.forEach((element, index) => type.assert(element, `bad array element index=${index}`))
  },
  create: ({ props: { type } }) => (arr) => arr.map((element, index) => type.create(element)),
  flavorName: 'array',
})

export interface tupleFlavorProps {
  types: vClass<any>[]
}

export const Tuple = createVComponent<any[], tupleFlavorProps>({
  assert: ({ props: { types } }) => (arr) => {
    array.assert(arr)
    assert(arr.length === types.length, `bad array length length=${arr.length}, must be ${types.length}`)
    types.forEach((vElement, index) => vElement.assert(arr[index], `bad element index=${index}`))
  },
  create: ({ props: { types } }) => (arr) => arr.map((element, index) => types[index].create(element)),
  flavorName: 'tuple',
})

export interface jsonFlavorProps {
  type: vClass
}

export const Json = createVComponent<string, jsonFlavorProps>({
  assert: ({ props: { type } }) => (json) => {
    stringType.assert(json, `value must be string`)
    assert(() => JSON.parse(json))

    const jsonValue = (() => {
      try {
        return JSON.parse(json)
      } catch (e) {
        throw new LogicError('', e)
      }
    })()

    type.assert(jsonValue)
  },
  flavorName: 'json',
})
