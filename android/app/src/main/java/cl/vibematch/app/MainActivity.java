package cl.vibematch.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.util.Log;
import android.util.Patterns;
import android.widget.EditText;
import androidx.appcompat.app.AlertDialog;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.CapConfig;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/**
 * Actividad principal de VibeMatch.
 *
 * La URL del servidor se puede cambiar sin recompilar la APK. Al arrancar se
 * lee `vibematch_server_url` de SharedPreferences y se inyecta en la
 * configuración de Capacitor antes de crear el Bridge. En el primer arranque
 * se pide la URL con un diálogo. También se puede abrir con:
 *
 *   vibematch://config
 *
 * o manteniendo pulsado el icono de la app → "Configurar servidor".
 *
 * Los enlaces de tarjeta se traducen a rutas internas:
 *   https://<dominio>/a/<token>  ->  <server.url>/a/<token>
 *   vibematch://a/<token>        ->  <server.url>/a/<token>
 */
public class MainActivity extends BridgeActivity {

    private static final String PREFS = "vibematch";
    private static final String KEY_SERVER = "vibematch_server_url";
    private static final String DEFAULT_SERVER = "https://vibematch.cl";
    private static final String TAG = "VibeMatch";
    private boolean dialogoServidorVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        prepararConfiguracion();
        super.onCreate(savedInstanceState);

        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        if (!prefs.contains(KEY_SERVER)) {
            if (getBridge() != null) {
                getBridge().getWebView().post(this::mostrarDialogoServidor);
            } else {
                mostrarDialogoServidor();
            }
            return;
        }

        // Arranque en frío desde una tarjeta NFC, un QR o el atajo de ajustes.
        // El intent inicial no pasa por onNewIntent.
        Intent inicial = getIntent();
        if (esConfiguracion(inicial)) {
            mostrarDialogoServidor();
        } else {
            handleDeepLink(inicial);
        }
    }

    /**
     * Carga capacitor.config.json y, si el usuario guardó una URL, la aplica
     * antes de que BridgeActivity cree el Bridge. Esto conserva los plugins,
     * el esquema y el resto de la configuración.
     */
    private void prepararConfiguracion() {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
            String url = prefs.getString(KEY_SERVER, null);
            if (url == null || url.isEmpty()) {
                return;
            }

            String raw = leerAsset("capacitor.config.json");
            JSONObject json = new JSONObject(raw);
            JSONObject server = json.optJSONObject("server");
            if (server == null) {
                server = new JSONObject();
                json.put("server", server);
            }
            server.put("url", url);
            server.put("cleartext", url.startsWith("http://"));
            config = new CapConfig(getAssets(), json);
        } catch (Exception error) {
            Log.w(TAG, "No se pudo aplicar la URL guardada; se usa la de fábrica.", error);
        }
    }

    private String leerAsset(String nombre) throws Exception {
        StringBuilder texto = new StringBuilder();
        try (InputStream is = getAssets().open(nombre);
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String linea;
            while ((linea = reader.readLine()) != null) {
                texto.append(linea);
            }
        }
        return texto.toString();
    }

    private void mostrarDialogoServidor() {
        if (dialogoServidorVisible || isFinishing()) {
            return;
        }
        dialogoServidorVisible = true;

        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        String actual = prefs.getString(KEY_SERVER, DEFAULT_SERVER);

        EditText entrada = new EditText(this);
        entrada.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        entrada.setText(actual);
        entrada.setSelectAllOnFocus(true);
        entrada.setSingleLine(true);

        new AlertDialog.Builder(this)
            .setTitle("Servidor de VibeMatch")
            .setMessage(
                "Escribe la dirección HTTPS de tu colegio (por ejemplo, https://vibematch.cl). " +
                "Si aún no está desplegado, usa el servidor de demostración."
            )
            .setView(entrada)
            .setCancelable(false)
            .setPositiveButton("Guardar", (dialog, which) -> guardarServidor(entrada.getText().toString()))
            .setNegativeButton("Usar demostración", (dialog, which) ->
                guardarServidor("https://vibe-match-zeta.vercel.app")
            )
            .setOnDismissListener(dialog -> dialogoServidorVisible = false)
            .show();
    }

    private void guardarServidor(String valor) {
        String url = valor == null ? "" : valor.trim();
        if (url.isEmpty()) {
            new android.os.Handler(android.os.Looper.getMainLooper())
                .postDelayed(this::mostrarDialogoServidor, 250);
            return;
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        url = url.replaceAll("/+$", "");

        if (!Patterns.WEB_URL.matcher(url).matches()) {
            new AlertDialog.Builder(this)
                .setTitle("Dirección no válida")
                .setMessage("Escribe una URL completa, por ejemplo https://vibematch.cl")
                .setPositiveButton("Reintentar", (dialog, which) ->
                    new android.os.Handler(android.os.Looper.getMainLooper())
                        .postDelayed(this::mostrarDialogoServidor, 250)
                )
                .show();
            return;
        }

        getSharedPreferences(PREFS, MODE_PRIVATE)
            .edit()
            .putString(KEY_SERVER, url)
            .apply();

        // Al guardar desde vibematch://config no hay que reabrir el diálogo al
        // recrear la actividad. Los deep links de tarjeta sí se conservan.
        Intent actual = getIntent();
        if (actual != null && esConfiguracion(actual)) {
            actual.setData(null);
            actual.removeExtra("configurar");
        }
        recreate();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null) {
            setIntent(intent);
            if (esConfiguracion(intent)) {
                mostrarDialogoServidor();
            } else {
                handleDeepLink(intent);
            }
        }
    }

    private boolean esConfiguracion(Intent intent) {
        Uri data = intent.getData();
        if (data != null && "vibematch".equalsIgnoreCase(data.getScheme())) {
            return "config".equalsIgnoreCase(data.getHost());
        }
        return intent.getBooleanExtra("configurar", false);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null || getBridge() == null) {
            return;
        }

        Uri data = intent.getData();
        if (data == null) {
            return;
        }

        String scheme = data.getScheme();
        String path = null;

        if ("vibematch".equalsIgnoreCase(scheme)) {
            String host = data.getHost();
            String ruta = data.getPath();
            if ("a".equals(host)) {
                path = "/a" + (ruta == null ? "" : ruta);
            } else if (ruta != null && ruta.startsWith("/a/")) {
                path = ruta;
            }
        } else if ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme)) {
            String ruta = data.getPath();
            if (ruta != null && ruta.startsWith("/a/")) {
                path = ruta;
            }
        }

        if (path == null) {
            return;
        }

        if (data.getQuery() != null && !data.getQuery().isEmpty()) {
            path = path + "?" + data.getQuery();
        }

        String base = getBridge().getServerUrl();
        final String destino;
        if (base == null || base.isEmpty()) {
            destino = path;
        } else {
            destino = base.replaceAll("/+$", "") + path;
        }

        // Esperar a que la carga inicial de la WebView termine para que el
        // deep link no sea reemplazado por la página raíz.
        getBridge().getWebView().post(() -> getBridge().getWebView().loadUrl(destino));
    }
}
