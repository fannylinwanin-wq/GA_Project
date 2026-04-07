import { _decorator, Component, Node } from 'cc';
import { BaseGameTest } from '../BaseGameTest';
const { ccclass, property } = _decorator;

@ccclass('GA_Test_002')
export class GA_Test_002 extends BaseGameTest {
    protected override initialBalance: number = 10000000;
    protected override defaultBetAmount: number = 500;
    protected override betIncreaseAmount: number = 1000;
    protected override betDecreaseAmount: number = 400;
    protected override buyFeatureAmount: number = 10000;
    protected override buyFeatureType: string = 'FG';
    protected override autoSpinRounds: number = 200;

    public get gameId(): string {
        return 'game_002';
    }
}


