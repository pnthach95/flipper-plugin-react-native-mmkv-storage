# This repository is archived as Flipper is removed from React Native 0.74

# Desktop Flipper plugin for [React Native MMKV Storage](https://github.com/ammarahm-ed/react-native-mmkv-storage)

## Features
- Show logs every time you interact with storage
- Edit value

![gif](docs/example.gif)

_* Tested on Flipper v0.152.0, React Native v0.68.2, RN MMKV Storage source code from github_

## Install

Open Flipper and search on Plugin Manager

![manager](docs/manager.png)

## On your React Native project

Install [Flipper plug-in](https://github.com/pnthach95/rn-mmkv-storage-flipper):

```bash
yarn add react-native-flipper rn-mmkv-storage-flipper --dev
```

or

```bash
npm i react-native-flipper rn-mmkv-storage-flipper -D
```

Update your code:

```js
import {MMKVLoader} from 'react-native-mmkv-storage';
import mmkvFlipper from 'rn-mmkv-storage-flipper';

const MMKV = new MMKVLoader()
  .withInstanceID('test')
  .withEncryption()
  .initialize();

if (__DEV__) {
  mmkvFlipper(MMKV);
}
```

## FAQ

### My Android app crashes nonstop

This is known [issus](https://github.com/facebook/flipper/issues/3026#issuecomment-966631294) on Flipper. The workaround is keep Flipper opening while running app on debug mode.
