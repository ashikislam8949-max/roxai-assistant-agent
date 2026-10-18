package com.roxai.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Insets;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class MainActivity extends Activity {
    private static final int REQ_MIC = 11;
    private static final int REQ_NOTIFICATIONS = 12;
    private static final int REQ_STORAGE = 13;
    private static final int REQ_FILE = 41;

    private WebView webView;
    private View offline;
    private TextView offlineMessage;
    private Button voiceButton;
    private String pageUrl = RoxUrls.START;
    private boolean mainFrameFailed;
    private volatile String sharedText = "";
    private ValueCallback<Uri[]> fileCallback;
    private SpeechRecognizer recognizer;
    private boolean listening;
    private PendingDownload pendingDownload;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        View root = findViewById(R.id.root);
        webView = findViewById(R.id.web);
        offline = findViewById(R.id.offline);
        offlineMessage = findViewById(R.id.offline_message);
        voiceButton = findViewById(R.id.voice);
        Button retry = findViewById(R.id.retry);
        Button share = findViewById(R.id.share);

        if (Build.VERSION.SDK_INT >= 30) {
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsets.CONSUMED;
            });
            root.requestApplyInsets();
        }

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        String agent = webView.getSettings().getUserAgentString();
        webView.getSettings().setUserAgentString(agent + " RoxAIAndroid/1.0");
        webView.addJavascriptInterface(new RoxJsBridge(this), "RoxNative");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(null);
                }
                fileCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), REQ_FILE);
                } catch (ActivityNotFoundException exception) {
                    fileCallback.onReceiveValue(null);
                    fileCallback = null;
                    Toast.makeText(MainActivity.this, R.string.file_chooser_unavailable, Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });
        webView.setDownloadListener(this::onDownload);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) {
                    return true;
                }
                String host = uri.getHost();
                if ("roxaii.com".equalsIgnoreCase(host) || "www.roxaii.com".equalsIgnoreCase(host)) {
                    return false;
                }
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                mainFrameFailed = false;
                if (url != null) {
                    pageUrl = url;
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (!mainFrameFailed) {
                    hideOffline();
                }
                if (Build.VERSION.SDK_INT >= 33) {
                    WebHistoryBack.sync(MainActivity.this, webView);
                }
                deliverSharedText();
                deliverPushToken(RoxFirebase.getToken());
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    mainFrameFailed = true;
                    CharSequence description = error == null ? null : error.getDescription();
                    String message = description == null || description.length() == 0
                            ? getString(R.string.offline_message)
                            : description.toString();
                    showOffline(message);
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                if (request != null && request.isForMainFrame() && errorResponse != null && errorResponse.getStatusCode() >= 400) {
                    mainFrameFailed = true;
                    showOffline(getString(R.string.http_error, errorResponse.getStatusCode()));
                }
            }
        });

        retry.setOnClickListener(v -> load(pageUrl));
        share.setOnClickListener(v -> shareText(null));
        voiceButton.setOnClickListener(v -> {
            if (listening) {
                stopVoice();
            } else {
                startVoice();
            }
        });
        RoxFirebase.setTokenListener(this::deliverPushToken);
        if (RoxFirebase.isStarted() && Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
        }
        routeIntent(getIntent(), true);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        routeIntent(intent, false);
    }

    private void routeIntent(Intent intent, boolean initial) {
        if (intent == null) {
            if (initial) {
                load(RoxUrls.START);
            }
            return;
        }
        if (Intent.ACTION_SEND.equals(intent.getAction()) && "text/plain".equals(intent.getType())) {
            String text = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (text == null) {
                text = "";
            }
            text = text.trim();
            if (RoxUrls.isAppUrl(text)) {
                load(text);
                return;
            }
            if (!text.isEmpty()) {
                setSharedText(text);
            }
            if (initial || webView.getUrl() == null) {
                load(RoxUrls.START);
            } else {
                deliverSharedText();
            }
            return;
        }
        Uri data = intent.getData();
        if (Intent.ACTION_VIEW.equals(intent.getAction()) && RoxUrls.isAppUrl(data)) {
            load(data.toString());
            return;
        }
        if (initial) {
            load(RoxUrls.START);
        }
    }

    private void load(String url) {
        pageUrl = url == null ? RoxUrls.START : url;
        if (!isOnline()) {
            showOffline(getString(R.string.offline_message));
            return;
        }
        hideOffline();
        webView.loadUrl(pageUrl);
    }

    private boolean isOnline() {
        ConnectivityManager manager = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (manager == null) {
            return true;
        }
        Network network = manager.getActiveNetwork();
        if (network == null) {
            return false;
        }
        NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void showOffline(String message) {
        offlineMessage.setText(message == null || message.isEmpty() ? getString(R.string.offline_message) : message);
        offline.setVisibility(View.VISIBLE);
    }

    private void hideOffline() {
        offline.setVisibility(View.GONE);
    }

    void shareText(String text) {
        String payload = text == null ? "" : text.trim();
        if (payload.isEmpty()) {
            String title = webView.getTitle() == null ? getString(R.string.app_name) : webView.getTitle();
            String url = webView.getUrl() == null ? pageUrl : webView.getUrl();
            payload = title + "\n" + url;
        }
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT, payload);
        startActivity(Intent.createChooser(send, getString(R.string.share)));
    }

    synchronized String takeSharedText() {
        String value = sharedText == null ? "" : sharedText;
        sharedText = "";
        return value;
    }

    private synchronized void setSharedText(String text) {
        sharedText = text == null ? "" : text;
    }

    private synchronized String peekSharedText() {
        return sharedText == null ? "" : sharedText;
    }

    private void deliverSharedText() {
        String text = peekSharedText();
        if (text.isEmpty()) {
            return;
        }
        try {
            JSONObject detail = new JSONObject();
            detail.put("text", text);
            runOnPage("(function(detail){"
                    + "var event=new CustomEvent('rox-share-in',{detail:detail,cancelable:true});"
                    + "window.dispatchEvent(event);"
                    + "if(event.defaultPrevented)return;"
                    + "var el=document.activeElement;if(!el)return;"
                    + "var tag=el.tagName;"
                    + "if(tag!=='INPUT'&&tag!=='TEXTAREA'&&!el.isContentEditable)return;"
                    + "if(el.isContentEditable){document.execCommand('insertText',false,detail.text);}"
                    + "else{el.value=detail.text;}"
                    + "el.dispatchEvent(new Event('input',{bubbles:true}));"
                    + "})(" + detail.toString() + ")");
        } catch (JSONException ignored) {
            // The shared text stays available from RoxNative.takeSharedText().
        }
    }

    private void deliverPushToken(String token) {
        if (token == null || token.isEmpty()) {
            return;
        }
        try {
            JSONObject detail = new JSONObject();
            detail.put("token", token);
            runOnPage("window.dispatchEvent(new CustomEvent('rox-push-token',{detail:" + detail.toString() + "}))");
        } catch (JSONException ignored) {
            // RoxNative.getPushToken() still returns the token.
        }
    }

    private void deliverVoice(String text, boolean isFinal) {
        if (isFinal) {
            listening = false;
            updateVoiceButton();
        }
        try {
            JSONObject detail = new JSONObject();
            detail.put("text", text == null ? "" : text);
            detail.put("final", isFinal);
            runOnPage("(function(detail){"
                    + "var event=new CustomEvent('rox-voice',{detail:detail,cancelable:true});"
                    + "window.dispatchEvent(event);"
                    + "if(event.defaultPrevented||!detail.final)return;"
                    + "var el=document.activeElement;if(!el)return;"
                    + "var tag=el.tagName;"
                    + "if(tag!=='INPUT'&&tag!=='TEXTAREA'&&!el.isContentEditable)return;"
                    + "if(el.isContentEditable){document.execCommand('insertText',false,detail.text);}"
                    + "else{var gap=el.value&&!/\\s$/.test(el.value)?' ':'';el.value=el.value+gap+detail.text;}"
                    + "el.dispatchEvent(new Event('input',{bubbles:true}));"
                    + "})(" + detail.toString() + ")");
        } catch (JSONException ignored) {
            // Nothing to deliver.
        }
    }

    void startVoice() {
        if (checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{android.Manifest.permission.RECORD_AUDIO}, REQ_MIC);
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            Toast.makeText(this, R.string.voice_unavailable, Toast.LENGTH_SHORT).show();
            deliverVoiceError("unavailable");
            return;
        }
        if (recognizer == null) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(this);
            recognizer.setRecognitionListener(new VoiceListener());
        }
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        try {
            listening = true;
            updateVoiceButton();
            recognizer.startListening(intent);
        } catch (SecurityException exception) {
            listening = false;
            updateVoiceButton();
            deliverVoiceError("permission");
        }
    }

    void stopVoice() {
        listening = false;
        updateVoiceButton();
        if (recognizer != null) {
            recognizer.stopListening();
        }
    }

    private void updateVoiceButton() {
        voiceButton.setText(listening ? R.string.voice_stop : R.string.voice);
    }

    private void deliverVoiceError(String reason) {
        try {
            JSONObject detail = new JSONObject();
            detail.put("reason", reason);
            runOnPage("window.dispatchEvent(new CustomEvent('rox-voice-error',{detail:" + detail.toString() + "}))");
        } catch (JSONException ignored) {
            // The toast already told the user.
        }
    }

    private void onDownload(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
        if (url == null || !url.startsWith("https://")) {
            Toast.makeText(this, R.string.download_blocked, Toast.LENGTH_SHORT).show();
            return;
        }
        String name = URLUtil.guessFileName(url, contentDisposition, mimeType);
        name = name.replace('\\', '_').replace('/', '_');
        pendingDownload = new PendingDownload(url, userAgent, name, mimeType);
        if (Build.VERSION.SDK_INT <= 28
                && checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{android.Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_STORAGE);
            return;
        }
        enqueueDownload();
    }

    private void enqueueDownload() {
        PendingDownload download = pendingDownload;
        pendingDownload = null;
        if (download == null) {
            return;
        }
        DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        if (manager == null) {
            Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show();
            return;
        }
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(download.url));
        request.setMimeType(download.mimeType);
        request.addRequestHeader("User-Agent", download.userAgent == null ? "" : download.userAgent);
        String cookie = CookieManager.getInstance().getCookie(download.url);
        if (cookie != null) {
            request.addRequestHeader("Cookie", cookie);
        }
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, download.fileName);
        request.setTitle(download.fileName);
        try {
            manager.enqueue(request);
            Toast.makeText(this, R.string.download_started, Toast.LENGTH_SHORT).show();
        } catch (IllegalArgumentException | SecurityException exception) {
            Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || fileCallback == null) {
            return;
        }
        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        if (requestCode == REQ_MIC) {
            if (granted) {
                startVoice();
            } else {
                Toast.makeText(this, R.string.mic_denied, Toast.LENGTH_SHORT).show();
                deliverVoiceError("permission");
            }
        } else if (requestCode == REQ_STORAGE) {
            if (granted) {
                enqueueDownload();
            } else {
                pendingDownload = null;
                Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void runOnPage(String script) {
        if (webView == null) {
            return;
        }
        webView.post(() -> {
            if (webView != null) {
                webView.evaluateJavascript(script, null);
            }
        });
    }

    @Override
    protected void onDestroy() {
        RoxFirebase.setTokenListener(null);
        if (Build.VERSION.SDK_INT >= 33) {
            WebHistoryBack.clear(this);
        }
        if (fileCallback != null) {
            fileCallback.onReceiveValue(null);
            fileCallback = null;
        }
        if (recognizer != null) {
            recognizer.destroy();
            recognizer = null;
        }
        super.onDestroy();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (offline.getVisibility() == View.VISIBLE && webView != null && webView.canGoBack()) {
            hideOffline();
            webView.goBack();
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private final class VoiceListener implements RecognitionListener {
        @Override
        public void onReadyForSpeech(Bundle params) {
        }

        @Override
        public void onBeginningOfSpeech() {
        }

        @Override
        public void onRmsChanged(float rmsdB) {
        }

        @Override
        public void onBufferReceived(byte[] buffer) {
        }

        @Override
        public void onEndOfSpeech() {
            listening = false;
            updateVoiceButton();
        }

        @Override
        public void onError(int error) {
            listening = false;
            updateVoiceButton();
            deliverVoiceError("recognizer-" + error);
        }

        @Override
        public void onResults(Bundle results) {
            deliverVoice(firstMatch(results), true);
        }

        @Override
        public void onPartialResults(Bundle partialResults) {
            String match = firstMatch(partialResults);
            if (!match.isEmpty()) {
                deliverVoice(match, false);
            }
        }

        @Override
        public void onEvent(int eventType, Bundle params) {
        }

        private String firstMatch(Bundle results) {
            if (results == null) {
                return "";
            }
            ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (matches == null || matches.isEmpty() || matches.get(0) == null) {
                return "";
            }
            return matches.get(0);
        }
    }

    private static final class PendingDownload {
        final String url;
        final String userAgent;
        final String fileName;
        final String mimeType;

        PendingDownload(String url, String userAgent, String fileName, String mimeType) {
            this.url = url;
            this.userAgent = userAgent;
            this.fileName = fileName;
            this.mimeType = mimeType;
        }
    }
}
