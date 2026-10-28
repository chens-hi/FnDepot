#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_APPS = 5000;
const MAX_RELEASES = 100;
const PLATFORMS = new Set(['all', 'x86', 'arm']);
const CATEGORIES = new Set([
  '影音娱乐',
  '系统工具',
  '编程开发',
  'AI赋能',
  '生活服务',
  '智能智控',
  '教育学习',
  '游戏地带',
  '硬件驱动',
]);

const args = process.argv.slice(2);
let input = 'fnpack.json';
let strict = false;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--input') {
    input = args[i + 1];
    i += 1;
  } else if (arg.startsWith('--input=')) {
    input = arg.slice('--input='.length);
  } else if (arg === '--strict') {
    strict = true;
  } else {
    console.error(`未知参数: ${arg}`);
    process.exit(2);
  }
}

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;
const isHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
const isAssetRef = (value) =>
  isNonEmptyString(value) && (isHttpUrl(value) || /^\.{0,2}\//.test(value));

const filePath = resolve(process.cwd(), input);
let raw;
try {
  raw = readFileSync(filePath, 'utf8');
} catch (error) {
  console.error(`ERROR 无法读取 ${filePath}: ${error.message}`);
  process.exit(1);
}

if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

const byteLength = Buffer.byteLength(raw, 'utf8');
if (byteLength > MAX_FILE_BYTES) {
  fail(`文件 ${input} 为 ${byteLength} 字节，超过主仓 2 MB 限制`);
}

let source;
try {
  source = JSON.parse(raw);
} catch (error) {
  console.error(`ERROR ${input} 不是合法 JSON: ${error.message}`);
  process.exit(1);
}

if (!isPlainObject(source)) {
  console.error('ERROR 源文件顶层必须是对象');
  process.exit(1);
}

if (source.schema_version !== '2') {
  fail(`schema_version 必须为字符串 "2"，当前为 ${JSON.stringify(source.schema_version)}`);
}

if (!isPlainObject(source.source_info)) {
  fail('source_info 缺失或不是对象');
} else {
  if (!isNonEmptyString(source.source_info.name)) {
    fail('source_info.name 必须是非空字符串');
  }
  if (!isNonEmptyString(source.source_info.author)) {
    fail('source_info.author 必须是非空字符串');
  } else {
    const normalized = source.source_info.author.toLowerCase().replace(/\s+/g, '');
    if (normalized === 'fndepot') {
      fail('source_info.author 不能是 "fndepot"（主仓禁止冒充）');
    }
  }
}

if (!isPlainObject(source.apps)) {
  fail('apps 缺失或不是对象');
} else {
  const appNames = Object.keys(source.apps);
  if (appNames.length === 0) {
    const message = 'apps 为空，主仓要求至少 1 个应用，当前不会被收录';
    if (strict) fail(message);
    else warn(message);
  }
  if (appNames.length > MAX_APPS) {
    fail(`apps 数量 ${appNames.length} 超过上限 ${MAX_APPS}`);
  }

  for (const appName of appNames) {
    const app = source.apps[appName];
    const at = `apps.${appName}`;

    if (!isNonEmptyString(appName)) {
      fail('apps 下存在空的应用名');
      continue;
    }
    if (!isPlainObject(app)) {
      fail(`${at} 必须是对象`);
      continue;
    }

    for (const field of ['display_name', 'desc']) {
      if (!isNonEmptyString(app[field])) fail(`${at}.${field} 必须是非空字符串`);
    }

    if (!Array.isArray(app.platform) || app.platform.length === 0) {
      fail(`${at}.platform 必须是非空数组`);
    } else {
      for (const value of app.platform) {
        if (!PLATFORMS.has(value)) {
          fail(`${at}.platform 含非法值 ${JSON.stringify(value)}，可选 all/x86/arm`);
        }
      }
    }

    if (!Array.isArray(app.categories) || app.categories.length === 0) {
      fail(`${at}.categories 必须是非空数组`);
    } else {
      for (const value of app.categories) {
        if (!CATEGORIES.has(value)) {
          fail(`${at}.categories 含非法值 ${JSON.stringify(value)}`);
        }
      }
    }

    if (!isAssetRef(app.icon_url)) {
      fail(`${at}.icon_url 必须是 http(s) 地址或相对路径`);
    }

    if (!['package', 'root'].includes(app.run_as)) {
      fail(`${at}.run_as 必须为 package 或 root`);
    }

    if (!Object.hasOwn(app, 'install_type') || !['', 'root'].includes(app.install_type)) {
      fail(`${at}.install_type 必须存在且为 ""（存储空间）或 "root"（系统空间）`);
    }

    if (typeof app.is_docker !== 'boolean') {
      fail(`${at}.is_docker 必须是布尔值`);
    }

    if (Object.hasOwn(app, 'service_port') && !['string', 'number'].includes(typeof app.service_port)) {
      fail(`${at}.service_port 必须是字符串或数字`);
    }

    for (const field of ['readme_url', 'bug_report_url', 'maintainer_url', 'distributor_url']) {
      if (Object.hasOwn(app, field) && !isNonEmptyString(app[field])) {
        fail(`${at}.${field} 存在时必须是非空字符串`);
      }
    }

    if (Object.hasOwn(app, 'preview_urls')) {
      if (!Array.isArray(app.preview_urls) || !app.preview_urls.every(isAssetRef)) {
        fail(`${at}.preview_urls 必须是由 http(s) 地址或相对路径组成的数组`);
      }
    }

    if (Object.hasOwn(app, 'details_url') && !isAssetRef(app.details_url)) {
      fail(`${at}.details_url 存在时必须是 http(s) 地址或相对路径`);
    }

    if (!isPlainObject(app.releases)) {
      fail(`${at}.releases 缺失或不是对象`);
      continue;
    }

    const versions = Object.keys(app.releases);
    if (versions.length === 0) {
      fail(`${at}.releases 至少需要一个版本`);
    }
    if (versions.length > MAX_RELEASES) {
      fail(`${at}.releases 版本数 ${versions.length} 超过上限 ${MAX_RELEASES}`);
    }

    for (const version of versions) {
      const release = app.releases[version];
      const vAt = `${at}.releases.${version}`;

      if (!isPlainObject(release)) {
        fail(`${vAt} 必须是对象`);
        continue;
      }

      if (Object.hasOwn(release, 'changelog') && typeof release.changelog !== 'string') {
        fail(`${vAt}.changelog 必须是字符串`);
      }
      if (Object.hasOwn(release, 'updated_at') && Number.isNaN(Date.parse(release.updated_at))) {
        fail(`${vAt}.updated_at 不是可解析的时间`);
      }

      if (!isPlainObject(release.packages)) {
        fail(`${vAt}.packages 缺失或不是对象`);
        continue;
      }

      const archKeys = Object.keys(release.packages);
      if (archKeys.length === 0) {
        fail(`${vAt}.packages 至少需要一个架构包`);
      }

      for (const arch of archKeys) {
        const pkg = release.packages[arch];
        const pAt = `${vAt}.packages.${arch}`;

        if (!PLATFORMS.has(arch)) {
          fail(`${pAt} 架构键非法，可选 all/x86/arm`);
        }
        if (!isPlainObject(pkg)) {
          fail(`${pAt} 必须是对象`);
          continue;
        }
        if (!isHttpUrl(pkg.download_url)) {
          fail(`${pAt}.download_url 必须是 http(s) 地址`);
        }
        if (!isNonEmptyString(pkg.sha256) || !/^[a-f0-9]{64}$/i.test(pkg.sha256)) {
          fail(`${pAt}.sha256 必须是 64 位十六进制字符串`);
        }
        if (typeof pkg.size !== 'number' || !Number.isFinite(pkg.size) || pkg.size <= 0) {
          fail(`${pAt}.size 必须是正数（字节）`);
        }
      }
    }
  }
}

for (const message of warnings) console.warn(`WARN ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);

const appCount = isPlainObject(source.apps) ? Object.keys(source.apps).length : 0;
console.log(`校验 ${input}: ${appCount} 个应用，${errors.length} 个错误，${warnings.length} 个告警`);

process.exit(errors.length > 0 ? 1 : 0);
