import { sys } from 'cc';

interface DeviceData {
    system: string;
    browser: string;
    phone_type: string;
}

function getIOSDeviceType(): string {
    const ua = navigator.userAgent;
    if (ua.includes('iPad')) {
        return 'iPad';
    }
    return 'iPhone';
}

function parseBrowser(): string {
    const ua = navigator.userAgent;

    // iOS 上所有瀏覽器底層都是 WebKit，sys.browserType 都會回傳 safari
    // 需要從 userAgent 中解析實際瀏覽器
    const criOS = ua.match(/CriOS\/([\d.]+)/);
    if (criOS) return `Chrome ${criOS[1]}`;

    const fxiOS = ua.match(/FxiOS\/([\d.]+)/);
    if (fxiOS) return `Firefox ${fxiOS[1]}`;

    const edgiOS = ua.match(/EdgiOS\/([\d.]+)/);
    if (edgiOS) return `Edge ${edgiOS[1]}`;

    // Android / Desktop 瀏覽器判斷
    const edg = ua.match(/Edg\/([\d.]+)/);
    if (edg) return `Edge ${edg[1]}`;

    const firefox = ua.match(/Firefox\/([\d.]+)/);
    if (firefox) return `Firefox ${firefox[1]}`;

    const chrome = ua.match(/Chrome\/([\d.]+)/);
    if (chrome) return `Chrome ${chrome[1]}`;

    // 最後才判斷 Safari（因為很多瀏覽器 UA 都包含 Safari）
    const safari = ua.match(/Version\/([\d.]+).*Safari/);
    if (safari) return `Safari ${safari[1]}`;

    return `${sys.browserType} ${sys.browserVersion}`;
}

function parseAndroidModel(): string {
    const match = navigator.userAgent.match(/;\s*([\w\s\-\.\/]+)\s*Build\//);
    if (match) {
        return match[1].trim();
    }
    return 'Android Device';
}

/**
 * 取得裝置資訊（同步部分）
 */
export function getDeviceInfoSync(): DeviceData {
    const system = `${sys.os || 'Unknown OS'} ${sys.osVersion || ''}`.trim();
    const browser = parseBrowser() || 'Unknown Browser';
    let phone_type = 'Unknown Device';

    if (sys.os === 'Android') {
        phone_type = parseAndroidModel();
    } else if (sys.os === 'iOS') {
        phone_type = getIOSDeviceType();
    } else {
        phone_type = 'Desktop';
    }

    return { system, browser, phone_type };
}

/**
 * 取得裝置資訊（非同步版本，Android Chrome 可取得更精確型號）
 */
export async function getDeviceInfo(): Promise<DeviceData> {
    const info = getDeviceInfoSync();

    // Android Chrome: 嘗試用 Client Hints 取得精確型號
    if (sys.os === 'Android' && (navigator as any).userAgentData?.getHighEntropyValues) {
        try {
            const ua = await (navigator as any).userAgentData.getHighEntropyValues(['model', 'platformVersion']);
            if (ua.model) {
                info.phone_type = ua.model;
            }
        } catch (e) {
            // 不支援就用 userAgent 解析的結果
        }
    }

    return info;
}
