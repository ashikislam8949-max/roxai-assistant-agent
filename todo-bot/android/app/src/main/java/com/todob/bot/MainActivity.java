package com.todob.bot;

import android.app.Activity;
import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.Uri;
import org.json.JSONException;
import java.util.ArrayList;
import java.util.Locale;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int AUDIO_PERMISSION_REQUEST = 4101;
    private WebView webView;
    private SpeechRecognizer speechRecognizer;
    private TextToSpeech textToSpeech;
    private String pendingLanguage = "en-SA";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.addJavascriptInterface(new VoiceBridge(), "AndroidVoice");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("file".equalsIgnoreCase(scheme) && uri.getPath() != null && uri.getPath().startsWith("/android_asset/")) {
                    return false;
                }
                try {
                    if ("tel".equalsIgnoreCase(scheme)) {
                        startActivity(new Intent(Intent.ACTION_DIAL, uri));
                        return true;
                    }
                    if ("sms".equalsIgnoreCase(scheme)) {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                        return true;
                    }
                    if ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme)) {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                        return true;
                    }
                } catch (android.content.ActivityNotFoundException ignored) {
                    return true;
                }
                return true;
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
        textToSpeech = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                textToSpeech.setLanguage(Locale.forLanguageTag("en-SA"));
            }
        });
    }

    private class VoiceBridge {
        @JavascriptInterface
        public void startListening(String language) {
            runOnUiThread(() -> beginListening(language));
        }

        @JavascriptInterface
        public void speak(String text, String language) {
            runOnUiThread(() -> speakText(text, language));
        }
    }

    private void beginListening(String language) {
        pendingLanguage = language;
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, AUDIO_PERMISSION_REQUEST);
            }
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            sendVoiceResult("error", "", "Speech recognition is not available on this device.");
            return;
        }
        if (speechRecognizer != null) speechRecognizer.destroy();
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) { }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float rmsdB) { }
            @Override public void onBufferReceived(byte[] buffer) { }
            @Override public void onEndOfSpeech() { }
            @Override public void onPartialResults(Bundle partialResults) { }
            @Override public void onEvent(int eventType, Bundle params) { }

            @Override
            public void onError(int error) {
                sendVoiceResult("error", "", "Speech recognition failed. Check microphone access and try again.");
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                String text = matches == null || matches.isEmpty() ? "" : matches.get(0);
                sendVoiceResult(text.isEmpty() ? "error" : "result", text,
                    text.isEmpty() ? "No speech was recognized. Try again or type instead." : "");
            }
        });
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, pendingLanguage);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, pendingLanguage);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        speechRecognizer.startListening(intent);
    }

    private void speakText(String text, String language) {
        if (textToSpeech == null) return;
        Locale locale = Locale.forLanguageTag(language);
        int availability = textToSpeech.setLanguage(locale);
        if (availability >= TextToSpeech.LANG_AVAILABLE) {
            textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "todo-bot-voice");
        }
    }

    private void sendVoiceResult(String status, String text, String message) {
        if (webView == null) return;
        String payload;
        try {
            payload = new JSONObject()
                .put("status", status)
                .put("text", text)
                .put("message", message)
                .toString();
        } catch (JSONException exception) {
            return;
        }
        webView.post(() -> webView.evaluateJavascript(
            "window.todoBotVoiceResult && window.todoBotVoiceResult(" + payload + ");",
            null
        ));
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != AUDIO_PERMISSION_REQUEST) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            beginListening(pendingLanguage);
        } else {
            sendVoiceResult("error", "", "Microphone permission was denied. You can type instead.");
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (speechRecognizer != null) speechRecognizer.destroy();
        if (textToSpeech != null) textToSpeech.shutdown();
        webView = null;
        super.onDestroy();
    }
}
