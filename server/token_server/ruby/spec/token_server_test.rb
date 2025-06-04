require 'minitest/autorun'
require 'time'
require_relative '../lib/token_server'

class TokenServerTest < Minitest::Test
  def test_initialize
    # raise error on empty app_key or app_secret
    assert_raises(ArgumentError) do
      TokenServer.new("", "secret", 3600)
    end
    
    assert_raises(ArgumentError) do
      TokenServer.new("key", "", 3600)
    end
    
    # raise error on negative default_ttl_sec
    assert_raises(ArgumentError) do
      TokenServer.new("key", "secret", -1)
    end
    
    # normal case
    assert_silent do
      TokenServer.new("key", "secret", 3600)
    end
  end
  
  def test_get_token
    token_server = TokenServer.new("c37bf7a8758a4ed00000000000000000", "c00000000000", 3600)
    
    # fix time
    fixed_time = Time.at(1693968975)
    Time.stub :now, fixed_time do
      # normal case
      token = token_server.get_token("room1", 10000, 1800)
      expected_token = "eyJzaWduYXR1cmUiOiJlZjRmNGEwOGM1NmZiOWI5MDQ3OTE2YjZlYmZhZGY5NWFjZDc2OGViIiwiY3VyVGltZSI6MTY5Mzk2ODk3NTAwMCwidHRsIjoxODAwfQ=="
      assert_equal expected_token, token
      
      # use default ttl
      token = token_server.get_token("room1", 10000, -1)
      expected_token = "eyJzaWduYXR1cmUiOiJkMjZmYzFlZjk4ZWExNmM3YTkzOWFmMDZmOGE4MTk2MTJkY2QzZDU5IiwiY3VyVGltZSI6MTY5Mzk2ODk3NTAwMCwidHRsIjozNjAwfQ=="
      assert_equal expected_token, token
    end
  end
  
  def test_get_permission_key
    token_server = TokenServer.new("c37bf7a8758a4ed00000000000000000", "c00000000000", 3600)
    
    # fix time
    fixed_time = Time.at(1696662104)
    Time.stub :now, fixed_time do
      # normal case
      perm_key = token_server.get_permission_key(
        "room1", 
        "45eaeb3c2757c57c1b8e0a25a1f246a476c36ca5ba0cd20da38a154c2adebdab", 
        10000, 
        1, 
        1000
      )
      expected_key = "eJxdjcEKgkAYhN-lP3vQ1F0LulQQgRCBlHlb1z-dbNt1Y0WL3j2XOjW3*WaGeQHTusURFsBDWl4oS2icsAgr-1-gAW*Qtw8rp3YfXYdzso6fharSUapVR7ddybNyU1tMm2O*O*0Pecjagi-d8s4kTjOjlAyctyYTjgRkTgiZBX7kAQ5aGPzx6dEDbUQvblg74IEV1Tfw3x-fBDcB"
      assert_equal expected_key, perm_key
    end
  end
  
  module TimeStubExtension
    def stub(method_name, value)
      original_method = method(method_name)
      define_singleton_method(method_name) { value }
      yield
    ensure
      define_singleton_method(method_name, original_method)
    end
  end
  
  Time.extend TimeStubExtension
end