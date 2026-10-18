package com.roxai.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;

/**
 * Starts Firebase only when the google-services plugin generated an app id.
 * Builds without {@code google-services.json} leave notifications off.
 */
final class RoxFirebase {
    static final String CHANNEL_ID = "replies";

    private static volatile boolean started;
    private static volatile String token = "";
    private static volatile TokenListener tokenListener;

    private RoxFirebase() {}

    interface TokenListener {
        void onToken(String token);
    }

    static boolean start(Context context) {
        if (started) {
            return true;
        }
        int appId = context.getResources().getIdentifier("google_app_id", "string", context.getPackageName());
        if (appId == 0) {
            return false;
        }
        if (FirebaseApp.getApps(context).isEmpty()) {
            FirebaseApp.initializeApp(context);
        }
        createChannel(context.getApplicationContext());
        started = true;
        FirebaseMessaging.getInstance().getToken().addOnSuccessListener(RoxFirebase::setToken);
        return true;
    }

    static boolean isStarted() {
        return started;
    }

    static String getToken() {
        return token == null ? "" : token;
    }

    static void setToken(String value) {
        token = value == null ? "" : value;
        TokenListener listener = tokenListener;
        if (listener != null && !token.isEmpty()) {
            listener.onToken(token);
        }
    }

    static void setTokenListener(TokenListener listener) {
        tokenListener = listener;
        if (listener != null && token != null && !token.isEmpty()) {
            listener.onToken(token);
        }
    }

    private static void createChannel(Context context) {
        if (Build.VERSION.SDK_INT < 26) {
            return;
        }
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                context.getString(R.string.reply_channel),
                NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription(context.getString(R.string.reply_channel_description));
        manager.createNotificationChannel(channel);
    }
}
