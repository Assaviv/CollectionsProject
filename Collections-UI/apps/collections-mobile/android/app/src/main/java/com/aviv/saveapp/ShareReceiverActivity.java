package com.aviv.saveapp;

import static android.app.PendingIntent.getActivity;
import static java.security.AccessController.getContext;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

import androidx.core.content.IntentCompat;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ShareReceiverActivity extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Intent intent = getIntent();
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);

        // Capacitor's Preferences plugin writes here, so JS can store the API URL/token
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
        String baseUrl = prefs.getString("apiBaseUrl", "https://jellyfish.saola-agama.ts.net");
        String token = prefs.getString("apiToken", null);

        if (text == null) {
            Toast.makeText(this, "Open the app once to set it up", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        new Thread(() -> {
            boolean ok = false;
            try {
                URL url = new URL(baseUrl + "/api/Collections/inbox"); // your endpoint
                HttpURLConnection c = (HttpURLConnection) url.openConnection();
                c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                if (token != null) c.setRequestProperty("Authorization", "Bearer " + token);
                c.setDoOutput(true);
                JSONObject body = new JSONObject();
                body.put("text", text);

                String urlText = extractUrl(text);
                if (urlText != null) {
                    body.put("key", extractHost(text));
                    body.put("type", "link");
                } else {
                    body.put("type", "any");
                }

                try (OutputStream o = c.getOutputStream()) { o.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
                ok = c.getResponseCode() / 100 == 2;
            } catch (Exception ignored) {}
            boolean saved = ok;
            runOnUiThread(() -> {
                Toast.makeText(this, saved ? "Saved" : "Couldn't save", Toast.LENGTH_SHORT).show();
                finish();
            });
        }).start();
    }

    private static final Pattern URL_PATTERN =
            Pattern.compile("https?://[^\\s<>\"]+", Pattern.CASE_INSENSITIVE);

    /** Returns the first URL found in the text, or null. */
    private static String extractUrl(String text) {
        if (text == null) return null;
        Matcher m = URL_PATTERN.matcher(text);
        if (!m.find()) return null;
        // Strip punctuation that is usually part of the sentence, not the URL
        return m.group().replaceAll("[)\\]}>.,;:!?'\"]+$", "");
    }

    /** Returns the host (without "www." / "m."), or null if there is no URL. */
    private static String extractHost(String text) {
        String url = extractUrl(text);
        if (url == null) return null;
        String host = Uri.parse(url).getHost();
        if (host == null) return null;
        host = host.toLowerCase();
        return host.replaceFirst("^(www|m|mobile)\\.", "");
    }
}
