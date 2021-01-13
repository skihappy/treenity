// get id from array iterator
import { Button, Col, Row } from 'antd';
import React from 'react';
import { RenderMeta } from '../../tree/ui/render-meta';
import { immer } from '../../utils/immer';
import { useArrayCallback } from '../utils/useArrayCallback';

const getI = (elem, i) => i;
export const ArrayEditor = ({
  value,
  valueType,
  onChange,
  keyFunc = getI,
  context,
  extra = {},
  node = extra.node,
}) => {
  const remove = useArrayCallback(idx => {
    onChange(
      immer({ value }, draft => {
        draft.value.splice(idx, 1);
      }).value,
    );
  });
  const change = useArrayCallback((idx, data) => {
    onChange(
      immer({ value }, draft => {
        draft.value[idx] =
          typeof data === 'object' && data.currentTarget ? data.currentTarget.value : data;
      }).value,
    );
  });
  const add = () =>
    onChange(
      immer({ value }, draft => {
        draft.value.push(new valueType());
      }).value,
    );

  return (
    <div>
      {value.map((v, i) => (
        <Row key={keyFunc(v, i)}>
          <Col span={23}>
            <RenderMeta
              value={v}
              onChange={change(i)}
              node={node}
              type={valueType}
              context={context}
            />
          </Col>
          <Col span={1}>
            <Button type="link" onClick={remove(i)}>
              -
            </Button>
          </Col>
        </Row>
      ))}
      <Row>
        <Col span={24}>
          <Button type="link" onClick={add}>
            +
          </Button>
        </Col>
      </Row>
    </div>
  );
};
