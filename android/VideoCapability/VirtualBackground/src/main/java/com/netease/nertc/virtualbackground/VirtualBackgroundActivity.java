package com.netease.nertc.virtualbackground;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Context;
import android.os.Bundle;
import android.text.Editable;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.Toast;
import com.netease.lava.api.IVideoRender;
import com.netease.lava.nertc.sdk.AbsNERtcCallbackEx;
import com.netease.lava.nertc.sdk.NERtc;
import com.netease.lava.nertc.sdk.NERtcConstants;
import com.netease.lava.nertc.sdk.NERtcEx;
import com.netease.lava.nertc.sdk.NERtcOption;
import com.netease.lava.nertc.sdk.NERtcParameters;
import com.netease.lava.nertc.sdk.NERtcUserJoinExtraInfo;
import com.netease.lava.nertc.sdk.NERtcUserLeaveExtraInfo;
import com.netease.lava.nertc.sdk.video.NERtcRemoteVideoStreamType;
import com.netease.lava.nertc.sdk.video.NERtcVideoStreamType;
import com.netease.lava.nertc.sdk.video.NERtcVideoView;
import com.netease.lava.nertc.sdk.video.NERtcVirtualBackgroundSource;
import com.netease.nertc.config.DemoDeploy;

import java.io.Closeable;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Random;

public class VirtualBackgroundActivity extends AppCompatActivity implements View.OnClickListener {
    private static final String TAG = "VirtualBgdActivity";
    private static final String IMG_DIR = "background";

    private ArrayList<NERtcVideoView> mRemoteVideoList;
    private Button mStartJoinBtn;
    private EditText mRoomIdView;
    private EditText mUserIdView;
    private NERtcVideoView mLocalUserVv;
    private Button mQuality1Btn;
    private Button mQuality2Btn;
    private Button mQuality3Btn;

