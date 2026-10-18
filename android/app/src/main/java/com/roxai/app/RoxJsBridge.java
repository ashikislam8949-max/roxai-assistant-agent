package com.roxai.app;

import android.webkit.JavascriptInterface;

/**
 * Page bridge for https://roxaii.com. The site calls {@code RoxNative.*}
 * and can listen for {@code rox-voice}, {@code rox-share-in}, and {@code rox-push-token}.
 */
public class RoxJsBridge {
    private final MainActivity activity;

    RoxJsBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void share(String text) {
        activity.runOnUiThread(() -> activity.shareText(text));
    }

    @JavascriptInterface
    public void startVoice() {
        activity.runOnUiThread(activity::startVoice);
    }

    @JavascriptInterface
    public void stopVoice() {
        activity.runOnUiThread(activity::stopVoice);
    }

    @JavascriptInterface
    public String getPushToken() {
        return RoxFirebase.getToken();
    }

    @JavascriptInterface
    public String takeSharedText() {
        return activity.takeSharedText();
    }
}
