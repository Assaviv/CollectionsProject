package com.aviv.saveapp;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.util.HashSet;
import java.util.Set;

/** Lets the web app read and acknowledge items queued by ShareReceiverActivity. */
@CapacitorPlugin(name = "ShareInbox")
public class ShareInboxPlugin extends Plugin {

    @PluginMethod
    public void getPending(PluginCall call) {
        JSObject result = new JSObject();
        try {
            result.put("items", new JSArray(ShareQueue.getAll(getContext()).toString()));
        } catch (Exception e) {
            call.reject("Couldn't read shared items", e);
            return;
        }
        call.resolve(result);
    }

    @PluginMethod
    public void remove(PluginCall call) {
        JSArray ids = call.getArray("ids");
        if (ids == null) {
            call.reject("ids is required");
            return;
        }
        Set<String> set = new HashSet<>();
        JSONArray raw = ids;
        for (int i = 0; i < raw.length(); i++) set.add(raw.optString(i));
        ShareQueue.remove(getContext(), set);
        call.resolve();
    }
}
