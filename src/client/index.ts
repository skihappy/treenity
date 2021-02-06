import * as ReactDOM from 'react-dom';
import * as React from 'react';

import './index.less';

import '../common/index';
import routes from './routes';
import './feathers';
import './tree';
import '../treenity/react';
import '../treenity/service/Sysinit.meta';
import '../mods/client';
import './components';

import config from '../config-common';

config.isClient = true;

ReactDOM.render(React.createElement(routes), document.getElementById('app'));
