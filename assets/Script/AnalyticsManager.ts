
import { _decorator, Component } from 'cc';
import { getDeviceInfoSync } from './Common/DeviceInfo';
import { EDITOR } from 'cc/env';
const { ccclass } = _decorator;

// 宣告全域的 gtag 函式
declare const gtag: Function;

//#region Enums for GA parameters
export enum GameResult {
    SUCCESS = 'success',
    FAIL = 'fail',
}

export enum FeatureType {
    NONE = 'none',
    FG = 'fg',
    BG = 'bg',
}

export enum TurboType {
    NORMAL = 'normal',
    TURBO1 = 'turbo1',
    TURBO2 = 'turbo2',
}

export enum GameErrorType {
    LOW_BALANCE = 'low_balance',
    DISCONNECT = 'disconnect',
    TIMEOUT = 'timeout',
}

export enum GameExitReason {
    MANUAL = 'manual',
    CRASH_OR_CLOSE = 'crash_or_close',
}
//#endregion

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 分鐘
@ccclass('AnalyticsManager')
export class AnalyticsManager extends Component {
    private static _instance: AnalyticsManager = null;
    private clientId: string = '';
    private userId: string = ''; // 新增：用於識別跨裝置帳號的 User ID
    private sessionId: string = '';
    private gameId: string = '';
    private lastActivityTimestamp: number = 0;


    constructor() {
        super();
        // 初始使用前端生成的 UUID，直到後端提供為止
        this.clientId = this.getOrCreateUUID('aw_game_client_id');
    }

    public static get instance(): AnalyticsManager {
        if (!this._instance) {
            this._instance = new AnalyticsManager();
        }
        return this._instance;
    }

    /**
     * 初始化設定，特別是 game_id
     * @param gameId 遊戲 ID
     */
    public init(gameId: string): void {
        this.gameId = gameId;
        this.manageSessionId(); // 在初始化時確保會話 ID 已建立或更新
    }

    /**
     * 從後端取得 Client ID 後，設定/更新 Client ID
     * @param id
     */
    public setClientId(id: string): void {
        if (id) {
            this.clientId = id;
            localStorage.setItem('aw_game_client_id', id); // 同步更新 localStorage
            console.log(`GA Client ID updated to: ${id}`);
        }
    }

    /**
     * 設定登入後的 User ID (帳號 ID)
     * 用於串連不同裝置間的同一個帳號行為
     * @param id 
     */
    public setUserId(id: string): void {
        this.userId = id;
        console.log(`GA User ID set to: ${id}`);
    }

    /**
     * 取得目前的 User ID
     * @returns string
     */
    public getUserId(): string {
        return this.userId;
    }

    /**
     * 取得目前的 Client ID
     * @returns string
     */
    public getClientId(): string {
        return this.clientId;
    }

    /**
     * 取得當前的 Session ID，供外部（例如電商平台）使用
     * @returns string
     */
    public getCurrentSessionId(): string {
        return this.sessionId;
    }

