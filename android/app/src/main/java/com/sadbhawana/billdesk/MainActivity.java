package com.sadbhawana.billdesk;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Run webview configuration inside a post callback to ensure bridge initialization
        this.bridge.getWebView().post(new Runnable() {
            @Override
            public void run() {
                final WebView webView = bridge.getWebView();
                WebSettings settings = webView.getSettings();

                // Disable built-in zoom controls
                settings.setSupportZoom(false);
                settings.setBuiltInZoomControls(false);
                settings.setDisplayZoomControls(false);

                // Enable WebView file and content access for local asset loading and downloads
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                }

                // Enable Cookie Manager cookie syncing and third-party compatibility
                CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

                // Register Javascript bridge interface
                webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

                // Set Download Listener to support invoice PDF downloads (including blobs and data URLs)
                webView.setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                        try {
                            String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                            if (filename.endsWith(".bin") && mimetype.equals("application/pdf")) {
                                filename = filename.substring(0, filename.length() - 4) + ".pdf";
                            }

                            if (url.startsWith("blob:")) {
                                String escapedUrl = url.replace("'", "\\'");
                                String escapedFilename = filename.replace("'", "\\'");
                                String escapedMime = mimetype.replace("'", "\\'");
                                
                                String js = "var xhr = new XMLHttpRequest();" +
                                            "xhr.open('GET', '" + escapedUrl + "', true);" +
                                            "xhr.responseType = 'blob';" +
                                            "xhr.onload = function() { " +
                                            "  if (this.status === 200) { " +
                                            "    var blob = this.response; " +
                                            "    var reader = new FileReader(); " +
                                            "    reader.onloadend = function() { " +
                                            "      var base64data = reader.result.split(',')[1]; " +
                                            "      window.AndroidBridge.onBlobDownloaded(base64data, '" + escapedFilename + "', '" + escapedMime + "'); " +
                                            "    }; " +
                                            "    reader.readAsDataURL(blob); " +
                                            "  } " +
                                            "}; " +
                                            "xhr.send();";
                                webView.evaluateJavascript(js, null);
                                Toast.makeText(getApplicationContext(), "Processing PDF download...", Toast.LENGTH_SHORT).show();
                            } else if (url.startsWith("data:")) {
                                int commaIndex = url.indexOf(",");
                                if (commaIndex != -1) {
                                    String base64Data = url.substring(commaIndex + 1);
                                    saveAndOpenBase64File(base64Data, filename, mimetype);
                                }
                            } else {
                                // Standard network download via DownloadManager
                                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                                request.setMimeType(mimetype);
                                String cookies = CookieManager.getInstance().getCookie(url);
                                request.addRequestHeader("cookie", cookies);
                                request.addRequestHeader("User-Agent", userAgent);
                                request.setDescription("Downloading invoice PDF...");
                                request.setTitle(filename);
                                
                                request.allowScanningByMediaScanner();
                                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
                                
                                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                                if (dm != null) {
                                    dm.enqueue(request);
                                    Toast.makeText(getApplicationContext(), "Downloading invoice PDF...", Toast.LENGTH_SHORT).show();
                                }
                            }
                        } catch (Exception e) {
                            Toast.makeText(getApplicationContext(), "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                        }
                    }
                });

                // Programmatic loading spinner setup
                final ProgressBar progressBar = new ProgressBar(MainActivity.this);
                progressBar.setIndeterminate(true);
                
                // Style with Royal Blue theme color (#1E3A8A)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    progressBar.getIndeterminateDrawable().setColorFilter(Color.parseColor("#1E3A8A"), PorterDuff.Mode.SRC_IN);
                }

                FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    Gravity.CENTER
                );
                progressBar.setLayoutParams(params);
                progressBar.setVisibility(View.GONE);

                ViewGroup parentView = (ViewGroup) webView.getParent();
                if (parentView != null) {
                    parentView.addView(progressBar);
                }

                // Attach custom WebView client extending Capacitor's BridgeWebViewClient
                webView.setWebViewClient(new BridgeWebViewClient(bridge) {
                    @Override
                    public void onPageStarted(WebView view, String url, Bitmap favicon) {
                        super.onPageStarted(view, url, favicon);
                        // Only show spinner for remote site loading, not local assets
                        if (url != null && !url.startsWith("file:///")) {
                            progressBar.setVisibility(View.VISIBLE);
                        }
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        progressBar.setVisibility(View.GONE);

                        // Inject JS polyfills and bridge helpers
                        String polyfills = 
                            "console.log('Sadbhawana Bridge: Injecting native polyfills...');" +
                            "if (window.AndroidBridge) { window.AndroidBridge.requestPermissions(); }" +
                            "window.print = function() {" +
                            "  if (window.AndroidBridge) {" +
                            "    window.AndroidBridge.printPage();" +
                            "  } else {" +
                            "    console.warn('AndroidBridge not found for print');" +
                            "  }" +
                            "};" +
                            "if (window.AndroidBridge) {" +
                            "  navigator.share = function(data) {" +
                            "    return new Promise(function(resolve, reject) {" +
                            "      try {" +
                            "        if (data.url || data.text) {" +
                            "          window.AndroidBridge.shareText(data.text || data.url, data.title || 'Share');" +
                            "          resolve();" +
                            "        } else if (data.files && data.files.length > 0) {" +
                            "          var file = data.files[0];" +
                            "          var reader = new FileReader();" +
                            "          reader.onloadend = function() {" +
                            "            var base64 = reader.result.split(',')[1];" +
                            "            window.AndroidBridge.shareFile(base64, file.name, file.type);" +
                            "            resolve();" +
                            "          };" +
                            "          reader.readAsDataURL(file);" +
                            "        } else {" +
                            "          reject(new Error('Nothing to share'));" +
                            "        }" +
                            "      } catch(e) {" +
                            "        reject(e);" +
                            "      }" +
                            "    });" +
                            "  };" +
                            "}";
                        webView.evaluateJavascript(polyfills, null);
                    }

                    @Override
                    public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                        super.onReceivedError(view, errorCode, description, failingUrl);
                        progressBar.setVisibility(View.GONE);
                    }
                });
            }
        });
    }

    // Helper method to save base64 and open share dialog
    private void saveAndShareBase64File(String base64Data, String filename, String mimetype) {
        try {
            byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
            File cacheDir = new File(getCacheDir(), "shared_files");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }
            File file = new File(cacheDir, filename);
            FileOutputStream fos = new FileOutputStream(file);
            fos.write(decodedBytes);
            fos.close();

            Uri contentUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
            
            Intent shareIntent = new Intent();
            shareIntent.setAction(Intent.ACTION_SEND);
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            shareIntent.setType(mimetype);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            
            startActivity(Intent.createChooser(shareIntent, "Share Invoice"));
        } catch (Exception e) {
            Toast.makeText(getApplicationContext(), "Failed to share file: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    // Helper method to save base64 file to public downloads and open it
    private void saveAndOpenBase64File(String base64Data, String filename, String mimetype) {
        try {
            byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!downloadsDir.exists()) {
                downloadsDir.mkdirs();
            }
            File file = new File(downloadsDir, filename);
            FileOutputStream fos = new FileOutputStream(file);
            fos.write(decodedBytes);
            fos.close();

            // Trigger Media Scanner
            Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
            Uri fileUri = Uri.fromFile(file);
            mediaScanIntent.setData(fileUri);
            sendBroadcast(mediaScanIntent);

            Toast.makeText(getApplicationContext(), "Saved PDF to Downloads folder", Toast.LENGTH_SHORT).show();

            // Open the file with Intent
            try {
                Uri contentUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(contentUri, mimetype);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception ex) {
                Toast.makeText(getApplicationContext(), "File saved. Install PDF viewer to open it.", Toast.LENGTH_LONG).show();
            }
        } catch (Exception e) {
            Toast.makeText(getApplicationContext(), "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    // Request permissions for Android 13+ and older versions
    private void requestAppPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{
                    android.Manifest.permission.POST_NOTIFICATIONS,
                    android.Manifest.permission.READ_MEDIA_IMAGES
                }, 100);
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{
                    android.Manifest.permission.WRITE_EXTERNAL_STORAGE,
                    android.Manifest.permission.READ_EXTERNAL_STORAGE
                }, 100);
            }
        }
    }

    // Javascript Interface Bridge class
    public class AndroidBridge {
        @JavascriptInterface
        public void printPage() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (printManager != null) {
                        String jobName = "Sadbhawana BillDesk Invoice";
                        PrintDocumentAdapter printAdapter;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            printAdapter = bridge.getWebView().createPrintDocumentAdapter(jobName);
                        } else {
                            printAdapter = bridge.getWebView().createPrintDocumentAdapter();
                        }
                        printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());
                    }
                }
            });
        }

        @JavascriptInterface
        public void shareText(final String text, final String title) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent sendIntent = new Intent();
                    sendIntent.setAction(Intent.ACTION_SEND);
                    sendIntent.putExtra(Intent.EXTRA_TEXT, text);
                    sendIntent.setType("text/plain");
                    Intent shareIntent = Intent.createChooser(sendIntent, title);
                    startActivity(shareIntent);
                }
            });
        }

        @JavascriptInterface
        public void shareFile(final String base64Data, final String filename, final String mimetype) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    saveAndShareBase64File(base64Data, filename, mimetype);
                }
            });
        }

        @JavascriptInterface
        public void downloadBase64(final String base64Data, final String filename, final String mimetype) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    saveAndOpenBase64File(base64Data, filename, mimetype);
                }
            });
        }

        @JavascriptInterface
        public void requestPermissions() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    requestAppPermissions();
                }
            });
        }
        
        @JavascriptInterface
        public void onBlobDownloaded(final String base64Data, final String filename, final String mimetype) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    saveAndOpenBase64File(base64Data, filename, mimetype);
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        // If the webview can go back in history, handle back locally
        if (this.bridge != null && this.bridge.getWebView() != null && this.bridge.getWebView().canGoBack()) {
            this.bridge.getWebView().goBack();
        } else {
            super.onBackPressed();
        }
    }
}
