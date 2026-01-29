const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withRenameBundle(config) {
  return withAppBuildGradle(config, (config) => {
    const gradle = config.modResults.contents;

    if (!gradle.includes('tasks.whenTaskAdded')) {
      config.modResults.contents = gradle + `
tasks.whenTaskAdded { task ->
    if (task.name == 'bundleRelease') {
        task.doLast {
            exec {
                commandLine 'node', '../rename-bundle.js'
                workingDir rootDir
            }
        }
    }
}
      `;
    }

    return config;
  });
};
