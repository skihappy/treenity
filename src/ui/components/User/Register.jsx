/**
 * Created by kriz on 27/11/2018.
 */

import { Trans } from '@lingui/macro';
import { Alert, Card, Layout } from 'antd';
import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { T } from '../../../i18n';
import { promisify } from '../../../utils/promisify';

import Login from '../Login/index';

const { Tab, UserName, Password, Mobile, Captcha, Submit } = Login;

const createUser = promisify(Accounts.createUser, Meteor, 1);

const doRegister = (email, password, profile) =>
  createUser({ email, password, profile }).catch(err => {
    err.code = err.reason.replace(' ', '_').toLowerCase();
    throw err;
  });

const Register = ({ loginUrl, regUrl }) => {
  const [notice, setNotice] = useState(null);

  const navigate = regUrl && useNavigate();
  const onSubmit = async (err, values) => {
    setNotice('');
    try {
      await doRegister(values.email, values.password);
      regUrl && navigate(regUrl);
    } catch (err) {
      setNotice(T(`register.${err.error}`));
      console.log(err);
    }
  };
  const onTabChange = () => {
  };

  return (
    <Login
      // defaultActiveKey={this.state.type}
      onTabChange={onTabChange}
      onSubmit={onSubmit}
      activeFields={['email', 'password', 'passwordAgain']}
    >
      {/*<Tab key="tab1" tab="Account">*/}
      {
        <div>
          {notice && (
            <Alert style={{ marginBottom: 24 }} message={notice} type="error" showIcon closable />
          )}
        </div>
      }
      <UserName name="email" />
      <Password name="password" />
      <Password name="passwordAgain" />
      {/*</Tab>*/}
      <Submit>
        <Trans id="signup" />
      </Submit>
      {loginUrl && (
        <div>
          <Link style={{ float: 'right' }} to={loginUrl}>
            <Trans id="login" />
          </Link>
        </div>
      )}
    </Login>
  );
};

export default props => (
  <Layout style={{ height: '100%' }}>
    <Card style={{ width: 400, margin: 'auto', marginTop: 100 }}>
      <Register {...props} />
    </Card>
  </Layout>
);
