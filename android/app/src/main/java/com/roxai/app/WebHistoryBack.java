package com.roxai.app;

import android.app.Activity;
import android.webkit.WebView;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

import java.util.WeakHashMap;

/**
 * Predictive back for targetSdk 36. {@code onBackPressed} is not called on
 * Android 16 when the app targets API 36, so WebView history has to use the
 * platform callback. The callback is registered only while there is history,
 * so the system can still play the back-to-home animation.
 */
final class WebHistoryBack {
    private static final WeakHashMap<Activity, OnBackInvokedCallback> CALLBACKS = new WeakHashMap<>();

    private WebHistoryBack() {}

    static void sync(Activity activity, WebView webView) {
        boolean canGoBack = webView != null && webView.canGoBack();
        OnBackInvokedDispatcher dispatcher = activity.getOnBackInvokedDispatcher();
        OnBackInvokedCallback current = CALLBACKS.get(activity);
        if (canGoBack && current == null) {
            OnBackInvokedCallback callback = () -> {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                }
                sync(activity, webView);
            };
            dispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, callback);
            CALLBACKS.put(activity, callback);
        } else if (!canGoBack && current != null) {
            dispatcher.unregisterOnBackInvokedCallback(current);
            CALLBACKS.remove(activity);
        }
    }

    static void clear(Activity activity) {
        OnBackInvokedCallback current = CALLBACKS.remove(activity);
        if (current != null) {
            activity.getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(current);
        }
    }
}
