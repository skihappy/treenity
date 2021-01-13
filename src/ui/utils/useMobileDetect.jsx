/**
 * Credits: https://github.com/haldarmahesh/use-mobile-detect-hook/blob/master/src/index.js
 * @param userAgent
 * @return {{isDesktop: (function(): boolean), isSSR: (function(): boolean), isMobile: (function(): boolean), isAndroid: (function(): boolean), isIos: (function(): boolean)}}
 */
const getMobileDetect = userAgent => {
  const isAndroid = () => Boolean(userAgent.match(/Android/i));
  const isIos = () => Boolean(userAgent.match(/iPhone|iPad|iPod/i));
  const isOpera = () => Boolean(userAgent.match(/Opera Mini/i));
  const isWindows = () => Boolean(userAgent.match(/IEMobile/i));
  const isSSR = () => Boolean(userAgent.match(/SSR/i));

  const isMobile = () => Boolean(isAndroid() || isIos() || isOpera() || isWindows());
  const isDesktop = () => Boolean(!isMobile() && !isSSR());
  return {
    isMobile,
    isDesktop,
    isAndroid,
    isIos,
    isSSR,
  };
};
const useMobileDetect = () => {
  const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
  return getMobileDetect(userAgent);
};

export default useMobileDetect;
