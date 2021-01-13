import React from 'react';
import { T } from '../../i18n';
import BaseComponent from './BaseComponent.js';

class Loading extends BaseComponent {
  render() {
    return (
      <img src="/logo-todos.svg" className="loading-app" alt={T('components.loading.loading')} />
    );
  }
}

export default Loading;
