import assert from 'node:assert/strict';
import { test } from 'node:test';
import plugin from '../with-samsung-health-sdk.js';

const { addDependency, setMinSdk } = plugin;

const gradle = `android {
}

dependencies {
    implementation("com.facebook.react:react-android")
}
`;

test('adds the local aar dependency once', () => {
  const once = addDependency(gradle);
  assert.equal(addDependency(once), once);
  assert.match(once, /dependencies \{\n {4}implementation fileTree\(dir: "libs"/);
});

test('rejects an app/build.gradle without a dependencies block', () => {
  assert.throws(() => addDependency('android {}'), /dependencies block missing/);
});

for (const [name, properties] of [
  ['missing', []],
  ['lower', [{ type: 'property', key: 'android.minSdkVersion', value: '24' }]],
]) {
  test(`raises minSdk to 29 when ${name}`, () => {
    const result = setMinSdk(properties);
    assert.deepEqual(
      result.filter((p) => p.key === 'android.minSdkVersion').map((p) => p.value),
      ['29']
    );
  });
}
