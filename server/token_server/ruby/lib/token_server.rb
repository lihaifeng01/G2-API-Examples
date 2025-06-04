require 'base64'
require 'json'
require 'digest/sha1'
require 'time'
require 'zlib'
require 'openssl'

class TokenServer
  attr_accessor :app_key, :app_secret, :default_ttl_sec

  def initialize(app_key, app_secret, default_ttl_sec)
    raise ArgumentError, "appKey or appSecret is empty" if app_key.empty? || app_secret.empty?
    raise ArgumentError, "defaultTTLSec must be positive" if default_ttl_sec <= 0

    @app_key = app_key
    @app_secret = app_secret
    @default_ttl_sec = default_ttl_sec
  end

  def get_token(channel_name, uid, ttl_sec = nil)
    ttl_sec = @default_ttl_sec if ttl_sec.nil? || ttl_sec <= 0
    cur_time = (Time.now.to_f * 1000).to_i

    sign_str = "#{@app_key}#{uid}#{cur_time}#{ttl_sec}#{channel_name}#{@app_secret}"
    signature = Digest::SHA1.hexdigest(sign_str)

    token_model = {
      signature: signature,
      curTime: cur_time,
      ttl: ttl_sec
    }

    Base64.strict_encode64(token_model.to_json)
  end

  def get_permission_key(channel_name, perm_secret, uid, privilege, ttl_sec)
    cur_time = Time.now.to_i
    get_permission_key_with_current_time(channel_name, perm_secret, uid, privilege, ttl_sec, cur_time)
  end

  private

  # 使用指定时间生成权限密钥
  def get_permission_key_with_current_time(channel_name, perm_secret, uid, privilege, ttl_sec, cur_time)
    # 计算校验和
    checksum = hmac_sha256(
      @app_key,
      uid.to_s,
      cur_time.to_s,
      ttl_sec.to_s,
      channel_name,
      perm_secret,
      privilege.to_s
    )

    # 构建权限键映射
    perm_key_map = {
      "appkey" => @app_key,
      "checksum" => checksum,
      "cname" => channel_name,
      "curTime" => cur_time,
      "expireTime" => ttl_sec,
      "privilege" => privilege,
      "uid" => uid,
    }

    json_data = perm_key_map.to_json
    compressed_data = Zlib.deflate(json_data)
    custom_base64_encode(compressed_data)
  end

  # 计算 HMAC-SHA256 签名
  def hmac_sha256(appid_str, uid_str, cur_time_str, expire_time_str, cname, perm_secret, privilege_str)
    content = [
      "appkey:#{appid_str}",
      "uid:#{uid_str}",
      "curTime:#{cur_time_str}",
      "expireTime:#{expire_time_str}",
      "cname:#{cname}",
      "privilege:#{privilege_str}",
      ""  # 最后一行换行符
    ].join("\n")

    digest = OpenSSL::HMAC.digest('sha256', perm_secret, content)
    Base64.strict_encode64(digest)
  end

  # 自定义 Base64 编码
  def custom_base64_encode(data)
    # 标准 Base64 编码
    standard_encoded = Base64.strict_encode64(data)

    # 替换字符集和填充符
    standard_encoded
      .tr('+/', '*-')   # 替换 + 为 *，/ 为 -
      .gsub('=', '_')   # 替换 = 为 _
  end
end
