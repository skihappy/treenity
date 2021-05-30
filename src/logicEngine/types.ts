import { LogicError, mapShape, typechecked, assert, toArray, reduceShape } from './utils'
import { IAnyType, isType, types as t } from 'mobx-state-tree'

export interface func {
  (...[]: any[]): any
}

export interface assertValue {
  (value: any): void
}

export interface validate {
  (value: any): string | ''
}

export interface create {
  (value: any, errMessage?: string | string[]): any
}

export interface assert {
  (value: any, message?: string | string[]): void
}

export interface cast {
  fromType: vClass
  cast: (any) => any
}

interface classProps<props> {
  createValue?: (props: props) => create
  assertValue: (props: props) => assertValue

  flavor?: string
  props?: props
  name: string
  casts?: cast[]
}

export class vClass<props extends object = object, value = any> {
  private readonly assertValue: assertValue
  private readonly createValue: (value: value) => value
  public readonly props: props
  public readonly name: string
  public readonly flavor: string
  public readonly casts: cast[]
  private readonly constructorProps: classProps<props>

  constructor(constructorProps: classProps<props>) {
    const {
      createValue = (props: props) => (value: value) => value,
      assertValue,
      props,
      name,
      flavor = '',
      casts = [],
    } = constructorProps

    this.constructorProps = constructorProps
    this.props = Object.freeze({ ...(props || {}) } as props)
    this.name = name
    this.flavor = flavor
    this.createValue = createValue(this.props as props)
    this.assertValue = assertValue(this.props as props)
    this.casts = casts || {}
  }

  assert(value: value, errMessage?: string) {
    try {
      this.assertValue(value)
    } catch (e) {
      throw new LogicError([`bad value=${value} of vType ${this.flavor}.${this.name}`, errMessage || ''], e)
    }
  }

