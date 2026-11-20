package com.joaopaulosantos.lumen;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins locais do app precisam ser registrados antes do super.onCreate.
        registerPlugin(LegacyStoragePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
