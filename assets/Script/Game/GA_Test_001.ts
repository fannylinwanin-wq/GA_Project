// d:/GA/AW-Test/AW/assets/Script/Game001/GA_Test_001.ts

import { _decorator } from 'cc';
import { BaseGameTest } from '../BaseGameTest';

const { ccclass } = _decorator;

@ccclass('GA_Test_001')
export class GA_Test_001 extends BaseGameTest {

    // protected start(): void {
    //     this.setTestUserId('test_user_001'); // 為這個測試設定一個固定的 User ID
    // }

    public get gameId(): string {
        return 'game_001';
    }

    // 如果 Game001 有特殊參數，可以在這裡覆寫
    // protected defaultBetAmount: number = 150; 
}