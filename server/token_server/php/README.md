# 生成云信 RTC 鉴权的 token

* 基础 token：https://doc.yunxin.163.com/nertc/server-apis/TcxNDAxMTI?platform=server
* 高级 token：https://doc.yunxin.163.com/nertc/server-apis/DU3Mjk0MzQ?platform=server


## 代码目录

* `./src/TokenServer.php`  文件包含了基础token、高级 token 的完整代码

## 使用示例

```php

// 建议项目初始化时候创建对象， 通过单例全局维护一个 TokenServer 对象
// appKey、appSecret 请替换成自己的，具体在云信管理后台查看。
// 7200 代表默认有效的时间，单位秒。不能超过 86400，即 24 小时
$tokenServer = new TokenServer($appId, $appSecret, 7200);

// 在需要的时候，提供 channelName（房间名）、uid（用户标识）、ttlSec（有效时间，单位秒） 参数，生成 token
$token = $tokenServer.getToken($channelName, $uid, $ttlSec);


// 高级 token 具体权限说明见函数注释
$privilege = 1;
$ttlSec = 1000;
// permSecret 见云信管理后台，具体见文档说明：https://doc.yunxin.163.com/nertc/server-apis/DU3Mjk0MzQ?platform=server
String permissionToken = $tokenServer.getPermissionKey(channelName, permSecret, uid, privilege, ttlSec);
```

## 代码引入说明

1. 复制 `./src/TokenServer.php` 文件到你的项目中
2. 初始化时候调用 `new TokenServer`，生成 token 时候调用 `getToken` 方法
3. 如果需要生成高级 token，调用 `getPermissionKey` 方法

