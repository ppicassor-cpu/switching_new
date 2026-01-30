const { withAndroidManifest, withDangerousMod, withMainApplication } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withAppSwitch(config) {
  // 1. AndroidManifest.xml 수정
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const mainApplication = manifest.application[0];

    if (!manifest["uses-permission"]) manifest["uses-permission"] = [];
    
    const permissions = [
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
      "android.permission.QUERY_ALL_PACKAGES"
    ];

    permissions.forEach(perm => {
      if (!manifest["uses-permission"].some(p => p.$["android:name"] === perm)) {
        manifest["uses-permission"].push({ $: { "android:name": perm } });
      }
    });

    if (!manifest["queries"] || !manifest["queries"].length) manifest["queries"] = [{}];
    const queriesNode = manifest["queries"][0];
    if (!queriesNode.intent) queriesNode.intent = [];

    const hasQuery = (actionName, categoryName, scheme) =>
      (queriesNode.intent || []).some(i => {
        const actions = i.action || [];
        const categories = i.category || [];
        const datas = i.data || [];
        const okAction = actions.some(a => a?.$?.["android:name"] === actionName);
        const okCategory = categories.some(c => c?.$?.["android:name"] === categoryName);
        const okScheme = scheme ? datas.some(d => d?.$?.["android:scheme"] === scheme) : true;
        return okAction && okCategory && okScheme;
      });

    if (!hasQuery("android.intent.action.MAIN", "android.intent.category.LAUNCHER", null)) {
      queriesNode.intent.push({
        action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
        category: [{ $: { "android:name": "android.intent.category.LAUNCHER" } }],
      });
    }

    if (!hasQuery("android.intent.action.VIEW", "android.intent.category.BROWSABLE", "https")) {
      manifest["queries"].push({
        intent: [{
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          category: [{ $: { "android:name": "android.intent.category.BROWSABLE" } }],
          data: [{ $: { "android:scheme": "https" } }],
        }],
      });
    }

    if (!mainApplication.service) mainApplication.service = [];

    const serviceName = ".AppSwitchService"; 
    let serviceEntry = mainApplication.service.find(s => s.$["android:name"] === serviceName);

    if (!serviceEntry) {
      serviceEntry = { $: { "android:name": serviceName } };
      mainApplication.service.push(serviceEntry);
    }

    serviceEntry.$ = {
      ...serviceEntry.$,
      "android:permission": "android.permission.BIND_ACCESSIBILITY_SERVICE",
      "android:label": "스위칭 서비스",
      "android:enabled": "true",
      "android:exported": "true", 
      "android:stopWithTask": "false",
      "android:foregroundServiceType": "specialUse", 
    };

    serviceEntry["intent-filter"] = [{ action: [{ $: { "android:name": "android.accessibilityservice.AccessibilityService" } }] }];
    serviceEntry["meta-data"] = [{ $: { "android:name": "android.accessibilityservice", "android:resource": "@xml/accessibility_service_config" } }];

    return config;
  });

  // 2. MainApplication.kt 수정
  config = withMainApplication(config, (config) => {
    let content = config.modResults.contents;
    if (!content.includes("AppSwitchPackage()")) {
      if (!content.includes("import com.switching.app.AppSwitchPackage")) {
        content = content.replace(
          /package com\.switching\.app/,
          "package com.switching.app\n\nimport com.switching.app.AppSwitchPackage"
        );
      }

      if (/PackageList\(this\)\.packages\.apply\s*\{/.test(content)) {
        content = content.replace(
          /PackageList\(this\)\.packages\.apply\s*\{/,
          "PackageList(this).packages.apply {\n                add(AppSwitchPackage())"
        );
      } else if (/val packages = PackageList\(this\)\.packages/.test(content)) {
        content = content.replace(
          /val packages = PackageList\(this\)\.packages/,
          "val packages = PackageList(this).packages\n        packages.add(AppSwitchPackage())"
        );
      } else if (/return PackageList\(this\)\.packages/.test(content)) {
        content = content.replace(
          /return PackageList\(this\)\.packages/,
          "return PackageList(this).packages.apply { add(AppSwitchPackage()) }"
        );
      }
    }
    config.modResults.contents = content;
    return config;
  });

    // 3. 물리적 파일 자동 생성
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest?.projectRoot || process.cwd();
      const packagePath = "com/switching/app";
      const androidPath = path.join(projectRoot, "android/app/src/main/java", packagePath);

      if (!fs.existsSync(androidPath)) {
        fs.mkdirSync(androidPath, { recursive: true });
      }

      const legacyJavaFiles = [
        "AppSwitchModule.java",
        "AppSwitchService.java",
        "AppSwitchPackage.java",
      ];
      legacyJavaFiles.forEach((f) => {
        const p = path.join(androidPath, f);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });

      // ✅ [최종 수정] 패스스루 방식 (AudioManager 제거, return true 제거)
      const serviceCode = `package com.switching.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent

class AppSwitchService : AccessibilityService() {

    override fun onServiceConnected() {
        val info = serviceInfo
        info.flags = info.flags or AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS
        serviceInfo = info
    }

    override fun onKeyEvent(event: KeyEvent): Boolean {
        val prefs = getSharedPreferences("AppSwitchPrefs", android.content.Context.MODE_PRIVATE)
        val isEnabled = prefs.getBoolean("isEnabled", false)
        val targetPackage = prefs.getString("targetPackage", "") ?: ""

        if (isEnabled && targetPackage.isNotEmpty() && event.keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            
            // 1. 키를 누르는 순간 (ACTION_DOWN) 앱 실행 시도 (Side Effect)
            if (event.action == KeyEvent.ACTION_DOWN) {
                val intent = packageManager.getLaunchIntentForPackage(targetPackage)
                if (intent != null) {
                    intent.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                    )
                    startActivity(intent)
                }
            }

            // 2. [핵심] 여기서 return true를 하지 않습니다!
            // return super.onKeyEvent(event)를 호출하여 시스템이 이벤트를 "정상 처리(볼륨 다운)"하게 둡니다.
        }

        return super.onKeyEvent(event)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {}
    override fun onInterrupt() {}
}
`;


      // [모듈] 설치 앱 목록 + iconUri(file://캐시) 제공
      const moduleCode = `package com.switching.app

import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream

class AppSwitchModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "AppSwitchModule"

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) {
            return drawable.bitmap
        }
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 128
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 128
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }

    private fun getCachedIconUri(pm: PackageManager, packageName: String): String? {
        return try {
            val dir = File(reactApplicationContext.cacheDir, "app_icons")
            if (!dir.exists()) dir.mkdirs()

            val outFile = File(dir, "$packageName.png")

            if (!outFile.exists() || outFile.length() < 1024) {
                val drawable = pm.getApplicationIcon(packageName)
                val bmp = drawableToBitmap(drawable)
                FileOutputStream(outFile).use { fos ->
                    bmp.compress(Bitmap.CompressFormat.PNG, 100, fos)
                    fos.flush()
                }
            }

            "file://" + outFile.absolutePath
        } catch (e: Exception) {
            null
        }
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val list = Arguments.createArray()

            for (app in apps) {
                if (pm.getLaunchIntentForPackage(app.packageName) != null) {
                    val map = Arguments.createMap()
                    map.putString("label", pm.getApplicationLabel(app).toString())
                    map.putString("packageName", app.packageName)

                    val iconUri = getCachedIconUri(pm, app.packageName)
                    if (iconUri != null) {
                        map.putString("iconUri", iconUri)
                    }

                    list.pushMap(map)
                }
            }

            promise.resolve(list)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun launchApp(packageName: String) {
        val intent = reactApplicationContext.packageManager.getLaunchIntentForPackage(packageName)
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        val expectedComponentName = android.content.ComponentName(reactApplicationContext, AppSwitchService::class.java)
        val enabledServices = android.provider.Settings.Secure.getString(
            reactApplicationContext.contentResolver,
            android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        )
        val isEnabled = enabledServices?.contains(expectedComponentName.flattenToString()) == true
        promise.resolve(isEnabled)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun saveSettings(targetPackage: String, isEnabled: Boolean) {
        val prefs = reactApplicationContext.getSharedPreferences("AppSwitchPrefs", android.content.Context.MODE_PRIVATE)
        prefs.edit().putString("targetPackage", targetPackage).putBoolean("isEnabled", isEnabled).apply()
    }

    @ReactMethod
    fun getSettings(promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences("AppSwitchPrefs", android.content.Context.MODE_PRIVATE)
        val map = Arguments.createMap()
        map.putString("targetPackage", prefs.getString("targetPackage", ""))
        map.putBoolean("isEnabled", prefs.getBoolean("isEnabled", false))
        promise.resolve(map)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
`;

      const packageCode = `package com.switching.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class AppSwitchPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(AppSwitchModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
`;

      const xmlDir = path.join(projectRoot, "android/app/src/main/res/xml");
      if (!fs.existsSync(xmlDir)) fs.mkdirSync(xmlDir, { recursive: true });

      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagRequestFilterKeyEvents"
    android:canRetrieveWindowContent="false"
    android:canRequestFilterKeyEvents="true"
    android:description="@string/app_name" />
`;

      fs.writeFileSync(path.join(androidPath, "AppSwitchService.kt"), serviceCode, "utf8");
      fs.writeFileSync(path.join(androidPath, "AppSwitchModule.kt"), moduleCode, "utf8");
      fs.writeFileSync(path.join(androidPath, "AppSwitchPackage.kt"), packageCode, "utf8");
      fs.writeFileSync(path.join(xmlDir, "accessibility_service_config.xml"), xmlContent, "utf8");

      console.log("✅ [withAppSwitch] 모든 로직 통합 수정 완료!");
      return config;
    },
  ]);
};