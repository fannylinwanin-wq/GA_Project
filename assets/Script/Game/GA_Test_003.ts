import { _decorator, Component, Node } from 'cc';
import { BaseGameTest } from '../BaseGameTest';
const { ccclass, property } = _decorator;

@ccclass('GA_Test_003')
export class GA_Test_003 extends BaseGameTest {
    protected override initialBalance: number = 5000;
    protected override defaultBetAmount: number = 50;
    protected override betIncreaseAmount: number = 100;
    protected override betDecreaseAmount: number = 20;
    protected override buyFeatureAmount: number = 1000;
    protected override buyFeatureType: string = 'BG';
    protected override autoSpinRounds: number = 20;

    public get gameId(): string {
        return 'game_003';
    }
}


