/**
 * Created by kriz on 27/11/2018.
 */

import { t, Trans } from '@lingui/macro';
import { Alert, Card, Layout } from 'antd';
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { T } from '../../../i18n';
import { useLogin } from '../../utils/useLogin';

import Login from '../Login/index';
import PageLoading from '../PageLoading/index';

const { UserName, Password, Submit } = Login;

class LoginComponent extends React.Component {
  state = {
    notice: '',
    type: 'tab1',
    autoLogin: true,
  };
  onSubmit = (err, values) => {
    console.log('value collected ->', { ...values, autoLogin: this.state.autoLogin });
    this.setState(
      {
        notice: '',
      },
      () =>
        this.props.doLogin(values.email, values.password).catch(err =>
          this.setState({
            notice: T(t`auth.${err.error}`),
          }),
        ),
    );
  };
  onTabChange = key => {
    this.setState({
      type: key,
    });
  };

  render() {
    const { regUrl } = this.props;

    return (
      <Login
        defaultActiveKey={this.state.type}
        onTabChange={this.onTabChange}
        onSubmit={this.onSubmit}
        activeFields={['email', 'password']}
      >
        {/*<Tab key="tab1" tab="Account">*/}
        {
          <div>
            {this.state.notice && (
              <Alert
                style={{ marginBottom: 24 }}
                message={this.state.notice}
                type="error"
                showIcon
                closable
              />
            )}
          </div>
        }
        <UserName name="email" />
        <Password name="password" />
        {/*</Tab>*/}
        {/*<div>*/}
        {/*<Checkbox checked={this.state.autoLogin} onChange={this.changeAutoLogin}>Keep me logged in</Checkbox>*/}
        {/*<a style={{ float: 'right' }} href="">Forgot password</a>*/}
        {/*</div>*/}
        <Submit>
          <Trans id="login">Login</Trans>
        </Submit>
        {regUrl && (
          <div>
            <Link style={{ float: 'right' }} to={regUrl}>
              <Trans id="signup">Sign Up</Trans>
            </Link>
          </div>
        )}
      </Login>
    );
  }
}

export const LoginPage = props => {
  return (
    <Layout style={{ height: '100%' }}>
      <Card style={{ width: 400, margin: 'auto', marginTop: 100 }}>
        <LoginComponent {...props} />
      </Card>
    </Layout>
  );
};

const LoginLoadingComponent = props => {
  const login = useLogin();

  if (login.loggedIn) return <Navigate to="/" replace />;
  if (login.loggingIn) return <PageLoading />;

  return <LoginPage {...props} {...login} />;
};

export default LoginLoadingComponent;
