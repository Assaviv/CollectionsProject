package com.aviv.saveapp;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareInboxPlugin.class); // must run before super.onCreate
        super.onCreate(savedInstanceState);
    }
}
