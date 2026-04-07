import { _decorator, Button, Component, Node, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    private _sessionStartTime: number = 0;
    private _deviceId: string = '';

    @property(Button)
    private startButton: Button = null;


    onLoad() {
        this._sessionStartTime = Date.now();
        this._getOrGenerateDeviceId();
        console.log("Slot 遊戲開始計時");

        // 監聽瀏覽器關閉或跳轉事件
        window.addEventListener('beforeunload', () => {
            this.sendFinalStayTime();
        });

        // (選擇性) 監聽玩家切換分頁，Slot 遊戲通常建議記錄真實看著螢幕的時間
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                console.log("玩家切換分頁/縮小視窗");
            }
        });
    }

    private _getOrGenerateDeviceId() {
        const DEVICE_ID_KEY = 'unique_device_id';
        let deviceId = sys.localStorage.getItem(DEVICE_ID_KEY);

        if (!deviceId) {
            deviceId = this._generateUUID();
            sys.localStorage.setItem(DEVICE_ID_KEY, deviceId);
            console.log('Generated new device ID:', deviceId);
        } else {
            console.log('Found existing device ID:', deviceId);
        }
        this._deviceId = deviceId;
    }

    private _generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private sendFinalStayTime() {
        const stayTimeSeconds = Math.floor((Date.now() - this._sessionStartTime) / 1000);

        if (typeof (window as any).gtag === 'function') {
            // 使用 event 傳送總停留秒數
            (window as any).gtag('event', 'slot_session_duration', {
                'duration_seconds': stayTimeSeconds,
                'game_type': 'Slot_Classic', // 可以區分不同的 Slot 機器
                'device_id': this._deviceId
            });

            // 注意：瀏覽器關閉時 gtag 可能來不及送出，
            // 實務上 GA4 的 gtag 會有自動重試機制，或是你可以改用 sendBeacon
        }
    }


    start() {
        this.startButton.node.on(Button.EventType.CLICK, this.onStartButtonClick, this);
    }

    private onStartButtonClick() {
        // 直接在方法內使用
        const gtag = (window as any).gtag;

        if (typeof gtag === 'function') {
            gtag('event', 'game_start', {
                'event_category': 'User Action',
                'event_label': 'Start Button Clicked',
                'device_id': this._deviceId
            });
        }
        console.log('Start button clicked, event sent to Google Analytics');
    }

    protected onDestroy(): void {
        this.startButton.node.off(Button.EventType.CLICK, this.onStartButtonClick, this);
    }
}


