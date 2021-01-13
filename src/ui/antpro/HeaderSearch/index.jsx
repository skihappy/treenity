import React, { PureComponent } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { AutoComplete, Input } from 'antd';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './index.less';

export default class HeaderSearch extends PureComponent {
  static defaultProps = {
    defaultActiveFirstOption: false,
    // onPressEnter: () => {},
    onSearch: () => {
    },
    className: '',
    placeholder: '',
    dataSource: [],
  };
  static propTypes = {
    className: PropTypes.string,
    placeholder: PropTypes.string,
    onSearch: PropTypes.func,
    // onPressEnter: PropTypes.func,
    defaultActiveFirstOption: PropTypes.bool,
    dataSource: PropTypes.array,
  };
  state = {
    searchMode: false,
    value: '',
  };

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  onKeyDown = e => {
    if (e.key === 'Enter') {
      this.timeout = setTimeout(() => {
        this.props.onSearch(this.state.value); // Fix duplicate onPressEnter
      }, 0);
    }
  };
  onChange = value => {
    this.setState({ value });
    if (this.props.onChange) {
      this.props.onChange();
    }
  };
  enterSearchMode = () => {
    this.setState({ searchMode: true }, () => {
      if (this.state.searchMode) {
        this.input.focus();
      }
    });
  };
  leaveSearchMode = () => {
    this.setState({
      searchMode: false,
      value: '',
    });
  };

  render() {
    const { className, placeholder, dataSource, ...restProps } = this.props;
    const inputClass = classNames('input', {
      ['show']: this.state.searchMode,
    });
    return (
      <span className={classNames(className, 'headerSearch')} onClick={this.enterSearchMode}>
        <SearchOutlined key="Icon" />
        <AutoComplete
          key="AutoComplete"
          {...restProps}
          options={dataSource}
          className={inputClass}
          value={this.state.value}
          onChange={this.onChange}
        >
          <Input
            placeholder={placeholder}
            ref={node => {
              this.input = node;
            }}
            onKeyDown={this.onKeyDown}
            onBlur={this.leaveSearchMode}
          />
        </AutoComplete>
      </span>
    );
  }
}
