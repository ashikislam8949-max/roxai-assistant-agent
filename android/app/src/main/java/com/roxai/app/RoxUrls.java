package com.roxai.app;

import android.net.Uri;

final class RoxUrls {
    static final String START = "https://roxaii.com/";

    private RoxUrls() {}

    static boolean isAppUrl(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) {
            return false;
        }
        String host = uri.getHost();
        return "roxaii.com".equalsIgnoreCase(host) || "www.roxaii.com".equalsIgnoreCase(host);
    }

    static boolean isAppUrl(String url) {
        return url != null && isAppUrl(Uri.parse(url));
    }
}