    // #region UUID Generation
    private getOrCreateUUID(key: string): string {
        let uuid = localStorage.getItem(key);
        if (!uuid) {
            uuid = this.generateUUID();
            localStorage.setItem(key, uuid);
        }
        return uuid;
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    // #endregion

    /**
     * 管理 Session ID 的生成與過期邏輯
     * 當前會話 ID 不存在、或最後活動時間超過 SESSION_TIMEOUT_MS 時，會生成新的會話 ID。
     * 每次呼叫此方法都會更新最後活動時間。
     */
    private manageSessionId(): void {
        const sessionKey = 'aw_game_session_id';
        const lastActivityKey = 'aw_game_session_last_activity';

        const storedSessionId = localStorage.getItem(sessionKey);
        const storedLastActivity = localStorage.getItem(lastActivityKey);

        const currentTime = Date.now();

        // 判斷是否需要生成新 Session: 沒存過、或超過 30 分鐘沒活動
        const isExpired = !storedLastActivity || (currentTime - parseInt(storedLastActivity, 10) > SESSION_TIMEOUT_MS);

        if (!storedSessionId || isExpired) {
            // 生成新的會話 ID
            this.sessionId = this.generateUUID();
            localStorage.setItem(sessionKey, this.sessionId);
            console.log(`GA Session ID created/renewed: ${this.sessionId}`);
        } else {
            // 使用現有的會話 ID
            this.sessionId = storedSessionId;
        }

        // 更新最後活動時間戳記
        this.lastActivityTimestamp = currentTime;
        localStorage.setItem(lastActivityKey, this.lastActivityTimestamp.toString());
    }

    /**
     * 發送 GA 事件 (核心方法)
     *
     * @param eventName 事件名稱
     * @param params 參數
     */
    private sendEvent(eventName: string, params: object = {}): void {
        // 發送任何事件前，先檢查/更新 Session 狀態
        this.manageSessionId();

        if (EDITOR) {
            console.log(`[GA Debug] Event: ${eventName}`, params);
            return;
        }

        if (!this.gameId) {
            console.warn('GA Manager not initialized. Please call AnalyticsManager.instance.init(gameId) first.');
            return;
        }

        // 組合要傳送的完整資料物件
        const eventParams = {
            game_id: this.gameId,
            // 使用標準 GA4 參數 client_id 和 user_id 以便更好地整合
            // client_id 通常由 gtag 自動處理，但如果需要明確傳遞也可以。
            // user_id 對於跨裝置追蹤至關重要，應直接傳遞。
            custom_client_id: this.clientId, // 這是裝置專屬的 ID
            custom_user_id: this.userId, // 這是帳號專屬的 ID，用於跨裝置追蹤
            custom_session_id: this.sessionId, // 將自定義的 session_id 加入事件參數
            // 將毫秒轉為微秒 (Microseconds)
            // Date.now() 本身就是 UTC 的 Unix Timestamp
            timestamp_micros: Date.now() * 1000,
            ...params,
        };

        // TODO: 在這裡加入傳送給電商平台的邏輯
        // this.sendToEcommerceProvider(eventName, eventParams);

        if (typeof gtag === 'function') {
            gtag('event', eventName, eventParams);
            console.log(`%cGA Event: ${eventName}`, 'color: #74b9ff;', eventParams);
        } else {
            console.warn('gtag function not found. Make sure Google Analytics is loaded.');
        }
    }

    /**
    //  * 模擬傳送資料給電商平台
    //  */
    // private sendToEcommerceProvider(eventName: string, data: any): void {
    //     // 這裡可以使用 fetch 或 XMLHttpRequest 將資料 POST 給電商
    //     // 電商拿到 data.session_id 後，再轉發給 GA，就能達成你的需求
    //     console.log(`[Ecommerce] Data sent for ${eventName}:`, data);
    // }

    // #region Phase 1: Load
    public trackGameLoadStart(): void {
        const deviceInfo = getDeviceInfoSync();
        // 確保參數名稱與 GA 後台「參數名稱」欄位完全一致
        this.sendEvent('game_load_start', {
            system: deviceInfo.system || 'unknown',
            browser: deviceInfo.browser || 'unknown',
            phone_type: deviceInfo.phone_type || 'unknown',
        });
    }

    public trackGameLoadFail(reason: string): void {
        this.sendEvent('game_load_fail', { reason });
    }

    public trackGameLoadEnd(duration: number): void {
        this.sendEvent('game_load_end', { duration });
    }
    // #endregion

    // #region Phase 2: Enter
    public trackGameLoginStart(): void {
        this.sendEvent('game_login_start');
    }

    public trackGameLoginEnd(result: GameResult, reason?: string): void {
        this.sendEvent('game_login_end', { result, reason });
    }

    public trackGameEnterStart(): void {
        this.sendEvent('game_enter_start');
    }

    public trackGameEnterGame(user_balance: number): void {
        this.sendEvent('game_enter_game', { user_balance });
    }
    // #endregion

    // #region Phase 3: Game
    public trackGameFirstSpin(): void {
        this.sendEvent('game_first_spin', { isFirstSpin: true });
    }

    public trackGameBet(bet_amount: number, auto_spin: boolean): void {
        this.sendEvent('game_bet', { bet_amount, auto_spin });
    }

    public trackGameBetIncrease(bet_amount: number): void {
        this.sendEvent('game_bet_increase', { bet_amount });
    }

    public trackGameBetDecrease(bet_amount: number): void {
        this.sendEvent('game_bet_decrease', { bet_amount });
    }

    public trackGameResult(win_amount: number, trigger_feature: FeatureType): void {
        this.sendEvent('game_result', { win_amount, trigger_feature });
    }

    public trackGameTurbo(type: TurboType): void {
        this.sendEvent('game_turbo', { turboType: type });
    }

    public trackGameSkip(skipPerform: string[]): void {
        this.sendEvent('game_skip', { skipPerform });
    }

    public trackGameSpinCount(totalSpin: number, winSpin: number, featureSpin: number): void {
        this.sendEvent('game_spin_count', { totalSpin, winSpin, featureSpin });
    }

    public trackGameFeatureBuy(featureAmount: number, featureType: string): void {
        this.sendEvent('game_feature_buy', { featureAmount, featureType });
    }

    public trackGameFeatureAuto(round: number, stop_win: number, stop_lose: number, stop_feature: boolean): void {
        this.sendEvent('game_feature_auto', { round, stop_win, stop_lose, stop_feature });
    }
    // #endregion

    // #region Phase 4: Error
    public trackGameError(type: GameErrorType): void {
        const payload: any = {};
        if (type === GameErrorType.LOW_BALANCE) {
            payload.type = type;
        } else {
            payload.error_reason = type;
        }
        this.sendEvent('game_error', payload);
    }
    // #endregion

    // #region Phase 5: Exit
    public trackGameExit(reason: GameExitReason): void {
        this.sendEvent('game_exit', { reason });
    }
    // #endregion
}
