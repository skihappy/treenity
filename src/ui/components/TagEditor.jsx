/**
 * Created by kriz on 17/04/2018.
 */

import React from 'react';

import { PlusOutlined } from '@ant-design/icons';

import { Tag, Input, Tooltip } from 'antd';

export default class EditableTagGroup extends React.Component {
  state = {
    tags: this.props.initialValue || [],
    prevTags: [],
    inputVisible: false,
    inputValue: '',
  };

  onChange = tags => this.props.onChange && this.props.onChange(tags);

  static getDerivedStateFromProps(props, currentState) {
    if (props.initialValue !== currentState.prevTags) {
      return {
        tags: props.initialValue,
        prevTags: props.initialValue,
      };
    }
    return null;
  }

  handleClose = removedTag => {
    const tags = this.state.tags.filter(tag => tag !== removedTag);
    this.setState({ tags });
    this.onChange(tags);
  };

  showInput = () => {
    this.setState({ inputVisible: true }, () => this.input.focus());
  };

  handleInputChange = e => {
    this.setState({ inputValue: e.target.value });
  };

  handleInputConfirm = () => {
    const state = this.state;
    const inputValue = state.inputValue;
    let tags = state.tags;
    if (inputValue && tags.indexOf(inputValue) === -1) {
      tags = [...tags, inputValue];
    }
    this.setState({
      tags,
      inputVisible: false,
      inputValue: '',
    });

    this.onChange(tags);
  };

  saveInputRef = input => (this.input = input);

  render() {
    const { className = '', forwardRef } = this.props;
    const { tags, inputVisible, inputValue } = this.state;
    return (
      <div className={`tag-editor ${className}`} ref={forwardRef}>
        {tags.map((tag, index) => {
          const isLongTag = tag.length > 19;
          // closable={index !== 0}
          const tagElem = (
            <Tag
              key={tag}
              color={tag.startsWith('!') ? 'red' : 'blue'}
              closable
              onClose={() => this.handleClose(tag)}
            >
              {isLongTag ? `${tag.slice(0, 17)}..` : tag}
            </Tag>
          );
          return isLongTag ? (
            <Tooltip title={tag} key={tag}>
              {tagElem}
            </Tooltip>
          ) : (
            tagElem
          );
        })}
        {inputVisible && (
          <Input
            ref={this.saveInputRef}
            type="text"
            size="small"
            style={{ width: 64 }}
            value={inputValue}
            onChange={this.handleInputChange}
            onBlur={this.handleInputConfirm}
            onPressEnter={this.handleInputConfirm}
          />
        )}
        {!inputVisible && (
          <Tag onClick={this.showInput} style={{ background: '#fff', borderStyle: 'dashed' }}>
            <PlusOutlined /> Tag
          </Tag>
        )}
      </div>
    );
  }
}
