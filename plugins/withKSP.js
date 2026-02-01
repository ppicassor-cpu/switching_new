// plugins/withKSP.js
const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withKSP(config) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    // KSP 버전 오버라이드: Kotlin 2.0.21에 맞는 최신 버전
    contents = contents.replace(/id "com.google.devtools.ksp" version "[\d.-]+"/g, 'id "com.google.devtools.ksp" version "2.0.21-1.0.25"');
    config.modResults.contents = contents;
    return config;
  });
};