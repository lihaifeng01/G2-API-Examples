export const appkey = '';
export const secret = '';
// 是否开启云端录制功能
// enableRecord为true时，使用join()方法加入频道时会自动开启录制，这时的录制文件布局为默认布局，会和招采建议布局冲突
// 如需使用招采建议布局，请将enableRecord设置为false
export const enableRecord = true;

// 私有化, privateServer为true时，使用私有化的NERTC服务，neRtcServerAddresses中的地址需要替换为私有化的服务地址
// 具体地址请联系技术支持
export const privateServer = false;
export const neRtcServerAddresses = {
  channelServer: '',
  roomServer: '',
  statisticsServer: '',
  statisticsWebSocketServer: '',
};

//wasm算法库版本需要和NERTC SDK版本保持一致
//该CDN地址仅供测试使用，正式环境请使用自己的CDN地址
export const pluginWasmUrl = {
  simd: 'https://yx-web-nosdn.netease.im/package/NIM_Web_AIAudioEffects_simd_v5.8.16.wasm',
  nosimd: 'https://yx-web-nosdn.netease.im/package/NIM_Web_AIAudioEffects_nosimd_v5.8.16.wasm',
};
