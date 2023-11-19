import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/native-message.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/native-message.ts'
export type nativeToWebMessageType =
  | 'iapReceipt'
  | 'iapError'
  | 'setIsNative'
  | 'nativeFbUser'
  | 'pushNotificationPermissionStatus'
  | 'pushToken'
  | 'notification'
  | 'link'

export type nativeToWebMessage = {
  type: nativeToWebMessageType
  data: any
}

export type webToNativeMessage = {
  type: webToNativeMessageType
  data: any
}

export type webToNativeMessageType =
  | 'checkout'
  | 'openUrl'
  | 'tryToGetPushTokenWithoutPrompt'
  | 'loginClicked'
  | 'copyToClipboard'
  | 'promptEnablePushNotifications'
  | 'signOut'
  | 'users'
  | 'error'
  | 'onPageVisit'
  | 'share'
  | 'theme'
  | 'log'
  | 'startedListening'

export const IS_NATIVE_KEY = 'is-native'
export const PLATFORM_KEY = 'native-platform'
