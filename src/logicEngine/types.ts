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
  (value: any, errMessage?: string): any
}

export interface assert {
  (value: any, message?: string): void
}

type flavorSpec = vClass | string

export interface cast {
  fromType: vClass
  cast: (any) => any
}

export class vClass<props extends object = object> {
  private assertValue: assertValue
  private createValue: (value: any) => any
  public props: props
  public name: string
  public flavor: string
  public casts: cast[]

  constructor({
    createValue = () => (value) => value,
    assertValue,
    props,
    name,
    flavor = '',
    casts = [],
  }: {
    createValue?: (props: props) => create
    assertValue: (props: props) => assertValue

    flavor?: string | ((props: props) => string)
    props?: props
    name: string
    casts?: cast[] | ((props: props) => cast[])
  }) {
    //  const { createValue = () => (value) => value, assertValue, props = {}, name, flavor = '' } = classProps

    this.props = { ...(props || {}) } as props
    this.name = name
    this.flavor = typeof flavor === 'string' ? flavor : flavor(this.props)
    this.createValue = createValue(this.props)
    this.assertValue = assertValue(this.props)
    this.casts = typeof casts === 'function' ? casts(this.props) : casts
    Object.freeze(this)
  }

  assert(value, errMessage?: string) {
    try {
      this.assertValue(value)
    } catch (e) {
      throw new LogicError([`bad value=${value} of vType ${this.flavor}.${this.name}`, errMessage || ''], e)
    }
  }

  validate(value: any, message?: string): string | '' {
    try {
      this.assert(value, message)
      return ''
    } catch (e) {
      return e.message
    }
  }

  is(value: any): boolean {
    try {
      this.assert(value)
      return true
    } catch (e) {
      return false
    }
  }

  create(value: any, errMessage?: string) {
    this.assert(value, errMessage)
    const { cast } = this.casts.find(({ fromType }) => fromType.is(value)) || { cast: (v) => v }

    return this.createValue(cast(value))
  }

  static mixFlavors(...flavorSpecs: flavorSpec[]): string {
    return flavorSpecs.reduce((mixedFlavor: string, flavor) => {
      const newFlavor = flavor instanceof vClass ? flavor.flavor : flavor
      return newFlavor ? `${mixedFlavor} ${newFlavor}` : mixedFlavor
    }, '')
  }

  isFlavor(flavor: string): boolean {
    return this.flavor.split('').includes(flavor)
  }

  refined(refine: (vType) => assertValue): vClass {
    return Refine(
      {
        type: this,
        refine,
      },
      this.name
    )
  }

  defaultsTo(defaultValue): vClass {
    return Optional(
      {
        type: this,
        defaultValue,
      },
      this.name
    )
  }

  maybe(): vClass {
    return Maybe(
      {
        type: this,
      },
      this.name
    )
  }

  dictOf(name: string = `dict of ${this.name}`): vClass {
    return Dict({ propType: this }, name)
  }

  unionWith(types: vClass[], name: string = `union with ${this.name}`): vClass {
    return Union({ types: [this, ...types] }, name)
  }

  arrayOf(name: string = `array of ${this.name}`): vClass {
    return ArrayType({ elementType: this }, name)
  }
}

interface vComponentProps<props extends {}> {
  defaultProps?: Partial<props>
  createValue?: (props: Required<props>) => (value: any) => any
  assertValue: (props: Required<props>) => assertValue
  flavor?: flavorSpec | flavorSpec[] | ((props: Required<props>) => flavorSpec | flavorSpec[])
  casts?: cast[] | ((props: props) => cast[])
}

export function createVComponent<props extends {} = {}>(props: vComponentProps<props>) {
  const { flavor: flavorProp = '', defaultProps = {} } = props

  return (componentProps: props, name: string = ''): vClass<props> => {
    const defaultedComponentProps = mapShape(componentProps, (prop, name) => {
      const defaultProp = defaultProps[name]
      return !prop && !!defaultProp ? defaultProp : prop
    })
    const flavorSpecs = () =>
      toArray(typeof flavorProp === 'function' ? flavorProp(defaultedComponentProps as Required<props>) : flavorProp)
    const flavor = vClass.mixFlavors(...flavorSpecs())

    return new vClass<Required<props>>({
      ...{ ...props, flavor },
      props: defaultedComponentProps as Required<props>,
      name,
    })
  }
}

export const createV = (assertValue: assertValue, name: string = '') =>
  createVComponent({
    assertValue: () => assertValue,
  })({}, name)

export const v = createV((value) => assert(value instanceof vClass, `not logic type`), 'v')

export const vFlavor = createVComponent<{ flavor: string }>({
  assertValue: ({ flavor }) => (vType) => {
    v.assert(vType)
    assert(vType.isFlavor(flavor), `not of flavor=${flavor}`)
  },
})

