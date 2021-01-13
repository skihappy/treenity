import React, { Component } from 'react';
import { Input, Button, Row, Col, Form } from 'antd';
import omit from 'omit.js';
import styles from './index.module.less';
import ItemMap from './map';
import LoginContext from './loginContext';

const FormItem = Form.Item;

class WrapFormItem extends Component {
  static defaultProps = {
    buttonText: '获取验证码',
  };

  constructor(props) {
    super(props);
  }

  getFormItemOptions = ({ onChange, defaultValue, customprops, rules }) => {
    const options = {
      rules: rules || customprops.rules,
    };
    if (onChange) {
      options.onChange = onChange;
    }
    if (defaultValue) {
      options.initialValue = defaultValue;
    }
    return options;
  };

  render() {
    const {
      onChange,
      customprops,
      defaultValue,
      rules,
      name,
      buttonText,
      type,
      ...restProps
    } = this.props;

    // get getFieldDecorator props
    const options = this.getFormItemOptions(this.props);

    const otherProps = restProps || {};
    return (
      <FormItem name={name} {...options}>
        <Input {...customprops} {...otherProps} />
      </FormItem>
    );
  }
}

const LoginItem = {};
Object.keys(ItemMap).forEach(key => {
  const item = ItemMap[key];
  LoginItem[key] = props => (
    <WrapFormItem customprops={item.props} rules={item.rules} {...props} type={key} />
  );
});

export default LoginItem;
