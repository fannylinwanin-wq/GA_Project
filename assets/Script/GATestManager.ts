// d:/GA/AW-Test/AW/assets/Script/GATestManager.ts

import { _decorator, Component, Node, Button, log, Prefab, instantiate, Label } from 'cc';
import { BaseGameTest } from './BaseGameTest';

const { ccclass, property } = _decorator;

@ccclass('GATestManager')
export class GATestManager extends Component {

    @property([BaseGameTest])
    private gameTests: BaseGameTest[] = [];

    @property(Node)
    private testButtonContainer: Node = null;

    @property(Prefab)
    private buttonPrefab: Prefab = null;

    @property(Button)
    private fannyButton: Button = null;
    @property(Button)
    private jackButton: Button = null;
    @property(Button)
    private doraButton: Button = null;
    @property(Button)
    private perterButton: Button = null;

    private _selectedUserId: string = "";

    onLoad() {
        this.createTestButtons();
        this.initUserButtons();
    }

    private initUserButtons(): void {
        if (this.fannyButton) this.fannyButton.node.on(Button.EventType.CLICK, () => this.selectUser('test_user_fanny'), this);
        if (this.jackButton) this.jackButton.node.on(Button.EventType.CLICK, () => this.selectUser('test_user_jack'), this);
        if (this.doraButton) this.doraButton.node.on(Button.EventType.CLICK, () => this.selectUser('test_user_dora'), this);
        if (this.perterButton) this.perterButton.node.on(Button.EventType.CLICK, () => this.selectUser('test_user_perter'), this);
    }

    private selectUser(userId: string): void {
        this._selectedUserId = userId;
        log(`[GATestManager] Selected User ID: ${userId}`);
    }

    private createTestButtons(): void {
        if (!this.testButtonContainer) return;

        log('Creating test buttons...');
        this.testButtonContainer.removeAllChildren();

        this.gameTests.forEach(testInstance => {
            if (testInstance) {
                const gameId = testInstance.gameId;
                const buttonNode = instantiate(this.buttonPrefab);
                const label = buttonNode.getComponentInChildren(Label);
                if (label) {
                    label.string = `${gameId}`;
                }

                // 取得已存在的 Button 元件，不要重複添加
                const button = buttonNode.getComponent(Button);
                if (button) {
                    // 使用 Button 的標準事件綁定方式
                    button.node.off('click'); // 先移除可能存在的舊監聽
                    button.node.on('click', () => {
                        this.startTestFor(gameId);
                    }, this);
                }

                this.testButtonContainer.addChild(buttonNode);
            }
        });
    }

    public startTestFor(gameId: string): void {
        const testInstance = this.gameTests.find(t => t.gameId === gameId);
        if (testInstance) {
            if (!this._selectedUserId) {
                log(`[GATestManager] Warning: No User ID selected. Please select a user first.`);
                return;
            }
            log(`Manager: Starting test for ${gameId}`);
            testInstance.runFullTestFlow(this._selectedUserId);
        } else {
            log(`Manager: No test instance found for ${gameId}`);
        }
    }
}