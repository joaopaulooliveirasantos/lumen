package com.joaopaulosantos.lumen;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import org.json.JSONException;

/**
 * Lê os dados salvos pelo app React Native anterior (mesmo pacote), para migrá-los uma única vez.
 * O AsyncStorage 2.x do RN guarda tudo no SQLite "RKStorage", tabela catalystLocalStorage(key, value).
 * Só leitura: o banco antigo não é alterado. Quem decide o que copiar é o JS (storage/legacyMigration.ts).
 */
@CapacitorPlugin(name = "LegacyStorage")
public class LegacyStoragePlugin extends Plugin {

    private static final String DATABASE_NAME = "RKStorage";

    @PluginMethod
    public void read(PluginCall call) {
        JSArray keys = call.getArray("keys");
        JSObject entries = new JSObject();
        JSObject result = new JSObject();

        Context context = getContext();
        File file = context.getDatabasePath(DATABASE_NAME);
        if (keys == null || !file.exists()) {
            result.put("found", false);
            result.put("entries", entries);
            call.resolve(result);
            return;
        }

        SQLiteDatabase db = null;
        Cursor cursor = null;
        try {
            db = SQLiteDatabase.openDatabase(file.getPath(), null, SQLiteDatabase.OPEN_READONLY);
            for (int i = 0; i < keys.length(); i++) {
                String key = keys.getString(i);
                cursor = db.query("catalystLocalStorage", new String[] { "value" }, "key = ?", new String[] { key }, null, null, null);
                if (cursor.moveToFirst() && !cursor.isNull(0)) {
                    entries.put(key, cursor.getString(0));
                }
                cursor.close();
                cursor = null;
            }
            result.put("found", true);
            result.put("entries", entries);
            call.resolve(result);
        } catch (JSONException e) {
            call.reject("Lista de chaves inválida", e);
        } catch (Exception e) {
            // Banco corrompido ou em outro formato: segue sem migrar, sem derrubar o app.
            result.put("found", false);
            result.put("entries", new JSObject());
            result.put("error", e.getMessage());
            call.resolve(result);
        } finally {
            if (cursor != null) cursor.close();
            if (db != null) db.close();
        }
    }
}
