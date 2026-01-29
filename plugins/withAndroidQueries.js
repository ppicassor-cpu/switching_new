const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // 1. 모든 앱 검색 권한(QUERY_ALL_PACKAGES) 추가 로직
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const hasQueryPermission = manifest["uses-permission"].some(
      (p) => p.$["android:name"] === "android.permission.QUERY_ALL_PACKAGES"
    );

    if (!hasQueryPermission) {
      manifest["uses-permission"].push({
        $: { "android:name": "android.permission.QUERY_ALL_PACKAGES" },
      });
    }

    // 2. 앱 실행(LAUNCHER) 쿼리 추가 로직
    if (!manifest.queries) {
      manifest.queries = [];
    }

    const hasLauncherQuery = manifest.queries.some((q) => {
      const intent = q?.intent?.[0];
      const action = intent?.action?.[0]?.$?.["android:name"];
      const category = intent?.category?.[0]?.$?.["android:name"];
      return (
        action === "android.intent.action.MAIN" &&
        category === "android.intent.category.LAUNCHER"
      );
    });

    if (!hasLauncherQuery) {
      manifest.queries.push({
        intent: [
          {
            action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
            category: [{ $: { "android:name": "android.intent.category.LAUNCHER" } }],
          },
        ],
      });
    }

    return config;
  });
};