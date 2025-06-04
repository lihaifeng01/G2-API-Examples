# 生成云信 RTC 鉴权的 token

* 基础 token：https://doc.yunxin.163.com/nertc/server-apis/TcxNDAxMTI?platform=server
* 高级 token：https://doc.yunxin.163.com/nertc/server-apis/DU3Mjk0MzQ?platform=server

## 代码目录

* 本目录下是一个完整的 C++ 项目。`./src/token_builder.h`  文件包含了基础token、高级 token 的完整代码

## 使用示例

```cpp

// 建议项目初始化时候创建对象， 通过单例全局维护一个 TokenServer 对象
// appKey、appSecret 请替换成自己的，具体在云信管理后台查看。
// 7200 代表默认有效的时间，单位秒。不能超过 86400，即 24 小时
TokenServer tokenServer(appKey, appSecret, 7200);

// 在需要的时候，提供 channelName（房间名）、uid（用户标识）、ttlSec（有效时间，单位秒） 参数，生成 token
string token = tokenServer.getBasicToken(channelName, uid, ttlSec);


// 高级 token 具体权限说明见函数注释
uint8_t privilege = (uint8_t) (1);
long ttlSec = 1000;
// permSecret 见云信管理后台，具体见文档说明：https://doc.yunxin.163.com/nertc/server-apis/DU3Mjk0MzQ?platform=server
string permissionToken = tokenServer.getPermissionKey(channelName, permSecret, uid, privilege, ttlSec);
```

## 代码引入说明

1. 复制 `./src/token_builder.h` 文件到你的项目中. 并且添加依赖的库到编译选项中 `-lssl -lcrypto -lz`
2. 生成 token 的代码中引入文件， 然后调用 `getBasicToken` 方法
3. 如果需要生成高级 token，调用 `getPermissionKey` 方法

