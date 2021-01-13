import { Routes, Route, BrowserRouter, useParams } from 'react-router-dom';
import React from 'react';
import { App } from './App';
import Craft from './craft/Craft';
import { useServiceFind } from './utils/useServiceFind';
import NodeLayoutPage from '../ui/pages/NodeLayoutPage.jsx';

// const NodeLayoutPage = ({}) => {
//   const { rootId = 'root', _id = 'root' } = useParams();
//   const nodes = useServiceFind('node-page', {});
//
//   const rootId = nodes.find((n) => n._id === _id);
// };
const TreePage = ({ value, node }) => {
};

export default () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/:id" element={<NodeLayoutPage defaultLayout={TreePage} />} />
        <Route path=":rootId/:id" element={<NodeLayoutPage defaultLayout={TreePage} />} />
        <Route path="/craft" element={<Craft />} />
      </Routes>
    </BrowserRouter>
  );
};
