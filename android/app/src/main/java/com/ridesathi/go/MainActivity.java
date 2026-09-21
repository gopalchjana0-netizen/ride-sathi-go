package com.ridesathi.go;

import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
  private WebView webView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    setTheme(R.style.AppTheme_NoActionBar);
    super.onCreate(savedInstanceState);

    try {
      FrameLayout rootLayout = new FrameLayout(this);
      rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT));
      setContentView(rootLayout);

      webView = new WebView(this);
      webView.setLayoutParams(new FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.MATCH_PARENT,
          FrameLayout.LayoutParams.MATCH_PARENT));
      rootLayout.addView(webView);

      WebSettings s = webView.getSettings();
      s.setJavaScriptEnabled(true);
      s.setDomStorageEnabled(true);
      s.setDatabaseEnabled(true);
      s.setAllowFileAccess(true);
      s.setAllowContentAccess(true);
      s.setGeolocationEnabled(true);
      s.setUseWideViewPort(true);
      s.setLoadWithOverviewMode(true);
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

      String startUrl = "https://ride-sathi-go.web.app/index.html";

      try {
        ApplicationInfo ai = getPackageManager().getApplicationInfo(getPackageName(), PackageManager.GET_META_DATA);
        if (ai != null && ai.metaData != null && ai.metaData.containsKey("START_URL")) {
          String meta = ai.metaData.getString("START_URL");
          if (meta != null && !meta.trim().isEmpty()) {
            startUrl = meta.trim();
          }
        }
      } catch (Exception ignored) {}

      try {
        ActivityInfo act = getPackageManager().getActivityInfo(getComponentName(), PackageManager.GET_META_DATA);
        if (act != null && act.metaData != null && act.metaData.containsKey("START_URL")) {
          String meta = act.metaData.getString("START_URL");
          if (meta != null && !meta.trim().isEmpty()) {
            startUrl = meta.trim();
          }
        }
      } catch (Exception ignored) {}

      webView.loadUrl(startUrl);
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
