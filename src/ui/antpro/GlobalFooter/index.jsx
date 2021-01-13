import React from 'react';
import classNames from 'classnames';
import './index.less';

export default ({ className, links, copyright }) => {
  const clsString = classNames('globalFooter', className);
  return (
    <div className={clsString}>
      {links && (
        <div className={'links'}>
          {links.map(link => (
            <a key={link.key} target={link.blankTarget ? '_blank' : '_self'} href={link.href}>
              {link.title}
            </a>
          ))}
        </div>
      )}
      {copyright && <div className={'copyright'}>{copyright}</div>}
    </div>
  );
};
