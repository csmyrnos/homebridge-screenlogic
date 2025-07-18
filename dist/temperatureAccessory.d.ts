import { PlatformAccessory } from 'homebridge';
import { ScreenLogicPlatform, AccessoryAdaptor } from './platform';
export declare type TemperatureAccessoryContext = Record<'displayName' | 'type', string>;
export declare class TemperatureAccessory {
    private readonly platform;
    private readonly accessory;
    static makeAdaptor(): AccessoryAdaptor<TemperatureAccessory>;
    static generateUUID(platform: ScreenLogicPlatform, context: TemperatureAccessoryContext): string;
    static sameContext(a: TemperatureAccessoryContext, b: TemperatureAccessoryContext): boolean;
    private service;
    constructor(platform: ScreenLogicPlatform, accessory: PlatformAccessory);
    get UUID(): string;
    private get context();
    updateCurrentTemperature(temperature: number): void;
    updateStatusActive(active: boolean): void;
}
//# sourceMappingURL=temperatureAccessory.d.ts.map