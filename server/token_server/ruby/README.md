# 生成云信 RTC 鉴权的 token

* 基础 token：https://doc.yunxin.163.com/nertc/server-apis/TcxNDAxMTI?platform=server
* 高级 token：https://doc.yunxin.163.com/nertc/server-apis/DU3Mjk0MzQ?platform=server


## 代码目录

* `./lib/token_server.rb`  文件包含了基础token、高级 token 的完整代码

## 使用示例

```ruby
# 建议项目初始化时候创建对象， 通过单例全局维护一个 TokenServer 对象
# appKey、appSecret 请替换成自己的，具体在云信管理后台查看。
# 7200 代表默认有效的时间，单位秒。不能超过 86400，即 24 小时
server = TokenServer.new("REPLACE_WITH_APPKEY", "REPLACE_WITH_APP_SECRET" , 7200)

# 提供 channel_name（房间名）、uid（用户标识）、ttl_sec（有效时间，单位秒，可选参数） 参数，生成 token
token = server.get_token(channel_name, uid, ttl_sec)

# 高级 token 具体权限说明见函数注释
# perm_secret 见云信管理后台，具体见文档说明：https://doc.yunxin.163.com/nertc/server-apis/DU3Mjk0MzQ?platform=server
permission_token = token_server.get_permission_key(channel_name, perm_secret, uid, privilege, ttl_sec);
```

## 代码引入说明

1. 复制 `./lib/token_server.rb` 文件到你的项目中
2. 项目初始化时候调用 TokenServer.new 构造对象，生成基础 token 调用 `get_token` 方法
3. 如果需要生成高级 token，调用 `get_permission_key` 方法

