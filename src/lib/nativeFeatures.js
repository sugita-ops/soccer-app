import { Capacitor } from '@capacitor/core'

// ネイティブプラグインの動的インポート（Web環境での安全性）
const isNative = Capacitor.isNativePlatform()

// Status Bar
export const configureStatusBar = async () => {
  if (!isNative) return

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Default })
    await StatusBar.setBackgroundColor({ color: '#6366f1' })
  } catch (error) {
    console.warn('StatusBar configuration failed:', error)
  }
}

// Splash Screen
export const hideSplashScreen = async () => {
  if (!isNative) return

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch (error) {
    console.warn('SplashScreen hide failed:', error)
  }
}

// Toast通知
export const showNativeToast = async (text, duration = 'short') => {
  if (!isNative) return false

  try {
    const { Toast } = await import('@capacitor/toast')
    await Toast.show({
      text,
      duration: duration === 'short' ? 'short' : 'long',
      position: 'bottom'
    })
    return true
  } catch (error) {
    console.warn('Native toast failed:', error)
    return false
  }
}

// Haptic Feedback
export const triggerHapticFeedback = async (type = 'medium') => {
  if (!isNative) return

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')

    const impactStyles = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    }

    await Haptics.impact({
      style: impactStyles[type] || ImpactStyle.Medium
    })
  } catch (error) {
    console.warn('Haptic feedback failed:', error)
  }
}

// App情報取得
export const getAppInfo = async () => {
  if (!isNative) {
    return {
      name: '宮中サッカー部',
      id: 'com.miyachu.soccerapp',
      version: '1.0.0',
      build: '1'
    }
  }

  try {
    const { App } = await import('@capacitor/app')
    const info = await App.getInfo()
    return info
  } catch (error) {
    console.warn('App info failed:', error)
    return null
  }
}

// バックボタン処理
export const setupBackButtonHandler = (handler) => {
  if (!isNative) return

  try {
    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', handler)
    })
  } catch (error) {
    console.warn('Back button handler setup failed:', error)
  }
}

// プラットフォーム情報
export const getPlatformInfo = () => {
  return {
    isNative,
    platform: Capacitor.getPlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isIOS: Capacitor.getPlatform() === 'ios',
    isWeb: Capacitor.getPlatform() === 'web'
  }
}

// アプリの状態変更を監視
export const setupAppStateListeners = (listeners = {}) => {
  if (!isNative) return

  try {
    import('@capacitor/app').then(({ App }) => {
      if (listeners.onStateChange) {
        App.addListener('appStateChange', listeners.onStateChange)
      }

      if (listeners.onUrlOpen) {
        App.addListener('appUrlOpen', listeners.onUrlOpen)
      }
    })
  } catch (error) {
    console.warn('App state listeners setup failed:', error)
  }
}