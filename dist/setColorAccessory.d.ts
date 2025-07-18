import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback } from 'homebridge';
import { ScreenLogicPlatform, AccessoryAdaptor } from './platform';
export interface SetColorAccessoryContext {
    displayName: string;
    id: number;
}
export declare class SetColorAccessory {
    private readonly platform;
    private readonly accessory;
    static makeAdaptor(): AccessoryAdaptor<SetColorAccessory>;
    static generateUUID(platform: ScreenLogicPlatform, context: SetColorAccessoryContext): string;
    static sameContext(a: SetColorAccessoryContext, b: SetColorAccessoryContext): boolean;
    constructor(platform: ScreenLogicPlatform, accessory: PlatformAccessory);
    get UUID(): string;
    get context(): SetColorAccessoryContext;
    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    setOn(service: Service, value: CharacteristicValue, callback: CharacteristicSetCallback, colorConfig: {
        name: string;
        cmd: number;
    }): void;
}
//# sourceMappingURL=setColorAccessory.d.ts.map