export const any = createV(() => {})

const vTypeof = (type: string): vClass => createV((value) => typeof value === type, type)
export const stringType = vTypeof('string')
export const functionType = vTypeof('function')
export const numberType = vTypeof('number')
export const undefinedType = vTypeof('undefined')
export const objectType = vTypeof('object')
export const booleanType = vTypeof('boolean')
export const bigintType = vTypeof('bigint')
export const symbolType = vTypeof('symbol')

export interface literalComponentProps {
  value: any
}

export const Literal = createVComponent<literalComponentProps>({
  assertValue: ({ value: literalValue }) => (value) => assert(value === literalValue, `must be ${literalValue}`),
  flavor: 'literal',
})

export interface lateComponentProps {
  typeFactory: () => vClass
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

export const Maybe = createVComponent<{ type: vClass }>({
  assertValue: ({ type }) => {
    assert(!type.isFlavor('maybe'), 'target type can not be maybe flavor')
    assert(!type.isFlavor('optional'), 'target type can not be optional flavor')

    return (value) => {
      !!value && type.assert(value)
    }
  },
  flavor: ({ type }) => ['maybe', type],
})

export const Optional = createVComponent<{ type: vClass; defaultValue: any }>({
  assertValue: ({ type, defaultValue }) => {
    assert(!type.isFlavor('maybe'), 'target type can not be maybe flavor')
    assert(!type.isFlavor('optional'), 'target type can not be optional flavor')
    type.assert(defaultValue, 'bad default value')

    return (value) => v.assert(value)
  },
  createValue: ({ defaultValue }) => (value) => value || defaultValue,
  flavor: ({ type }) => ['optional', type],
})

const vVoid = createV((value) => assert(typeof value === 'undefined'), 'void')

export const Func = createVComponent<{ args?: vClass[]; result?: vClass }>({
  defaultProps: { args: [], result: any },
  assertValue: () => (func) => assert(typeof func === 'function', `not function type`),
  createValue: ({ args, result }) => (func) => typechecked(args, result)(func),
  flavor: 'func',
})

export interface refineComponentProps {
  type: vClass
  refine: (vType) => assertValue
}

export const Refine = createVComponent<refineComponentProps>({
  assertValue: ({ type, refine }) => (value) => {
    type.assert(value)
    refine(type)(value)
  },
  createValue: ({ type }) => (value) => type.create(value),
  flavor: ({ type }) => ['refined', type],
})

interface shapeComponentOptions {
  isStrict?: boolean
}

interface selfishHelpers {
  [name: string]: (self: { [key: string]: any }) => any
}

interface propTypes {
  [propName: string]: vClass
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

export const Shape = createVComponent<shapeComponentProps>({
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
  flavor: ['shape'],
})

export const Dict = createVComponent<{ propType: vClass }>({
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
  flavor: ['shape', 'dict'],
})

const findType = ({ types }: { types: vClass[] }) => (value) => types.find((vType) => vType.is(value))

export interface unionComponentProps {
  types: vClass[]
}

export const Union = createVComponent<unionComponentProps>({
  assertValue: (props) => (value) => assert(!!findType(props)(value), `does not match any types in union`),
  createValue: (props) => (value) => (findType(props)(value) as vClass).create(value),
  flavor: ['union'],
})

export const array = createV((value) => assert(Array.isArray(value), 'not an array'), 'array')

export interface arrayComponentProps {
  elementType: vClass
}

export const ArrayType = createVComponent<arrayComponentProps>({
  defaultProps: {
    elementType: any,
  },
  assertValue: ({ elementType }) => (arr) => {
    array.assert(arr)
    arr.forEach((element, index) => elementType.assert(element, `bad array element index=${index}`))
  },
  createValue: ({ elementType }) => (arr) => arr.map((element, index) => elementType.create(element)),
  flavor: ['array'],
})

export interface tupleComponentProps {
  elementTypes: vClass[]
}

export const Tuple = createVComponent<tupleComponentProps>({
  defaultProps: {
    elementTypes: [],
  },
  assertValue: ({ elementTypes }) => (arr) => {
    array.assert(arr)
    assert(arr.length === elementTypes.length, `bad array length length=${arr.length}, must be ${elementTypes.length}`)
    elementTypes.forEach((vElement, index) => vElement.assert(arr[index], `bad element index=${index}`))
  },
  createValue: ({ elementTypes }) => (arr) => arr.map((element, index) => elementTypes[index].create(element)),
  flavor: ['array', 'tuple'],
})

export interface jsonComponentProps {
  type: vClass
}

export const Json = createVComponent<jsonComponentProps>({
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
  flavor: ({ type }) => ['JSON', type],
})
