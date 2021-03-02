type NativePlatform = 'IOS' | 'ANDROID';
type WebPlatform = 'WEB';
type Platform = NativePlatform | WebPlatform;

type BuildTypeName =
  | 'ad-hoc'
  | 'app-store'
  | 'development'
  | 'enterprise'
  | 'debug'
  | 'release';

type ProfileType = 'production' | 'development';

interface Logger {
  debug: (message: string) => void;
  print: (...messages: any[]) => void;
  error: (message: string | Error) => void;
}

interface AppflowContext {
  logger: Logger;
  token: string;
  appId: string;
  platform: string;
  filename?: string;
  buildStack?: string;
  buildType?: string;
  certificate?: string;
  environment?: string;
  nativeConfig?: string;
  destinations?: string;
  webPreview?: boolean;
  apiUrl?: string;
}

interface App {
  name: string;
  id: string;
  web_preview: boolean;
}

interface BuildType {
  name: BuildTypeName;
  friendly_name: string;
  profile_type: ProfileType;
}

interface Stack {
  latest: boolean;
  friendly_name: string;
  platform: Platform;
  id: number;
  build_types: BuildType[];
}

interface Certificate {
  name: string;
  tag: string;
  type: ProfileType;
  id: number;
}

interface Environment {
  name: string;
  id: number;
}

interface NativeConfig {
  name: string;
  id: number;
}

interface Channel {
  name: string;
  id: string;
}

interface Commit {
  note: string;
  ref: string;
  sha: string;
  short_sha: string;
  id: number;
}

interface DistributionCredential {
  name: string;
  id: number;
}
interface Build {
  job_id: number;
  id: string;
  caller_id: number;
  created: string;
  finished: string;
  state: 'created' | 'pending' | 'running' | 'failed' | 'success' | 'canceled';
  commit: any;
  automation_id: number;
  environment_id: number;
  native_config_id: number;
  automation_name: string;
  environment_name: string;
  job: any;
}
