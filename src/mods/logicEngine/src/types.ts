/**
 * Custom typing system used internally
 * No user need to ever interact with it. However, it is useful when hard coding type compositions outside
 * of scripting environment. It is always possible to use a vType directly instead of its composition
 * @module
 */

import { LogicError, mapShape, assert, toArray, deepTransform, deepExtend, deepDefault } from './utils'

/**
 * @ignore
 *  any function
 */
export type anyFunc = (any) => any

/**
 * given a func, returns a flavor wrapper of the func
 * @typeParam func function to be wrapped
 * @typeParam flavorProps props of wrapping flavor (if complex flavor)
 * @prop flavor wrapping flavor
 */
interface funcFactory<func extends anyFunc = anyFunc, flavorProps extends object = object> {
  (flavor: parametrizedFlavor<flavorProps>): func
}

/**
 * flavor wrapped assert function
 * @typeParam value to assert
 * @typeParam flavorProps props of wrapping flavor (if complex flavor)
 */
type assertFactory<value = any, flavorProps extends object = object> = funcFactory<assert<value>, flavorProps>

/**
 * flavor wrapped create function
 * @typeParam value to create
 * @typeParam flavorProps props of wrapping flavor (if complex flavor)
 */
type createFactory<value = any, flavorProps extends object = object> = funcFactory<create<value>, flavorProps>

/**
 * assertion function
 * @category V
 * @remark This is the workhorse of creation, and the base of any classification system, including this one..
 * Assertions are written apriori. They verify value, or throw Error class, which is converted to {@link LogicError} class
 * @remark asserts a value and returns, or throws
 * @prop value value to assert
 * @throws {@link LogicError}
 */
export interface assert<value> {
  (value: value): void
}

/**
 * create function
 * @category V
 * @remark creates type of value, after asserting it. So, it will throw per {@link assert}
 * @remark must return value of its type
 * @prop value value to create
 * @prop message if assertion fails, extends the assertion message {@see LogicError}
 * @typeParam value value
 * @returns value of its type
 * @throws {@link LogicError}
 */
export interface create<value> {
  (value: value, message?: string | string[]): value
}

/**
 * A shorthand for the simplest possible flavor, a name
 */
export type simpleFlavor = string

/**
 * Complex flavor
 * one of classifications of a type, a complex type in this case, a shape
 * There are two kinds of flavors, complex and simple
 * Complex flavor is an object with additional props, depending on context
 * There are all kinds of flavor types, each refining or extending this definition
 * * Simple flavor is just a name
 * @typeParam flavorProps the props of the flavor factory that cooked the type so flavored
 */
export interface complexFlavor {
  /**
   * Flavor name may not always be relevant
   */
  flavorName?: simpleFlavor
  /**
   * complex flavors have another optional classifier, to tell the products of factory apart
   * Defaults to {@link flavorName}
   */
  typeName?: string
}

/**
 * flavor of a parametrized type
 */
export interface parametrizedFlavor<flavorProps extends object = object> extends complexFlavor {
  /**
   * Props of factory generating a parametrized particle
   */
  props: flavorProps
}

/**
 * Flavor is metadata of a particle
 * There are two kinds of flavors, complex and elementary.
 * @typeParam flavorProps the props of the flavor factory that cooked the type so flavored
 */
export type flavor = simpleFlavor | complexFlavor

/**
 * describes a cast, between two types.
 * @typeParam toValue destination value, to be casted to
 */
export interface cast<toValue = any> {
  castName: string
  fromType: vClass
  /**
   * skip when hanging casts on a new type
   */
  toType?: vClass
  /**
   * casting function. fromType value in, out toType value.
   * @param fromValue typecheck is done by now
   */
  cast: (fromValue: any) => toValue
}

/**
 * flavor wrapped cast. a factory that picks up flavor, and spits out a cast
 * used when building flavor factories
 * @typeParam toValue destination value, to be casted to
 * @typeParam flavorProps the props of the flavor factory, that cooked the type so flavored
 */
export interface castFactory<toValue = any, flavorProps extends object = object> {
  (flavor: parametrizedFlavor<flavorProps>): cast<toValue>
}

/**
 * an array
 * used when building flavor factories
 * @typeParam toValue destination value, to be casted to
 * @typeParam flavorProps the props of the flavor factory, that cooked the type so flavored
 */
export type castFactories<toValue = any, flavorProps extends object = object> = castFactory<toValue, flavorProps>[]

export type casts<toValue> = cast<toValue>[]

/**
 * vClass constructor props
 * @typeParam flavorProps the props of the flavor factory that cooked the type so flavored
 * @typeParam value
 */
