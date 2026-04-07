import { _decorator, Component, Node } from 'cc';
import { BaseGameTest } from '../BaseGameTest';
const { ccclass, property } = _decorator;

@ccclass('GA_Test_0')
export class GA_Test_034 extends BaseGameTest {

    protected override initialBalance: number = 5000000;
    protected override defaultBetAmount: number = 200;
    protected override betIncreaseAmount: number = 300;
    protected override betDecreaseAmount: number = 100;
    protected override buyFeatureAmount: number = 2000;
    protected override buyFeatureType: string = 'FG1';
    protected override autoSpinRounds: number = 50;

    public get gameId(): string {
        return 'game_034';
    }
}


