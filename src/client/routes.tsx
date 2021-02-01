import { BrowserRouter, Route, Routes } from 'react-router-dom';
import React from 'react';
import Craft from './craft/Craft';
import { RenderCurrent } from '../treenity/react/current-node';

export default () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RenderCurrent />} />
        <Route path="/:id" element={<RenderCurrent />} />
        <Route path="/:rootId/:id" element={<RenderCurrent />} />
        <Route path="/:rootId/:id/:context" element={<RenderCurrent />} />

        <Route path="/craft" element={<Craft />} />
      </Routes>
    </BrowserRouter>
  );
};