interface vClass_props<value = any, flavorProps extends object = object> {
  create?: create<value>
  assert: assert<value>
  flavor?: parametrizedFlavor<flavorProps>
  casts?: casts<value>
}

/**
 * class representing a vType
 * @typeParam flavorProps the props of the flavor factory that cooked the type so flavored
 * @typeProp value
 */
export class vClass<value = any, flavorProps extends object = object> {
  protected readonly assertion: assert<value>
  public readonly typeName: string
  /**
   * @remark defaults to flavor name for elementary flavors
   */
  public readonly flavorName: string
  /**
   * {@link parametrizedFlavor.props}
   */
  public readonly flavor: parametrizedFlavor<flavorProps>
  public readonly casts: casts<value>
  private readonly _constructorProps: vClass_props<value>

  constructor(vClass_props: vClass_props<value, flavorProps>) {
    this._constructorProps = deepDefault(vClass_props, {
      flavor: '',
      casts: {},
      create: (value) => value,
    })

    const { assert, flavor, casts } = this._constructorProps

    this.assertion = assert
    this.flavor = flavor as parametrizedFlavor<flavorProps>
    const { flavorName = '', typeName = flavorName } = this.flavor
    this.typeName = typeName
    this.flavorName = flavorName
    this.casts = (casts as casts<value>).map(({ castName, fromType, ...rest }) => ({
      castName: castName || fromType.typeName,
      toType: this,
      fromType,
      ...rest,
    })) as casts<value>
  }

  /**
   *{@link assert}
   */
  assert(value: value, errMessage: string[] | string = '') {
    try {
      this.assertion(value)
    } catch (e) {
      throw new LogicError([`bad value=${value} of flavor ${this.flavorName}`, ...toArray(errMessage || '')], e)
    }
  }

  /**
   * asserts and returns error string on negative, empty string on positive
   * @param value
   * @param message prefixes assert error message
   */
  validate(value: value, message: string | string[] = ''): string | '' {
    try {
      this.assert(value, message)
      return ''
    } catch (e) {
      return e.message
    }
  }

