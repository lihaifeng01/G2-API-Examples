import { defineConfig } from 'umi';

export default defineConfig({
  base: '/',
  publicPath: '/webdemo/tender/',
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: 'home', title: '首页', wrappers: ['@/wrappers/auth'] },
    { path: '/invite', component: 'invite', title: '邀请' },
    { path: '/tender', component: 'tender', title: '在线评标', wrappers: ['@/wrappers/auth'] },
    { path: '/default', component: 'default', title: '退出' },
  ],
  plugins: ['@umijs/plugins/dist/model'],
  model: {},
  hash: true,
  history: { type: 'hash' },
  npmClient: 'npm',
  //启用https
  // https: {
  //   cert: './server.crt',
  //   key: './server.key',
  // },
});
