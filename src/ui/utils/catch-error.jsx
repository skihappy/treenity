import React from 'react';
import { message } from 'antd';

export default class CatchError extends React.Component {
  state = {
    error: null,
    info: null,
  };

  componentDidCatch(error, info) {
    this.setState({ error, info });
    message.error(`Component error: ${error.message}`);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ background: 'red', color: 'white' }}>
          {this.state.error.stack}
          {`${this.state.info}`}
        </div>
      );
    }
    return this.props.children;
  }
}