  /**
   * is this it?
   * @param value
   */
  is(value: value): boolean {
    try {
      this.assert(value)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * applies the casts if any match, asserts, creates and spits out
   * @param value
   * @param errMessage prefixes assert error message
   */
  create(value: any, errMessage: string[] | string = ''): value {
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

  /**
   * producers new type, refined from this one
   * @param refine refining assertion
   * @returns new refined type
   */
  refined(refine: assert<value>): vClass<value, refineFlavorProps> {
    return Refine({
      type: this as vClass<value, flavorProps>,
      refine,
    })
  }

  /**
   * producers new optional type
   * @param defaultValue
   * @returns new optional type
   */
  defaultsTo(defaultValue: value): vClass<value, optionalFlavorProps> {
    return Optional({
      type: this as vClass<value, flavorProps>,
      defaultValue,
    })
  }

  /**
   * producers new maybe type
   * @returns new maybe type
   */
  maybe(): vClass<value | undefined, maybeFlavorProps> {
    return Maybe({
      type: this as vClass<value, flavorProps>,
    })
  }

  /**
   * producers new dict type, of this type
   * @returns new dict type
   */
  dictOf(): vClass<object, dictFlavorProps> {
    return Dict({ type: this as vClass<value, flavorProps> })
  }

  /**
   * producers new union type
   * @param types union member types, along with this type
   */
  unionWith(types: vClass[]): vClass<value | any, unionFlavorProps> {
    return Union({ types: [this as vClass<any, any>, ...types] })
  }

  /**
   * producers new array type, of this type
   */
  arrayOf(): vClass<value[], arrayFlavorProps> {
    return ArrayType({ type: this as vClass<value, flavorProps> })
  }

  /**
   * returns new type with specified, extra casts
   * @param casts
   */
  setCasts(casts: casts<value> = []): vClass<value, flavorProps> {
    const { casts: oldCasts } = this._constructorProps
    return new vClass<value, flavorProps>({
      ...this._constructorProps,
      flavor: this.flavor,
      casts: [...(this._constructorProps.casts || []), ...casts],
    })
  }

  /**
   * extends this type
   * It extends the [[flavor]] of the type,  by extending its flavor.
   * If its a parametrized type, like a Shape, it is possible to extend flavor props to produce an extended type, like
   * a new shape
   * @param flavorExtender just what it says.A deep extend is performed
   */
  extendFlavor(flavorExtender: object): vClass<value, flavorProps> {
    const extendedFlavor = deepExtend(this.flavor, flavorExtender)
    return new vClass<value, flavorProps>({
      ...this._constructorProps,
      flavor: extendedFlavor,
    })
  }
}

/**
 * props of createVTypeFactory
 * it has almost same structure as {@link vClass_props} but all functions are wrapped in flavor,
 * being conditioned by the props of type factory being created
 */
interface createVTypeFactory_Props<value = any, flavorProps extends object = object> {
  /**
   * default values for vType factory props that are optional, as typed by {@link flavorProps}
   */
  defaultFlavorProps?: Partial<flavorProps>
  /**
   * flavor wrapped create function, to create any type of this {@link flavorName}
   */
  create?: createFactory<value, flavorProps>
  /**
   * flavor wrapped assertion, to assert any type of this {@link flavorName}
   */
  assert: assertFactory<value, flavorProps>
  /**
   * the name of this flavor. All types, produced by the type factory, will be of similar
   * flavor, same name, but different props, though same type of {@link flavorProps}, typed by flavorProps typeParam
   */
  flavorName: string
  /**
   * given flavor of new type, asserts some extra constraints on {@link flavorProps} not
   * expressed by typescript type
   * @param flavor flavor of new type, produced by type factory, the one we are constructing
   */
  flavorPropsConstraint?: (flavor: parametrizedFlavor<flavorProps>) => void
  /**
   * array of flavor wrapped casts. Each cast is conditioned by flavor
   */
  casts?: castFactories<value, flavorProps>
}

/**
 * takes {@link flavorProps} and returns a type of the same flavor name, as specified by the parent
 * {@link createVTypeFactory_Props}, similarly flavored by {@link flavor}
 * @typeParam value value asserted by this class of similar flavored types, products of this type factory
 * @typeParam flavorProps shape of props of the type factory in making
 * @prop flavorProps shape of props needed to produce new type
 * @prop [typeName] optional name, defaults to {@link createVTypeFactory_Props.flavorName}
 * this is an extra classification available to control behavior of other constructs of this classification system
 */
export interface vTypeFactory<value = any, flavorProps extends object = object> {
  (flavorProps: flavorProps, typeName?: string): vClass<value, flavorProps>
}

/**
 * returns {@link vTypeFactory}
 * @typeParam value value asserted by this class of similar flavored types, products of this type factory
 * @typeParam flavorProps shape of props of the type factory in making
 */
export function createVTypeFactory<value = any, flavorProps extends object = object>(
  props: createVTypeFactory_Props<value, flavorProps>
): vTypeFactory<value, flavorProps> {
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

  return (flavorProps, typeName?) => {
    const defaultedFlavorProps = deepDefault(flavorProps, defaultFlavorProps)
    const flavor = {
      typeName,
      flavorName,
      props: flavorProps,
    }

    flavorPropsConstraint(flavor)

    return new vClass<value, flavorProps>({
      flavor: flavor as parametrizedFlavor<flavorProps>,
      assert: assertFactory(flavor),
      create: createFactory(flavor),
      casts: castFactories.map((castFactory) => castFactory(flavor)),
    })
  }
}

/**
 * Options parameter for {@link createV}
 * @typeParam value createV creates type, that asserts this value
 */
export interface createVOptions<value = any> {
  /**
   * used as both typeName and [[flavor.flavorName]] of new type
   */
  typeName?: string
  /**
   * possible casts.
   * {@link vClass.create} will cast automaticly. {@link vClass.is} will return false on anything but type itself.
   */
  casts?: casts<value>
  /**
   * must return value of the type
   * use custom create in composed types
   */
  create?: create<value>
}

/**
 * type factory
 * @param assert asserts the type.
 * @param options {@link createVOptions}
 * @typeParam value static type of new type.
 */
export const createV = <value = any>(assert: assert<value>, options?: createVOptions<value>): vClass<value> => {
  const { typeName, casts, create } = deepDefault(options || {}, {
    typeName: '',
    casts: [],
    create: (value) => value,
  })

  return new vClass<value>({ assert, casts, create, flavor: { typeName, flavorName: typeName, props: {} } })
}

/**
 * type asserting {@link vClass}, vType
 * @category vType
 */
export const v = <vClass<object, any>>(
  createV((value) => assert(value instanceof vClass, `not logic type`), { typeName: 'v' })
)

/**
 * type asserting any value
 * @category vType
 */
export const any = createV(() => {}, { typeName: 'any' })

/**
 * @internal
 * @param type
 */
const vTypeof = <value = any>(type: string): vClass<value> =>
  createV<value>((value) => typeof value === type, {
    typeName: type,
  })

/**
 * type asserting string
 * @category vType
 */
export const stringType = vTypeof<string>('string')
/**
 * type asserting any function
 * @category vType
 */
export const functionType = vTypeof<() => any>('function')
/**
 * type asserting number
 * @category vType
 */
export const numberType = vTypeof<number>('number')
/**
 * type asserting undefined
 * @category vType
 */
export const undefinedType = vTypeof<undefined>('undefined')
/**
 * type asserting object
 * @category vType
 */
export const objectType = vTypeof<object>('object')
/**
 * type asserting boolean
 * @category vType
 */
export const booleanType = vTypeof<boolean>('boolean')
/**
 * type asserting bigint
 * @category vType
 */
export const bigintType = vTypeof<bigint>('bigint')
/**
 * type asserting symbol
 * @category vType
 */
export const symbolType = vTypeof<symbol>('symbol')

/**
 * props of literal type factory
 */
export interface literalFlavorProps {
  /**
   * literal value
   */
  value: any
}

/**
 * literal type factory
 * {@see literalFlavorProps}
 * @category vType factory
 */
export const Literal = createVTypeFactory<any, literalFlavorProps>({
  assert: ({ props: { value: literalValue } }) => (value) => assert(value === literalValue, `must be ${literalValue}`),
  flavorName: 'literal',
})

/**
 * props of late type factory
 */
export interface lateFlavorProps {
  /**
   * a func returning vType
   */
  typeFactory: () => vClass<any, any>
}

/**
 * Late type factory
 * {@see literalFlavorProps}
 * @category vType factory
 */
export const Late = createVTypeFactory<any, lateFlavorProps>({
  assert: ({ props: { typeFactory } }) => (value) => assert(typeFactory().is(value)),
  create: ({ props: { typeFactory } }) => (value) => typeFactory().create(value),
  flavorName: 'late',
})

/**
 * props of Maybe type factory
 */
export interface maybeFlavorProps {
  /**
   * type to be converted to maybe
   */
  type: vClass
}

/**
 * Maybe type factory
 * Converts any type into nullable type. Makes sense only as a prop of an object
 * @category vType factory
 */
export const Maybe = createVTypeFactory<any, maybeFlavorProps>({
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

/**
 * Props of Optional type factory
 */
export interface optionalFlavorProps {
  /**
   * type to be converted into optional
   */
  type: vClass<any, any>
  /**
   * default value. Must be of correct type
   */
  defaultValue: any
}

/**
 * Optional type factory
 * Converts any type into defaulted value. If value is falsy, default value is used
 * @category vType factory
 */
export const Optional = createVTypeFactory<any, optionalFlavorProps>({
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

/**
 * Void type
 * Simply asserts undefined
 * @category vType factory
 */
const vVoid = createV((value) => assert(typeof value === 'undefined'), { typeName: 'void' })

/**
 * props for func type factory
 */
export interface funcFlavorProps {
  /**
   * array of argument types
   */
  args?: vClass<any, any>[]
  /**
   * type of returned value
   */
  result?: vClass<any, any>
}

/**
 * function type factory
 * creates a typechecked function
 * {@see funcFlavorProps}
 * @category vType factory
 */
export const Func = createVTypeFactory<(...[]) => any, funcFlavorProps>({
  defaultFlavorProps: { args: [], result: undefinedType },
  assert: () => (func) => assert(typeof func === 'function', `not function type`),
  create: ({ props: { args = [], result = undefinedType } }) => (func: (...[]) => any) => (...args: []) => {
    const result = func(...Tuple({ types: args }).create(args))
    return result.create(result)
  },
  flavorName: 'typecheckedFunction',
})

/**
 * props of refine type factory
 */
export interface refineFlavorProps {
  /**
   * type to be refined
   */
  type: vClass<any, any>
  /**
   * refinement assertion
   * @param any value
   */
  refine: (any) => void
}

/**
 * Refine type factory
 * adds additional assertion, constraint to the existing type
 * {@see refineFlavorProps}
 * @category vType factory
 */
export const Refine = createVTypeFactory<any, refineFlavorProps>({
  assert: ({ props: { type, refine } }) => (value) => {
    type.assert(value)
    refine(value)
  },
  create: ({ props: { type } }) => (value) => type.create(value),
  flavorName: 'refine',
})

/**
 * each helper is wrapped into a factory function that takes one param-the actual vale of shape at run time
 * Whatever it spits out is the visible helper
 */
export interface selfishHelper {
  (self: object): any
}
/**
 * an abject of helpers can be provided. Each helper becomes an innumerable prop of the asserted shape, by create method
 * {@see selfishHelper}
 */
export interface selfishHelpers {
  [name: string]: selfishHelper
}

/**
 * a shape defining types of props, the model of shape to be asserted
 */
interface propTypes {
  [propName: string]: vClass
}

/**
 * props of shape type factory
 */
export interface shapeFlavorProps {
  /**
   * specifies types of props, of the shape to be asserted
   * {@link propTypes}
   */
  propTypes: propTypes
  /**
   * a shape of helpers, to be added as non numerable props by create method
   * Each is a function {@link selfishHelpers}
   */
  helpers?: selfishHelpers
  /**
   * if true, no additional props will be asserted, beyond {@link propTypes}
   */
  isStrict?: boolean
}

/**
 * Shape type factory
 * Asserts either exact shape in strict mode, otherwise allows additional shape props
 * This is a composed type. Create method will operate on entire tree structure.
 * {@see shapeFlavorProps}
 * @category vType factory
 */
export const Shape = createVTypeFactory<{ [key: string]: any }, shapeFlavorProps>({
  defaultFlavorProps: {
    propTypes: {},
    isStrict: true,
    helpers: {},
  },
  /**
   * {@link assertShape}
   */
  assert: ({ props: { propTypes, isStrict } }) => {
    const assertNoExtraProps: assert<object> = (shape) => {
      const extraEntries = Object.entries(shape).filter(([propName]) => !propTypes[propName])
      assert(!extraEntries.length, `shape=${shape}: extra props ${extraEntries}`)
    }

    return (shape) => {
      assert(typeof shape === 'object', 'not an object')

      const errMessages = Object.entries(propTypes).map(([propName, propType]) => {
        try {
          ;(propType as vClass).assert(shape[propName])
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
  },
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

/**
 * props of dict type factory
 */
export interface dictFlavorProps {
  /**
   * type of dict prop.All props are of same type.
   */
  type?: vClass
}

/**
 * Dict type factory
 * Shape where all props are of the same type
 * {@see dictFlavorProps}
 * @category vType factory
 */
export const Dict = createVTypeFactory<object, dictFlavorProps>({
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

/**
 * @ignore
 */
const findType = (types: vClass[]) => (value) => types.find((vType) => vType.is(value))

/**
 * Props of union type factory
 */
export interface unionFlavorProps {
  /**
   * an array of types of the union
   */
  types: vClass[]
}

/**
 * union type factory
 * create method searches for the first matching type, to create value.
 * So, sequence in the {@link unionFlavorProps.types} array matters.
 * {@see unionFlavorProps}
 * @category vType factory
 */
export const Union = createVTypeFactory<any, unionFlavorProps>({
  assert: ({ props: { types } }) => (value) => assert(!!findType(types)(value), `does not match any types in union`),
  create: ({ props: { types } }) => (value) => (findType(types)(value) as vClass).create(value),
  flavorName: 'union',
})

/**
 * array type.  not a composed type.
 * @category vType
 */
export const array = createV((value) => assert(Array.isArray(value), 'not an array'), { typeName: 'array' })

/**
 * props of arrayType factory
 */
export interface arrayFlavorProps {
  /**
   * type of all the elements of array
   */
  type: vClass
}

/**
 * type of array of same type of elements
 * This is a composed type. Create method will propagate thru array elements
 * {@see arrayFlavorProps}
 * @category vType factory
 */
export const ArrayType = createVTypeFactory<any[], arrayFlavorProps>({
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

/**
 * props of tuple type factory
 */
export interface tupleFlavorProps {
  /**
   * list of element types in the tuple
   * no extras are allowed
   */
  types: vClass<any>[]
}

/**
 * Tupple type factory
 * Type of each element is specified by {@link tupleFlavorProps}
 * This is a composed type. Create method propagates thru tuple elements.
 * @category vType factory
 */
export const Tuple = createVTypeFactory<any[], tupleFlavorProps>({
  assert: ({ props: { types } }) => (arr) => {
    array.assert(arr)
    assert(arr.length === types.length, `bad array length length=${arr.length}, must be ${types.length}`)
    types.forEach((vElement, index) => vElement.assert(arr[index], `bad element index=${index}`))
  },
  create: ({ props: { types } }) => (arr) => arr.map((element, index) => types[index].create(element)),
  flavorName: 'tuple',
})

/**
 * props of json type factory
 */
export interface jsonFlavorProps {
  /**
   * type of structure inside json string
   */
  type: vClass
}

/**
 * Json type factory
 * Given type of structure inside json string, asserts the json parsed value
 * {@see jsonFlavorProps}
 * @category vType factory
 */
export const Json = createVTypeFactory<string, jsonFlavorProps>({
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
