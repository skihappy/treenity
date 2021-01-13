import { Meteor } from 'meteor/meteor';
import { promisify } from '../../utils/promisify';
import useTracker from './useTracker';

const loginWithPassword = promisify(Meteor.loginWithPassword, Meteor, 2);

const doLogin = (email, password) =>
  loginWithPassword(email, password).catch(err => {
    err.code = err.reason.replace(' ', '_').toLowerCase();
    throw err;
  });

export const useLogin = () => {
  return useTracker(() => {
    const userId = Meteor.userId();
    const loggingIn = Meteor.loggingIn();
    // const sub = Meteor.subscribe('account.current');
    // if (!sub.ready()) {
    //   return {
    //     loggingIn,
    //     loggedIn: false,
    //     user: null,
    //     doLogin,
    //   };
    // }

    const user = Meteor.user();
    const loggedIn = !loggingIn && !!userId;

    return {
      //в процессе авторизации
      loggingIn,
      //если авторизован
      loggedIn,
      user,
      doLogin,
    };
  });
};
