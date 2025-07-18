import { PlatformAccessory, CharacteristicValue, CharacteristicSetCallback } from 'homebridge';
import { ScreenLogicPlatform, AccessoryAdaptor } from './platform';
export interface ThermostatAccessoryContext {
    displayName: string;
    bodyType: number;
    minSetPoint: number;
    maxSetPoint: number;
}
export declare class ThermostatAccessory {
    private readonly platform;
    private readonly accessory;
    static makeAdaptor(): AccessoryAdaptor<ThermostatAccessory>;
    static generateUUID(platform: ScreenLogicPlatform, context: ThermostatAccessoryContext): string;
    static sameContext(a: ThermostatAccessoryContext, b: ThermostatAccessoryContext): boolean;
    private service;
    constructor(platform: ScreenLogicPlatform, accessory: PlatformAccessory);
    get UUID(): string;
    private get context();
    setTargetTemperature(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    setTargetHeatingCoolingState(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    updateCurrentTemperature(temperature: number): void;
    updateTargetTemperature(temperature: number): void;
    updateCurrentHeatingCoolingState(state: number): void;
    updateTargetHeatingCoolingState(state: number): void;
}
//# sourceMappingURL=thermostatAccessory.d.ts.map