package com.ridesathi.go;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
  private WebView webView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    try {
      webView = new WebView(this);
      setContentView(webView);

      WebSettings s = webView.getSettings();
      s.setJavaScriptEnabled(true);
      s.setDomStorageEnabled(true);
      s.setAllowFileAccess(true);
      s.setAllowContentAccess(true);
      s.setGeolocationEnabled(true);
      s.setDatabaseEnabled(true);
      s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

      webView.setWebChromeClient(new WebChromeClient() {
        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
          callback.invoke(origin, true, false);
        }
      });

      webView.setDownloadListener((u, userAgent, contentDisposition, mimetype, contentLength) -> {
        try {
          Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(u));
          startActivity(i);
        } catch (Exception ignored) {}
      });

      webView.setWebViewClient(new WebViewClient() {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
          String u = request.getUrl().toString();
          if (u.startsWith("tel:") || u.startsWith("whatsapp:") || u.contains("wa.me") || u.startsWith("intent:") || u.startsWith("mailto:") || u.endsWith(".apk")) {
            try {
              Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(u));
              startActivity(i);
              return true;
            } catch (Exception ignored) {}
          }
          return false;
        }
      });

      String url = "https://ride-sathi-go.web.app/index.html";
      try {
        Bundle meta = getPackageManager().getApplicationInfo(getPackageName(), 128).metaData;
        if (meta != null && meta.containsKey("START_URL")) {
          url = meta.getString("START_URL");
        }
      } catch (Exception e) {}

      webView.loadUrl(url);
    } catch (Exception e) {
      e.printStackTrace();
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
}
