import { Form } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.module.less';
import LoginItem from './LoginItem';
import LoginSubmit from './LoginSubmit';
import LoginTab from './LoginTab';

function Login({
  className = '', onSubmit = () => {
  }, activeFields = [], children,
}) {
  const [form] = Form.useForm();

  const handleSubmit = async values => {
    let err;
    await form.validateFields(activeFields, { force: true }).catch(e => {
      err = e;
    });

    onSubmit(err, values);
  };

  return (
    <div className={classNames(className, styles.login)}>
      <Form form={form} onFinish={handleSubmit}>
        {[...children]}
      </Form>
    </div>
  );
}

Login.Tab = LoginTab;
Login.Submit = LoginSubmit;
Object.keys(LoginItem).forEach(item => {
  Login[item] = LoginItem[item];
});

export default Login;
