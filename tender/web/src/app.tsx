import { matchRoutes } from 'umi';

// @ts-ignore
export function onRouteChange({ clientRoutes, location }) {
  const base = '/webdemo/tender'; // 与 .umirc.ts 中的 base 保持一致
  const pathname = location.pathname.startsWith(base)
    ? location.pathname.slice(base.length)
    : location.pathname;

  const route = matchRoutes(clientRoutes, pathname)?.pop()?.route;

  if (route) {
    document.title = route.title || '';
  }
}
