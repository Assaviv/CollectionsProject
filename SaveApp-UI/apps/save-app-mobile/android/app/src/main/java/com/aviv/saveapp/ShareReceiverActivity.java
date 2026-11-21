package com.aviv.saveapp;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

import org.json.JSONObject;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Receives text from the Android share sheet without opening the app.
 * It only queues the item on the device (works offline, needs no token);
 * the app turns it into a normal inbox card the next time it starts or resumes.
 */
public class ShareReceiverActivity extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        String text = getIntent().getStringExtra(Intent.EXTRA_TEXT);

        if (text == null || text.trim().isEmpty()) {
            Toast.makeText(this, "Nothing to save", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        boolean saved;
        try {
            JSONObject item = new JSONObject();
            item.put("id", UUID.randomUUID().toString());
            item.put("text", text);
            item.put("sharedAt", System.currentTimeMillis());

            String url = extractUrl(text);
            if (url != null) {
                item.put("type", "link");
                item.put("url", url);
                String host = extractHost(url);
                if (host != null) item.put("key", host);
            } else {
                item.put("type", "any");
            }
            saved = ShareQueue.add(this, item);
        } catch (Exception e) {
            saved = false;
        }

        Toast.makeText(this, saved ? "Saved" : "Couldn't save", Toast.LENGTH_SHORT).show();
        finish();
    }

    private static final Pattern URL_PATTERN =
            Pattern.compile("https?://[^\\s<>\"]+", Pattern.CASE_INSENSITIVE);

    /** Returns the first URL found in the text, or null. */
    private static String extractUrl(String text) {
        Matcher m = URL_PATTERN.matcher(text);
        if (!m.find()) return null;
        // Strip punctuation that is usually part of the sentence, not the URL
        return m.group().replaceAll("[)\\]}>.,;:!?'\"]+$", "");
    }

    /** Returns the host (without "www." / "m." / "mobile."), or null. */
    private static String extractHost(String url) {
        String host = Uri.parse(url).getHost();
        if (host == null) return null;
        return host.toLowerCase().replaceFirst("^(www|m|mobile)\\.", "");
    }
}
