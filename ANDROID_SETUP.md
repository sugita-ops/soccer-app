# Androidネイティブアプリ化ガイド

このドキュメントでは、宮中サッカー部管理システムをAndroidアプリとしてビルド・公開する手順を説明します。

## 前提条件

1. **Node.js環境**（既に設定済み）
2. **Android Studio**のインストール
3. **Java JDK 17**以上
4. **Android SDK**（API Level 34推奨）

## 1. 開発環境のセットアップ

### Android Studioのインストール
1. [Android Studio](https://developer.android.com/studio)をダウンロード・インストール
2. SDK Managerを開き、以下をインストール：
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Platform-Tools
   - Google Play services

### 環境変数の設定
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 2. Androidプラットフォームの追加

```bash
# Androidプラットフォームを追加
npx cap add android

# 初回ビルド
npm run cap:build
```

## 3. アプリアイコンとスプラッシュスクリーンの設定

### アイコン作成
1. `1024x1024` のアプリアイコンを作成
2. [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)でアイコンセットを生成
3. 生成されたファイルを `android/app/src/main/res/` に配置

### スプラッシュスクリーン
1. `2732x2732` のスプラッシュ画像を作成
2. `android/app/src/main/res/drawable/splash.png` として配置

## 4. アプリの設定

### `android/app/src/main/AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### `android/app/build.gradle`
```gradle
android {
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.miyachu.soccerapp"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

## 5. ビルドとテスト

### 開発用ビルド
```bash
# アプリをビルドしてAndroid Studioで開く
npm run cap:android

# エミュレーターで実行
npm run cap:serve
```

### デバッグAPK生成
```bash
cd android
./gradlew assembleDebug
```
生成されるAPK: `android/app/build/outputs/apk/debug/app-debug.apk`

## 6. リリース用ビルド

### キーストアの作成
```bash
keytool -genkey -v -keystore soccer-app-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias soccer-app
```

### `android/app/build.gradle`に署名設定追加
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../soccer-app-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'soccer-app'
            keyPassword 'your-password'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### リリースAPK生成
```bash
cd android
./gradlew assembleRelease
```

## 7. Google Playストア公開

### 必要な準備
1. **Google Play Console**アカウント作成（25ドルの登録料）
2. **アプリアイコン** (512x512)
3. **スクリーンショット** (各画面サイズ用)
4. **プライバシーポリシー**
5. **アプリ説明文**

### アップロード手順
1. Google Play Consoleで新しいアプリを作成
2. リリース用APKをアップロード
3. ストアリスティング情報を入力
4. 審査申請

## 8. 継続的インテグレーション（CI/CD）

### GitHub Actionsの設定例
```yaml
# .github/workflows/android.yml
name: Android Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'adopt'

      - name: Install dependencies
        run: npm ci

      - name: Build app
        run: npm run build

      - name: Sync Capacitor
        run: npx cap sync android

      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleRelease

      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: android/app/build/outputs/apk/release/app-release.apk
```

## 9. トラブルシューティング

### よくある問題
1. **JAVA_HOME未設定**: JDK17のパスを設定
2. **Android SDK不足**: SDK Managerで必要なコンポーネントをインストール
3. **権限エラー**: `chmod +x android/gradlew`で実行権限を付与

### ログ確認
```bash
# Androidログを確認
npx cap run android --list
adb logcat
```

## 10. 更新とメンテナンス

### アプリ更新手順
1. バージョン番号を更新（`package.json`と`build.gradle`）
2. `npm run cap:build`でビルド
3. 新しいAPKをGoogle Play Consoleにアップロード

### 注意点
- Supabase環境変数は必ず本番用に設定
- APIキーなどの秘匿情報の管理に注意
- 定期的なセキュリティアップデート

## 参考リンク
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)