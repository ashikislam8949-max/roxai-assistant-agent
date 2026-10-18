package com.roxai.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Shows a reply-ready notification from a server FCM message.
 * The app does not call a send API and does not embed a server key.
 */
public class RoxMessagingService extends FirebaseMessagingService {
    @Override
    public void onNewToken(String token) {
        RoxFirebase.setToken(token);
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        if (!RoxFirebase.isStarted() && !RoxFirebase.start(this)) {
            return;
        }
        String title = null;
        String body = null;
        RemoteMessage.Notification notification = message.getNotification();
        if (notification != null) {
            title = notification.getTitle();
            body = notification.getBody();
        }
        if (title == null || title.isEmpty()) {
            title = message.getData().get("title");
        }
        if (body == null || body.isEmpty()) {
            body = message.getData().get("body");
        }
        if (title == null || title.isEmpty()) {
            title = getString(R.string.app_name);
        }
        if (body == null || body.isEmpty()) {
            body = getString(R.string.reply_ready);
        }
        show(title, body, message.getData().get("url"));
    }

    private void show(String title, String body, String url) {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (RoxUrls.isAppUrl(url)) {
            open.setAction(Intent.ACTION_VIEW);
            open.setData(Uri.parse(url));
        }
        PendingIntent pending = PendingIntent.getActivity(
                this,
                0,
                open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, RoxFirebase.CHANNEL_ID)
                : new Notification.Builder(this);
        if (Build.VERSION.SDK_INT < 26) {
            builder.setPriority(Notification.PRIORITY_DEFAULT);
        }
        builder.setSmallIcon(R.drawable.ic_stat_rox)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setContentIntent(pending)
                .setColor(0xFF84E0B7);
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) {
            return;
        }
        try {
            manager.notify((int) (System.currentTimeMillis() & 0x7fffffff), builder.build());
        } catch (SecurityException ignored) {
            // POST_NOTIFICATIONS was not granted.
        }
    }
}
