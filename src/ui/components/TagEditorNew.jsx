/**
 * Created by kriz on 17/04/2018.
 */

import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip } from 'antd';
import React, { useLayoutEffect, useRef } from 'react';

import { useBoolean } from '../utils/useBoolean';
import { useInputState } from '../utils/useInputState';

export default function TagField({ value, onChange }) {
  if (!value) value = [];

  const [inputVisible, toggleInputVisible] = useBoolean(false);
  const [inputValue, setInputValue] = useInputState('');
  const inputRef = useRef(null);

  const handleClose = removedTag => {
    const newValue = value.filter(tag => tag !== removedTag);
    onChange(newValue);
  };

  useLayoutEffect(() => {
    inputVisible && inputRef.current.focus();
  }, [inputVisible]);

  const handleInputConfirm = () => {
    if (inputValue && value.indexOf(inputValue) === -1) {
      onChange([...value, inputValue]);
    }
    toggleInputVisible(false);
    setInputValue('');
  };

  return (
    <div className="tag-editor">
      {value.map((tag, index) => {
        const isLongTag = tag.length > 20;
        const tagElem = (
          <Tag key={tag} closable onClose={() => handleClose(tag)}>
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
      {inputVisible ? (
        <Input
          ref={inputRef}
          type="text"
          size="small"
          style={{ width: 64 }}
          value={inputValue}
          onChange={setInputValue}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
      ) : (
        <Tag onClick={toggleInputVisible} style={{ background: '#fff', borderStyle: 'dashed' }}>
          <PlusOutlined /> Tag
        </Tag>
      )}
    </div>
  );
}
