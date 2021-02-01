import React, { useContext } from 'react';

// const toArray = context => {
//   if (!context) return [];
//
//   if (typeof context === 'string') return context.split(' ');
//   else if (Array.isArray(context)) return context;
//
//   throw new Error(`context of wrong type ${typeof context}`);
// };

export const MetaContext = React.createContext<string>('');

export const Context = MetaContext.Provider;

// type Props = {
//   render?: (any) => React.ElementType;
//   children?: (any) => React.ElementType;
//   context?: string | Array<string>;
// };

// interface State {
//   added: { [key: string]: string };
// }

function mergeContexts(parent, current) {
  if (!'!?+-'.includes(current[0])) {
    parent = parent
      .split(' ')
      .filter((part) => part[0] === '!')
      .join(' ');
  }

  return `${parent} ${current}`;
}

export const useMetaContext = (context) => {
  const parentContext = useContext(MetaContext);
  if (context) {
    return mergeContexts(parentContext, context);
  }
  return parentContext;
};

// export default class MetaContext extends React.PureComponent<Props, State> {
//   parent: MetaContext;
//   state = { added: {} };
//   name: string;
//
//   static contextType = Context;
//
//   constructor(props) {
//     super(props);
//     this.name = props.name;
//   }
//
//   toString(): string {
//     return this.getContext().join(' ');
//   }
//
//   addContext(context, name = '') {
//     if (name) return this.findNamedContext(name).addContext(context);
//
//     const added = { ...this.state.added, [context]: toArray(context) };
//     this.setState({ added });
//
//     return () => {
//       const _added = { ...this.state.added };
//       delete _added[context];
//       this.setState({ added: _added });
//     };
//   }
//
//   getContext() {
//     let result = [];
//     if (this.context) {
//       if (this.context === this) console.error('Context parent equals to this context');
//       else result = [...result, ...this.context.getContext()];
//     }
//
//     // const added = Object.values(this.state.added);
//
//     result = [...result, ...toArray(this.props.context), ...Object.values(this.state.added)];
//
//     return uniq(flattenDeep(result));
//   }
//
//   has(tag) {
//     return this.getContext().includes(tag);
//   }
//
//   findNamedContext(name) {
//     if (this.name === name) {
//       return this;
//     }
//
//     if (this.context) {
//       return this.context.findNamedContext(name);
//     }
//
//     throw new Error(`Context with name (${name}) not found`);
//   }
//
//   // It's unnecessary now
//   getNearSpecificContext(context) {
//     let contextItems = toArray(context);
//     let containContext = this.getContext().some(c => contextItems.includes(c));
//
//     if (containContext) return this;
//
//     if (this.context) return this.context.getNearSpecificContext(context);
//
//     throw new Error(`Context (${context}) not found`);
//   }
//
//   render() {
//     const { render, children } = this.props;
//     const self = Object.create(this);
//     const child = render || children;
//
//     return (
//       <Context.Provider value={self}>
//         {typeof child === 'function' ? child(self) : child}
//       </Context.Provider>
//     );
//   }
// }
