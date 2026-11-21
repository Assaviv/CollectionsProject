package com.aviv.saveapp;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Set;

/**
 * Hand-off buffer between the share sheet (native, no WebView) and the web app.
 * ShareReceiverActivity appends items; the app reads them through ShareInboxPlugin,
 * stores each one as a normal inbox card, then removes it here.
 */
final class ShareQueue {
    private static final String PREFS = "ShareInbox";
    private static final String KEY = "pending";
    private static final Object LOCK = new Object();

    private ShareQueue() {}

    /** Appends an item. Returns false if it couldn't be written to disk. */
    static boolean add(Context context, JSONObject item) {
        synchronized (LOCK) {
            SharedPreferences prefs = prefs(context);
            JSONArray items = read(prefs);
            items.put(item);
            return prefs.edit().putString(KEY, items.toString()).commit();
        }
    }

    static JSONArray getAll(Context context) {
        synchronized (LOCK) {
            return read(prefs(context));
        }
    }

    /** Removes the given ids. Items added in the meantime are kept. */
    static void remove(Context context, Set<String> ids) {
        synchronized (LOCK) {
            SharedPreferences prefs = prefs(context);
            JSONArray items = read(prefs);
            JSONArray kept = new JSONArray();
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.optJSONObject(i);
                if (item != null && !ids.contains(item.optString("id"))) kept.put(item);
            }
            prefs.edit().putString(KEY, kept.toString()).commit();
        }
    }

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static JSONArray read(SharedPreferences prefs) {
        try {
            return new JSONArray(prefs.getString(KEY, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }
}
