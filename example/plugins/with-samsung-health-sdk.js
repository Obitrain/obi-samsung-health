const fs = require('fs');
const path = require('path');
const {
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
} = require('expo/config-plugins');

// The SDK requires Android 10 (API 29)
const MIN_SDK = '29';
const DEPENDENCY = 'implementation fileTree(dir: "libs", include: ["*.aar"])';

const findAars = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((name) => name.endsWith('.aar'))
    : [];

const addDependency = (contents) => {
  if (contents.includes(DEPENDENCY)) return contents;
  const anchor = /^dependencies\s*\{/m;
  if (!anchor.test(contents)) {
    throw new Error(
      'Unsupported Expo app/build.gradle: dependencies block missing'
    );
  }
  return contents.replace(anchor, (match) => `${match}\n    ${DEPENDENCY}`);
};

const setMinSdk = (properties) => {
  const existing = properties.find(
    (p) => p.type === 'property' && p.key === 'android.minSdkVersion'
  );
  if (existing) existing.value = MIN_SDK;
  else
    properties.push({
      type: 'property',
      key: 'android.minSdkVersion',
      value: MIN_SDK,
    });
  return properties;
};

module.exports = (config) => {
  config = withDangerousMod(config, [
    'android',
    (mod) => {
      // the aar lives in <repo>/libs (gitignored, see README)
      const source = path.join(mod.modRequest.projectRoot, '..', 'libs');
      const aars = findAars(source);
      if (aars.length === 0) {
        throw new Error(
          `Samsung Health Data SDK aar missing in ${source}: download it from ` +
            'https://developer.samsung.com/health/data/process.html'
        );
      }
      const target = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'libs'
      );
      fs.mkdirSync(target, { recursive: true });
      for (const aar of aars)
        fs.copyFileSync(path.join(source, aar), path.join(target, aar));
      return mod;
    },
  ]);
  config = withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = addDependency(mod.modResults.contents);
    return mod;
  });
  config = withGradleProperties(config, (mod) => {
    mod.modResults = setMinSdk(mod.modResults);
    return mod;
  });
  return config;
};

module.exports.addDependency = addDependency;
module.exports.setMinSdk = setMinSdk;
