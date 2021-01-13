/* @flow */
import { ReactNode } from 'react';
import * as React from 'react';
import ReactDOM from 'react-dom';

const portals = {};

export class PortalHandler extends React.Component<any, any> {
  element?: HTMLElement = null;

  componentDidMount() {
    const name = this.props.name;
    let portal = portals[name];
    if (!portal) {
      portal = { el: this.element };
      portals[name] = portal;
    } else {
      if (portal.el) {
        throw new Error(`Portal with name ${name} already exists`);
      }
      portal.el = this.element;
      if (portal.comp) {
        portal.comp.forceUpdate();
      }
    }
  }

  componentWillUnmount() {
    delete portals[this.props.name];
  }

  setRef = (ref?: HTMLElement) => {
    this.element = ref;
  };

  render() {
    return <span ref={this.setRef} />;
  }
}

// eslint-disable-next-line react/no-multi-comp
export class Portal extends React.Component<{ name: string; children: ReactNode }, null> {
  render() {
    const { name, children } = this.props;
    const portal = portals[name];
    if (!portal || !portal.el) {
      portals[name] = { comp: this };
      return null;
    }
    // $FlowFixMe - no createPortal in flow v0.56.0
    return ReactDOM.createPortal(children, portal.el);
  }
}
