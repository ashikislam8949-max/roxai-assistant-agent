package com.roxai.app;

import android.app.Application;

public class RoxApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        RoxFirebase.start(this);
    }
}
