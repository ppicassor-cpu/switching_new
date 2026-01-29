// FILE: plugins/withAppSwitchModule.js

const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withAppSwitchModule(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest?.projectRoot || process.cwd();

      const javaDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "java",
        "com",
        "switching",
        "app"
      );
      fs.mkdirSync(javaDir, { recursive: true });

      const modulePath = path.join(javaDir, "AppSwitchModule.kt");
      const servicePath = path.join(javaDir, "AppSwitchService.kt");

      const xmlDir = path.join(projectRoot, "android", "app", "src", "main", "res", "xml");
      fs.mkdirSync(xmlDir, { recursive: true });
      const xmlPath = path.join(xmlDir, "accessibility_service_config.xml");

      const moduleCode = `package com.switching.app

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class AppSwitchModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val PREFS_NAME = "AppSwitchPrefs"
        private const val KEY_TARGET_PACKAGE = "targetPackage"
        private const val KEY_IS_ENABLED = "isEnabled"
    }

    override fun getName(): String = "AppSwitchModule"

    @ReactMethod
    fun saveSettings(targetPackage: String, isEnabled: Boolean) {
        val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_TARGET_PACKAGE, targetPackage)
            .putBoolean(KEY_IS_ENABLED, isEnabled)
            .apply()
    }

    @ReactMethod
    fun getSettings(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val map = Arguments.createMap()
            map.putString(KEY_TARGET_PACKAGE, prefs.getString(KEY_TARGET_PACKAGE, "") ?: "")
            map.putBoolean(KEY_IS_ENABLED, prefs.getBoolean(KEY_IS_ENABLED, false))
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("GET_SETTINGS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val arr = Arguments.createArray()

            for (app in apps) {
                if (pm.getLaunchIntentForPackage(app.packageName) != null) {
                    val m = Arguments.createMap()
                    m.putString("label", pm.getApplicationLabel(app).toString())
                    m.putString("packageName", app.packageName)
                    arr.pushMap(m)
                }
            }

            promise.resolve(arr)
        } catch (e: Exception) {
            promise.reject("GET_APPS_ERROR", e.message, e)
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
        try {
            val enabledServices = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""

            val expected = reactApplicationContext.packageName + "/.AppSwitchService"
            promise.resolve(enabledServices.contains(expected))
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
`;

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
        val prefs = getSharedPreferences("AppSwitchPrefs", MODE_PRIVATE)
        val isEnabled = prefs.getBoolean("isEnabled", false)
        val targetPackage = prefs.getString("targetPackage", "") ?: ""

        if (isEnabled && targetPackage.isNotEmpty() && event.keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
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
            return true
        }

        return super.onKeyEvent(event)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {}
    override fun onInterrupt() {}
}
`;

      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagRequestFilterKeyEvents"
    android:canRetrieveWindowContent="false"
    android:canRequestFilterKeyEvents="true"
    android:description="@string/app_name" />
`;

      fs.writeFileSync(modulePath, moduleCode, "utf8");
      fs.writeFileSync(servicePath, serviceCode, "utf8");
      fs.writeFileSync(xmlPath, xmlContent, "utf8");

      return config;
    },
  ]);
};
