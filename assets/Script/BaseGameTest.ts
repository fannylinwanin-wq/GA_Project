// d:/GA/AW-Test/AW/assets/Script/BaseGameTest.ts

import { _decorator, Button, Component, log } from 'cc';
import { AnalyticsManager, GameResult, FeatureType, TurboType, GameErrorType, GameExitReason } from './AnalyticsManager';

const { ccclass, property } = _decorator;

@ccclass('BaseGameTest')
export abstract class BaseGameTest extends Component {

    @property(Button)
    private fannyButton: Button = null;
    @property(Button)
    private jackButton: Button = null;
    @property(Button)
    private doraButton: Button = null;
    @property(Button)
    private perterButton: Button = null;






    // 強制子類別必須提供 gameId
    public abstract get gameId(): string;

    // #region 可被子類別覆寫的參數
    protected initialBalance: number = 10000;
    protected defaultBetAmount: number = 100;
    protected betIncreaseAmount: number = 200;
    protected betDecreaseAmount: number = 50;
    protected buyFeatureAmount: number = 5000;
    protected buyFeatureType: string = 'FG2';
    protected autoSpinRounds: number = 100;
    // #endregion

    // #region 內部狀態
    private totalSpin: number = 0;
    private winSpin: number = 0;
    private featureSpin: number = 0;
    private skipQueue: string[] = [];
    private loadStartTime: number = 0;
    private _currentTestUserId: string = ""; // 用於存放當前測試的 User ID
    // #endregion

    /**
     * 執行完整的測試流程
     * @param userId 必須傳入，由 GATestManager 提供
     */
    public runFullTestFlow(userId: string): void {
        if (!userId) {
            log(`[${this.gameId}] Error: userId is required for runFullTestFlow.`);
            return;
        }
        log(`====== Running Full Test Flow for ${this.gameId} ======`);
        this.resetState();
        this._currentTestUserId = userId; // Store the userId for use in enterGameFlow
        AnalyticsManager.instance.init(this.gameId);
        this.loadFlow();
    }

    /**
     * 公開方法：手動設定測試用的 User ID
     * @param id 使用者 ID
     */
    // Removed: User ID is now managed by GATestManager and passed directly.

    private resetState(): void {
        this.totalSpin = 0;
        this.winSpin = 0;
        this.featureSpin = 0;
        this.skipQueue = [];
    }

    // 1. 載入流程
    private async loadFlow(): Promise<void> {
        this.loadStartTime = Date.now();
        AnalyticsManager.instance.trackGameLoadStart();
        await this.delay(2000); // 模擬載入時間
        const loadDuration = Date.now() - this.loadStartTime;
        AnalyticsManager.instance.trackGameLoadEnd(loadDuration);
        this.enterGameFlow();
    }

    // 2. 進入流程
    private async enterGameFlow(): Promise<void> {
        await this.delay(1000);
        AnalyticsManager.instance.trackGameLoginStart();
        await this.delay(2000);

        // Set the User ID that was passed to runFullTestFlow
        AnalyticsManager.instance.setUserId(this._currentTestUserId);
        // Client ID is managed by AnalyticsManager itself, unless a backend provides a specific one.
        // For testing, let AnalyticsManager handle its own clientId.
        // If a mock backend clientId is truly needed, it should be device-specific and not game-specific.
        // const currentClientId = AnalyticsManager.instance.getClientId();
        // const mockBackendClientId = `backend_device_${currentClientId.substring(0, 8)}`;
        // AnalyticsManager.instance.setClientId(mockBackendClientId);

        AnalyticsManager.instance.trackGameLoginEnd(GameResult.SUCCESS);

        await this.delay(1000);
        AnalyticsManager.instance.trackGameEnterStart();
        AnalyticsManager.instance.trackGameEnterGame(this.initialBalance);

        // 進入遊戲後，開始自動化的遊戲流程
        this.startGameplayFlow();

    }

    // 3. 遊戲流程
    private async startGameplayFlow(): Promise<void> {
        log('--- Gameplay Flow Start ---');

        // 首次 Spin
        await this.delay(1000);
        log('Action: First Spin');
        this.simulateSpin();

        // 調整押注
        await this.delay(2000);
        log('Action: Adjust Bet');
        AnalyticsManager.instance.trackGameBetIncrease(this.betIncreaseAmount);
        await this.delay(500);
        AnalyticsManager.instance.trackGameBetDecrease(this.betDecreaseAmount);

        // 開啟 Turbo
        await this.delay(1000);
        log('Action: Turbo On');
        AnalyticsManager.instance.trackGameTurbo(TurboType.TURBO1);

        // 第二次 Spin (帶 Skip)
        await this.delay(1000);
        log('Action: Skip Animation');
        this.skipQueue.push('big_win_animation');
        log('Action: Second Spin');
        this.simulateSpin();

        // // 購買特色
        // await this.delay(3000);
        // log('Action: Buy Feature');
        // AnalyticsManager.instance.trackGameFeatureBuy(this.buyFeatureAmount, this.buyFeatureType);

        // // 自動遊玩
        // await this.delay(1000);
        // log('Action: Auto Spin');
        // AnalyticsManager.instance.trackGameFeatureAuto(this.autoSpinRounds, 0, 0, false);

        // // 模擬異常
        // await this.delay(1000);
        // log('Action: Trigger Low Balance Error');
        // AnalyticsManager.instance.trackGameError(GameErrorType.LOW_BALANCE);

        // // 退出
        // await this.delay(2000);
        // log('Action: Exit Game');
        // AnalyticsManager.instance.trackGameExit(GameExitReason.MANUAL);

        const rounds = 10 + Math.floor(Math.random() * 11);
        log(`Action: Simulate ${rounds} Spins`);

        for (let i = 0; i < rounds; i++) {
            this.simulateSpin();
            await this.delay(2000);
        }

        log(`====== Test Flow for ${this.gameId} Finished ======`);
    }

    private simulateSpin(): void {
        const firstSpinKey = `is_first_spin_${this.gameId}_${this._currentTestUserId}`;
        const hasSpinBefore = localStorage.getItem(firstSpinKey);
        if (!hasSpinBefore) {
            AnalyticsManager.instance.trackGameFirstSpin();
            localStorage.setItem(firstSpinKey, 'true');
        }

        AnalyticsManager.instance.trackGameBet(this.defaultBetAmount, false);
        this.totalSpin++;

        setTimeout(() => {
            const isWin = Math.random() > 0.5;
            const isFeature = Math.random() > 0.8;
            let winAmount = 0;
            let featureType = FeatureType.NONE;

            if (isWin) {
                winAmount = Math.floor(Math.random() * 1000);
                this.winSpin++;
            }
            if (isFeature) {
                featureType = FeatureType.FG;
                this.featureSpin++;
            }

            const animationDuration = 1500;
            setTimeout(() => {
                this.roundEnd(winAmount, featureType);
            }, animationDuration);

        }, 300);
    }

    private roundEnd(winAmount: number, featureType: FeatureType): void {
        log('--- Round End ---');
        AnalyticsManager.instance.trackGameResult(winAmount, featureType);

        if (this.skipQueue.length > 0) {
            AnalyticsManager.instance.trackGameSkip(this.skipQueue);
            this.skipQueue = [];
        }

        // 發送該局的增量（不是累積值）
        const isWin = winAmount > 0 ? 1 : 0;
        const isFeature = featureType !== FeatureType.NONE ? 1 : 0;
        AnalyticsManager.instance.trackGameSpinCount(1, isWin, isFeature);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}