  validate(value: value, message?: string): string | '' {
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

  create(value: value, errMessage?: string): value {
    this.assert(value, errMessage)
    const { cast } = this.casts.find(({ fromType }) => fromType.is(value)) || { cast: (v) => v }

    return this.createValue(cast(value))
  }

  refined(refine: assertValue) {
    return Refine(
      {
        type: this as vClass<any, any>,
        refine,
      },
      this.name
    )
  }

  defaultsTo(defaultValue: value) {
    return Optional(
      {
        type: this as vClass<any, any>,
        defaultValue,
      },
      this.name
    )
  }

  maybe(): vClass<maybeComponentProps> {
    return Maybe(
      {
        type: this as vClass<any, any>,
      },
      this.name
    )
  }

  dictOf(name: string = `dict of ${this.name}`) {
    return Dict({ propType: this as vClass<any, any> }, name)
  }

  unionWith(types: vClass[], name: string = `union with ${this.name}`): vClass<unionComponentProps> {
    return Union({ types: [this as vClass<any, any>, ...types] }, name)
  }

  arrayOf(name: string = `array of ${this.name}`): vClass<arrayComponentProps> {
    return ArrayType({ elementType: this as vClass<any, any> }, name)
  }

  cast(casts: cast[] | cast): vClass<props> {
    const { casts: oldCasts, ...rest } = this.constructorProps
    return new vClass<props>({ ...rest, casts: [...toArray(oldCasts), ...toArray(casts)] })
  }
}

interface vComponentProps<props extends object, value = any> {
  defaultProps?: Partial<props>
  createValue?: (props: Required<props>) => (value: value) => value
  assertValue: (props: Required<props>) => assertValue
  flavor?: string
}

export function createVComponent<props extends object = object, value = any>(props: vComponentProps<props, value>) {
  const { flavor: flavorProp = '', defaultProps = {} } = props

  return (componentProps: props, name: string = '') => {
    const defaultedComponentProps = mapShape(componentProps, (prop, name) => {
      const defaultProp = defaultProps[name]
      return !prop && !!defaultProp ? defaultProp : prop
    })

    return new vClass<Required<props>, value>({
      ...props,
      props: defaultedComponentProps as Required<props>,
      name,
    })
  }
}

interface createVOptions<value> extends Pick<vComponentProps<object, value>, 'flavor' | 'createValue'> {
  name?: string
}
export const createV = <value>(assertValue: assertValue, options?: createVOptions<value>) => {
  const { name, ...restOptions } = options || {}
  return createVComponent<object, value>({
    ...restOptions,
    assertValue: () => assertValue,
  })({}, name)
}

export const v = createV((value) => assert(value instanceof vClass, `not logic type`), { name: 'v' })

export const any = createV(() => {})

const vTypeof = <value = any>(type: string): vClass<object> =>
  createV<value>((value) => typeof value === type, {
    name: type,
    flavor: type,
  })

export const stringType = vTypeof<string>('string')
export const functionType = <args extends [] = [], res = any>() => vTypeof<(...args) => res>('function')
export const numberType = vTypeof<number>('number')
export const undefinedType = vTypeof<undefined>('undefined')
export const objectType = vTypeof<object>('object')
export const booleanType = vTypeof<boolean>('boolean')
export const bigintType = vTypeof<bigint>('bigint')
export const symbolType = vTypeof<symbol>('symbol')

export interface literalComponentProps {
  value: any
}

export const Literal = createVComponent<literalComponentProps>({
  assertValue: ({ value: literalValue }) => (value) => assert(value === literalValue, `must be ${literalValue}`),
  flavor: 'literal',
})

export interface lateComponentProps {
  typeFactory: () => vClass<any, any>
}

export const Late = createVComponent<lateComponentProps>({
  assertValue: ({ typeFactory }) => (value) => assert(typeFactory().is(value)),
  createValue: ({ typeFactory }) => (value) => typeFactory().create(value),
  flavor: 'late',
})

export interface serializableComponentProps {
  mstType: IAnyType
}

export const Serializable = createVComponent<serializableComponentProps>({
  assertValue: ({ mstType }) => (value) => assert(mstType.is(value)),
  flavor: 'serializable',
  createValue: ({ mstType }) => (value) => mstType.create(value),
})

export const serializableType = createV((type) =>
  assert(type.isFlavor('serializable', 'must be serializable type'), 'serializable')
)

export interface maybeComponentProps {
  type: vClass<any, any>
}
export const Maybe = createVComponent<maybeComponentProps>({
  assertValue: ({ type }) => {
    assert(type.flavor === 'maybe', 'target type can not be maybe flavor')
    assert(type.flavor === 'optional', 'target type can not be optional flavor')

    return (value) => {
      !!value && type.assert(value)
    }
  },
  flavor: 'maybe',
})

export interface optionalComponentProps {
  type: vClass<any, any>
  defaultValue: any
}
export const Optional = createVComponent<optionalComponentProps, {}>({
  assertValue: ({ type, defaultValue }) => (value) => {
    assert(type.flavor === 'maybe', 'target type can not be maybe flavor')
    assert(type.flavor === 'optional', 'target type can not be optional flavor')
    type.assert(defaultValue, 'bad default value')
    type.assert(value)
  },
  createValue: ({ defaultValue }) => (value) => value || defaultValue,
  flavor: 'optional',
})

const vVoid = createV((value) => assert(typeof value === 'undefined'), { name: 'void' })

export interface funcComponentProps {
  args?: vClass<any, any>[]
  result?: vClass<any, any>
}
export const Func = createVComponent<funcComponentProps, () => any>({
  defaultProps: { args: [], result: any },
  assertValue: () => (func) => assert(typeof func === 'function', `not function type`),
  createValue: ({ args, result }) => (func) => typechecked(args, result)(func),
  flavor: 'func',
})

export interface refineComponentProps {
  type: vClass<any, any>
  refine: assertValue
}

export const Refine = createVComponent<refineComponentProps>({
  assertValue: ({ type, refine }) => (value) => {
    type.assert(value)
    refine(value)
  },
  createValue: ({ type }) => (value) => type.create(value),
  flavor: 'refine',
})

interface shapeComponentOptions {
  isStrict?: boolean
}

export interface selfishHelper {
  (self: { [key: string]: any }): any
}
export interface selfishHelpers {
  [name: string]: selfishHelper
}

interface propTypes {
  [propName: string]: vClass<any>
}

export interface shapeComponentProps {
  propTypes: propTypes
  helpers?: selfishHelpers
  options?: shapeComponentOptions
}

const defaultShapeComponentProps = {
  propTypes: {},
  options: { isStrict: false },
  helpers: {},
}

const assertShape = (props: Required<shapeComponentProps>): assertValue => {
  const { propTypes, options } = props

  const assertNoExtraProps: assertValue = (shape) => {
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

    options.isStrict && assertNoExtraProps(shape)
  }
}

export const Shape = createVComponent<shapeComponentProps, object>({
  defaultProps: defaultShapeComponentProps,
  assertValue: assertShape,
  createValue: ({ propTypes, helpers }) => (shape: { [key: string]: any }) => {
    const helperSpecs = mapShape(helpers, (helper) => ({
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
  flavor: 'shape',
})

export interface dictComponentProps {
  propType: vClass<any>
}
export const Dict = createVComponent<dictComponentProps, object>({
  assertValue: ({ propType }) => (shape) => {
    objectType.assert(shape)
    const errMessages: string[] = Object.entries(shape).reduce((messages: string[], [name, prop]) => {
      const errMessage = propType.validate(prop, `bad prop ${name}`)
      return errMessage ? [...messages, errMessage] : messages
    }, [])
    assert(!errMessages.length, errMessages)
  },
  createValue: ({ propType }) => (shape: { [key: string]: any }) => {
    const self = mapShape(shape, (prop) => propType.create(prop))
    return Object.freeze(self)
  },
  flavor: 'dict',
})

const findType = ({ types }: { types: vClass[] }) => (value) => types.find((vType) => vType.is(value))

export interface unionComponentProps {
  types: vClass<any>[]
}

export const Union = createVComponent<unionComponentProps>({
  assertValue: (props) => (value) => assert(!!findType(props)(value), `does not match any types in union`),
  createValue: (props) => (value) => (findType(props)(value) as vClass).create(value),
  flavor: 'union',
})

export const array = createV((value) => assert(Array.isArray(value), 'not an array'), { name: 'array' })

export interface arrayComponentProps {
  elementType: vClass<any>
}

export const ArrayType = createVComponent<arrayComponentProps, any[]>({
  defaultProps: {
    elementType: any,
  },
  assertValue: ({ elementType }) => (arr) => {
    array.assert(arr)
    arr.forEach((element, index) => elementType.assert(element, `bad array element index=${index}`))
  },
  createValue: ({ elementType }) => (arr) => arr.map((element, index) => elementType.create(element)),
  flavor: 'array',
})

export interface tupleComponentProps {
  elementTypes: vClass<any>[]
}

export const Tuple = createVComponent<tupleComponentProps, any[]>({
  defaultProps: {
    elementTypes: [],
  },
  assertValue: ({ elementTypes }) => (arr) => {
    array.assert(arr)
    assert(arr.length === elementTypes.length, `bad array length length=${arr.length}, must be ${elementTypes.length}`)
    elementTypes.forEach((vElement, index) => vElement.assert(arr[index], `bad element index=${index}`))
  },
  createValue: ({ elementTypes }) => (arr) => arr.map((element, index) => elementTypes[index].create(element)),
  flavor: 'tuple',
})

export interface jsonComponentProps {
  type: vClass<any, any>
}

export const Json = createVComponent<jsonComponentProps, string>({
  assertValue: ({ type }) => (jsonString) => {
    stringType.assert(jsonString, `value must be string`)
    assert(() => jsonString.parseJSON())

    const jsonValue = (() => {
      try {
        return jsonString.parseJSON()
      } catch (e) {
        throw new LogicError('', e)
      }
    })()

    type.assert(jsonValue)
  },
  flavor: 'json',
})