    private ImageView mBackIv;
    private RelativeLayout mContainer;
    private boolean mJoinChannel = false;
    private boolean mEnableLocalAudio = true;
    private boolean mEnableLocalVideo = true;
    private String mRoomId;
    private long mUserId;
    private String mImgPath;
    private AbsNERtcCallbackEx callback = new AbsNERtcCallbackEx() {

        @Override
        public void onJoinChannel(int result, long channelId, long elapsed, long uid) {
            Log.i(TAG, "onJoinChannel result: " + result + " channelId: " + channelId + " elapsed: " + elapsed);
            if (result == NERtcConstants.ErrorCode.OK) {
                mJoinChannel = true;
            }
        }

        @Override
        public void onLeaveChannel(int result) {
            Log.i(TAG, "onLeaveChannel result: " + result);
            NERtc.getInstance().release();
            finish();
        }

        @Override
        public void onUserJoined(long uid) {
            Log.i(TAG, "onUserJoined userId: " + uid);
            for (int i = 0; i < mRemoteVideoList.size(); i++) {
                Log.i(TAG, "onUserJoined i: " + i);
                if (mRemoteVideoList.get(i).getTag() == null) {
                    setupRemoteVideo(uid, i);
                    mRemoteVideoList.get(i).setTag(uid);
                    break;
                }
            }
        }

        @Override
        public void onUserJoined(long uid, NERtcUserJoinExtraInfo joinExtraInfo) {

        }

        @Override
        public void onUserLeave(long uid, int reason) {
            Log.i(TAG, "onUserLeave uid: " + uid);
            NERtcVideoView userView = mContainer.findViewWithTag(uid);
            if (userView != null) {
                //设置TAG为null，代表当前没有订阅
                userView.setTag(null);
                NERtcEx.getInstance().subscribeRemoteVideoStream(uid, NERtcRemoteVideoStreamType.kNERtcRemoteVideoStreamTypeHigh, false);
                //不展示远端
                userView.setVisibility(View.INVISIBLE);
            }
        }

        @Override
        public void onUserLeave(long uid, int reason, NERtcUserLeaveExtraInfo leaveExtraInfo) {

        }

        @Override
        public void onUserAudioStart(long uid) {

        }

        @Override
        public void onUserAudioStop(long uid) {

        }

        @Override
        public void onUserVideoStart(long uid, int maxProfile) {
            Log.i(TAG, "onUserVideoStart uid: " + uid + " profile: " + maxProfile);
            NERtcVideoView userView = mContainer.findViewWithTag(uid);
            NERtcEx.getInstance().subscribeRemoteVideoStream(uid, NERtcRemoteVideoStreamType.kNERtcRemoteVideoStreamTypeHigh, true);
            userView.setVisibility(View.VISIBLE);
        }

        @Override
        public void onUserVideoStart(long uid, NERtcVideoStreamType streamType, int maxProfile) {

        }

        @Override
        public void onUserVideoStop(long uid, NERtcVideoStreamType streamType) {

        }

        @Override
        public void onUserVideoStop(long uid) {
            Log.i(TAG, "onUserVideoStop, uid=" + uid);
            NERtcVideoView userView = mContainer.findViewWithTag(uid);
            if (userView != null) {
                userView.setVisibility(View.INVISIBLE);
            }
        }

        @Override
        public void onDisconnect(int reason) {

        }

        @Override
        public void onAudioEffectTimestampUpdate(long id, long timestampMs) {

        }

        @Override
        public void onError(int code) {

        }

        @Override
        public void onPermissionKeyWillExpire() {

        }

        @Override
        public void onUpdatePermissionKey(String key, int error, int timeout) {

        }

        @Override
        public void onLocalVideoWatermarkState(NERtcVideoStreamType videoStreamType, int state) {

        }
        @Override
        public void onVirtualBackgroundSourceEnabled(boolean b, int reason) {
            if (b) {
                Log.d(TAG, "虚拟背景开启成功");
            } else {
                Log.d(TAG, "虚拟背景开启失败：" + reason);
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_virtual_background);
        initView();
    }

    private void initView() {
        mRemoteVideoList = new ArrayList<>();
        mContainer = findViewById(R.id.container);
        mBackIv = findViewById(R.id.iv_back);
        mQuality1Btn = findViewById(R.id.btn_color_background);
        mQuality2Btn = findViewById(R.id.btn_img_background);
        mQuality3Btn = findViewById(R.id.btn_blur_background);


        mStartJoinBtn = findViewById(R.id.btn_join_channel);
        mRoomIdView = findViewById(R.id.et_room_id);
        mUserIdView = findViewById(R.id.et_user_id);

        mLocalUserVv = findViewById(R.id.vv_local_user);

        mRemoteVideoList.add((NERtcVideoView) findViewById(R.id.vv_remote_user_1));
        mRemoteVideoList.add((NERtcVideoView) findViewById(R.id.vv_remote_user_2));
        mRemoteVideoList.add((NERtcVideoView) findViewById(R.id.vv_remote_user_3));
        mRemoteVideoList.add((NERtcVideoView) findViewById(R.id.vv_remote_user_4));
        mUserId = new Random().nextInt(100000);
        mUserIdView.setText(String.valueOf(mUserId));


        mStartJoinBtn.setOnClickListener(this);
        mBackIv.setOnClickListener(this);
        mQuality1Btn.setOnClickListener(this);
        mQuality2Btn.setOnClickListener(this);
        mQuality3Btn.setOnClickListener(this);

        String root = ensureImageDirectory();
        mImgPath = extractMusicFile(root, "background.jpeg");

    }

    private String ensureImageDirectory() {
        File dir = getExternalFilesDir(IMG_DIR);
        if (dir == null) {
            dir = getDir(IMG_DIR, 0);
        }
        if (dir != null) {
            dir.mkdirs();
            return dir.getAbsolutePath();
        }
        return "";
    }

    private String extractMusicFile(String path, String name) {
        copyAssetToFile(this, IMG_DIR + "/" + name, path, name);
        return new File(path, name).getAbsolutePath();
    }

    private void copyAssetToFile(Context context, String assetsName,
                                 String savePath, String saveName) {

        File dir = new File(savePath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        File destFile = new File(dir, saveName);
        InputStream inputStream = null;
        FileOutputStream outputStream = null;
        try {
            inputStream = context.getResources().getAssets().open(assetsName);
            if (destFile.exists() && inputStream.available() == destFile.length()) {
                return;
            }
            destFile.deleteOnExit();
            outputStream = new FileOutputStream(destFile);
            byte[] buffer = new byte[4096];
            int count;
            while ((count = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, count);
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            closeQuiet(inputStream);
            closeQuiet(outputStream);
        }
    }
    private void closeQuiet(Closeable closeable) {
        if (closeable == null) {
            return;
        }

        try {
            closeable.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    /**
     * 设置本地音频可用性
     *
     * @param enable
     */
    private void setLocalAudioEnable(boolean enable) {
        mEnableLocalAudio = enable;
        NERtcEx.getInstance().enableLocalAudio(mEnableLocalAudio);
    }

    /**
     * 设置本地视频的可用性
     */
    private void setLocalVideoEnable(boolean enable) {
        mEnableLocalVideo = enable;
        NERtcEx.getInstance().enableLocalVideo(mEnableLocalVideo);
        mLocalUserVv.setVisibility(enable ? View.VISIBLE : View.INVISIBLE);
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        exit();
    }

    /**
     * 退出房间并关闭页面
     */
    private void exit() {
        if (mJoinChannel) {
            leaveChannel();
        }
        finish();
    }

    private boolean leaveChannel() {

        mJoinChannel = false;
        setLocalAudioEnable(false);
        setLocalVideoEnable(false);
        int ret = NERtcEx.getInstance().leaveChannel();
        return ret == NERtcConstants.ErrorCode.OK;
    }

    private void userInfo() {
        Editable roomIdEdit = mRoomIdView.getText();
        if (roomIdEdit == null || roomIdEdit.length() <= 0) {
            return;
        }
        Editable userIdEdit = mUserIdView.getText();
        if (userIdEdit == null || userIdEdit.length() <= 0) {
            return;
        }
        mRoomId = roomIdEdit.toString();
        mUserId = Long.parseLong(userIdEdit.toString());
    }

    private void setupNERtc() {
        NERtcParameters parameters = new NERtcParameters();
        NERtcEx.getInstance().setParameters(parameters); //先设置参数，后初始化

        NERtcOption options = new NERtcOption();

        if (BuildConfig.DEBUG) {
            options.logLevel = NERtcConstants.LogLevel.INFO;
        } else {
            options.logLevel = NERtcConstants.LogLevel.WARNING;
        }

        try {
            NERtcEx.getInstance().init(getApplicationContext(), DemoDeploy.APP_KEY, callback, options);
        } catch (Exception e) {
            // 可能由于没有release导致初始化失败，release后再试一次
            NERtcEx.getInstance().release();
            try {
                NERtcEx.getInstance().init(getApplicationContext(), DemoDeploy.APP_KEY, callback, options);
            } catch (Exception ex) {
                Toast.makeText(this, "SDK初始化失败", Toast.LENGTH_LONG).show();
                finish();
                return;
            }
        }
        setLocalAudioEnable(true);
        setLocalVideoEnable(true);
    }

    private void setuplocalVideo() {
        mLocalUserVv.setZOrderMediaOverlay(false);
        mLocalUserVv.setScalingType(IVideoRender.ScalingType.SCALE_ASPECT_FIT);
        NERtcEx.getInstance().setupLocalVideoCanvas(mLocalUserVv);
    }

    private void setupRemoteVideo(long userId, int index) {
        mRemoteVideoList.get(index).setZOrderMediaOverlay(true);
        mRemoteVideoList.get(index).setScalingType(IVideoRender.ScalingType.SCALE_ASPECT_FIT);
        NERtc.getInstance().setupRemoteVideoCanvas(mRemoteVideoList.get(index), userId);
    }

    private void joinChannel(String roomId, long userId) {
        NERtcEx.getInstance().joinChannel("", roomId, userId);
    }

    private void startPushStream() {
        userInfo();
        setupNERtc();
        setuplocalVideo();
        joinChannel(mRoomId, mUserId);
    }

    private void enableVirtualBgd(Boolean flag, int backgroundSourceType) {
        if (backgroundSourceType == NERtcVirtualBackgroundSource.BACKGROUND_COLOR) {
            NERtcVirtualBackgroundSource source = new NERtcVirtualBackgroundSource(backgroundSourceType, 0xFFB6C1, null, 0);
            NERtcEx.getInstance().enableVirtualBackground(flag, source);
        } else if (backgroundSourceType == NERtcVirtualBackgroundSource.BACKGROUND_IMG) {
            NERtcVirtualBackgroundSource source = new NERtcVirtualBackgroundSource(backgroundSourceType, 0, mImgPath, 0);
            NERtcEx.getInstance().enableVirtualBackground(flag, source);
        } else if (backgroundSourceType == NERtcVirtualBackgroundSource.BACKGROUND_BLUR) {
            NERtcVirtualBackgroundSource source = new NERtcVirtualBackgroundSource(backgroundSourceType, 0, null, NERtcVirtualBackgroundSource.BLUR_DEGREE_MEDIUM);
            NERtcEx.getInstance().enableVirtualBackground(flag, source);
        }
    }

    @Override
    public void onClick(View view) {
        int id = view.getId();
        if (id == R.id.iv_back) {
            exit();
        } else if (id == R.id.btn_join_channel) {
            startPushStream();
        } else if (id == R.id.btn_color_background) {
            if (mJoinChannel) {
                enableVirtualBgd(true, NERtcVirtualBackgroundSource.BACKGROUND_COLOR);
            }
            mQuality1Btn.setBackgroundColor(getResources().getColor(R.color.base_blue));
            mQuality2Btn.setBackgroundColor(getResources().getColor(R.color.button_select_off));
            mQuality3Btn.setBackgroundColor(getResources().getColor(R.color.button_select_off));
        } else if (id == R.id.btn_img_background) {
            if (mJoinChannel) {
                enableVirtualBgd(true, NERtcVirtualBackgroundSource.BACKGROUND_IMG);
            }
            mQuality1Btn.setBackgroundColor(getResources().getColor(R.color.button_select_off));
            mQuality2Btn.setBackgroundColor(getResources().getColor(R.color.base_blue));
            mQuality3Btn.setBackgroundColor(getResources().getColor(R.color.button_select_off));
        } else if (id == R.id.btn_blur_background) {
            if (mJoinChannel) {
                enableVirtualBgd(true, NERtcVirtualBackgroundSource.BACKGROUND_BLUR);
            }
            mQuality1Btn.setBackgroundColor(getResources().getColor(R.color.button_select_off));
            mQuality2Btn.setBackgroundColor(getResources().getColor(R.color.button_select_off));
            mQuality3Btn.setBackgroundColor(getResources().getColor(R.color.base_blue));
        }
    }
}