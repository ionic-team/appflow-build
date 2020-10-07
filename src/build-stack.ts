import { AxiosInstance } from 'axios';

export function getPlatform(ctx: AppflowContext): Platform {
  const platform = ctx.platform.toLowerCase();
  switch (platform) {
    case 'ios':
      return 'ios';
    case 'android':
      return 'android';
    case 'web':
      return 'web-deploy';
    default:
      throw new Error(
        `${ctx.platform} is not a valid platform. must be one of (Web, iOS, Android).`
      );
  }
}

const VALID_BUILD_TYPES = [
  'ad-hoc',
  'app-store',
  'development',
  'enterprise',
  'debug',
  'release',
];

function isBuildTypeName(str: string): str is BuildTypeName {
  return typeof str === 'string' && VALID_BUILD_TYPES.includes(str);
}

export function getAndValidateBuildType(
  ctx: AppflowContext,
  stack: Stack
): BuildType | undefined {
  if (!ctx.buildType) {
    if (stack.build_types.length > 0) {
      throw new Error(
        `build-type required for platform ${
          ctx.platform
        } must be one of (${stack.build_types.map(t => t.name).join(', ')})`
      );
    }
    return;
  }

  const buildTypeName = ctx.buildType.toLowerCase().replace(' ', '-');
  if (!isBuildTypeName(buildTypeName)) {
    throw new Error(
      `${
        ctx.buildType
      } is not a valid build type. Must be one of (${VALID_BUILD_TYPES.join(
        ', '
      )})`
    );
  }
  const buildType = stack.build_types.find(t => t.name === buildTypeName);
  if (!buildType) {
    throw new Error(
      `build-type ${ctx.buildType} not available for platform ${
        ctx.platform
      } must be one of (${stack.build_types.map(t => t.name).join(', ')})`
    );
  }
  return buildType;
}

export async function getBuildStack(
  client: AxiosInstance,
  platform: Platform,
  ctx: AppflowContext
): Promise<Stack> {
  const resp = await client.get('/stacks');
  const { data: stacks } = resp.data as { data: Stack[] };
  const stackName = ctx.buildStack;

  const availableStacksForPlatform = stacks.filter(
    stack => stack.platform === platform
  );

  if (availableStacksForPlatform.length < 1) {
    throw new Error(`Couldn't find stack for platform: ${ctx.platform}`);
  }

  if (!stackName) {
    const stack = availableStacksForPlatform.find(s => s.latest);
    if (!stack) {
      throw new Error(
        `Couldn't find latest stack for platform: ${ctx.platform}`
      );
    }
    return stack;
  }

  const stack = availableStacksForPlatform.find(
    s => s.friendly_name === stackName
  );
  if (!stack) {
    throw new Error(
      `Couldn't find stack for platform: ${ctx.platform} matching name: ${stackName}`
    );
  }

  return stack;
}
