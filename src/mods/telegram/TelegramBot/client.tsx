import React from 'react';

export default ({ addComponent }) => {
  const TelegramComponent = ({ value }) => {
    return <span>Hello telegram</span>;
  };

  addComponent('react', {}, TelegramComponent);
}
