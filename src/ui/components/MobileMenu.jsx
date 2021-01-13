import React from 'react';
import BaseComponent from './BaseComponent.js';

class MobileMenu extends BaseComponent {
  constructor(props) {
    super(props);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.status = { menuCollapsed: false };
  }

  toggleMenu() {
    this.setState(s => ({ menuCollapsed: !s.menuCollapsed }));
  }

  render() {
    return (
      <div className="nav-group">
        <a href="#toggle-menu" className="nav-item" onClick={this.toggleMenu}>
          <span className="icon-list-unordered" title={'components.mobileMenu.showMenu'} />
        </a>
      </div>
    );
  }
}

export default MobileMenu;
