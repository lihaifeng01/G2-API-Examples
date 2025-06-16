package com.netease.nertc.aicapacity;

import android.text.TextUtils;
import android.util.Log;

import com.netease.yunxin.lite.util.http.HttpStack;
import com.netease.yunxin.lite.util.http.HttpStackResponse;

import org.json.JSONObject;

public class DemoTokenService {

    private static final String TAG = "DemoTokenService";

    public interface DemoTokenCallback {
        void onToken(String token);
    }
    private final String mUrl;
    private final String mAppKey;

    public DemoTokenService(String url, String appKey) {
        mUrl = url;
        mAppKey = appKey;
    }

    //在线上环境中，token的获取需要放到您的应用服务端完成，然后由服务器通过安全通道把token传递给客户端
    //Demo中使用的URL仅仅是demoserver，不要在您的应用中使用
    //详细请参考: http://dev.netease.im/docs?doc=server
    public void getDemoToken(String uid, DemoTokenCallback callback) {
        new Thread(() -> {
            try {
                String queryString = mUrl + "?uid=" + uid + "&appkey=" + mAppKey;
                HttpStackResponse response = HttpStack.doPost(queryString,null,null,5000);
                Log.i(TAG, "getDemoToken: " + queryString + " , res: " + response);
                if (response == null || response.code != 200 || TextUtils.isEmpty(new String(response.result))) {
                    callback.onToken(null);
                    return;
                }
                JSONObject object = new JSONObject(new String(response.result));
                int code = object.getInt("code");
                String token = object.getString("checksum");
                if (code != 200 || TextUtils.isEmpty(token)) {
                    callback.onToken(null);
                    return;
                }
                callback.onToken(token);
            } catch (Exception e) {
                e.printStackTrace();
                callback.onToken(null);
            }

        }).start();
    }

    public void getDemoPermToken(String uid, DemoTokenCallback callback) {
        new Thread(() -> {
            try {
                String queryString = mUrl + "?uid=" + uid + "&appkey=da21cc6d30e7b83ec2cf55e3e0237492";
                HttpStackResponse response = HttpStack.doPost(queryString);
                String result = new String(response.result);
                if (response == null || response.code != 200 || TextUtils.isEmpty(result)) {
                    callback.onToken(null);
                    return;
                }
                JSONObject object = new JSONObject(result);
                int code = object.getInt("code");
                String token = object.getString("checksum");
                if (code != 200 || TextUtils.isEmpty(token)) {
                    callback.onToken(null);
                    return;
                }
                callback.onToken(token);
            } catch (Exception e) {
                e.printStackTrace();
                callback.onToken(null);
            }

        }).start();
    }

}
