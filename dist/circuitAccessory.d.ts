import { PlatformAccessory, CharacteristicValue, CharacteristicSetCallback } from 'homebridge';
import { ScreenLogicPlatform, AccessoryAdaptor } from './platform';
export interface CircuitAccessoryContext {
    displayName: string;
    id: number;
}
export declare class CircuitAccessory {
    private readonly platform;
    private readonly accessory;
    static makeAdaptor(): AccessoryAdaptor<CircuitAccessory>;
    static generateUUID(platform: ScreenLogicPlatform, context: CircuitAccessoryContext): string;
    static sameContext(a: CircuitAccessoryContext, b: CircuitAccessoryContext): boolean;
    private service;
    constructor(platform: ScreenLogicPlatform, accessory: PlatformAccessory);
    get UUID(): string;
    get context(): CircuitAccessoryContext;
    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    setOn(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    updateOn(on: boolean): void;
}
//# sourceMappingURL=circuitAccessory.d.ts.map