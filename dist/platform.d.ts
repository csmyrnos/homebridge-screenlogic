import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, WithUUID, Characteristic } from 'homebridge';
import { CircuitAccessoryContext } from './circuitAccessory';
import { ThermostatAccessoryContext } from './thermostatAccessory';
import { SetColorAccessoryContext } from './setColorAccessory';
declare type CharacteristicType = WithUUID<{
    new (): Characteristic;
}>;
export interface AccessoryAdaptor<T> {
    generateUUID(platform: ScreenLogicPlatform, context: Record<string, any>): string;
    sameContext(a: Record<string, any>, b: Record<string, any>): boolean;
    factory(platform: ScreenLogicPlatform, accessory: PlatformAccessory): T;
}
export interface ScreenLogicPlatformConfig extends PlatformConfig {
    ip_address?: string;
    port?: number;
    username?: string;
    password?: string;
    hidePoolTemperatureSensor: boolean;
    hideSpaTemperatureSensor: boolean;
    hideAirTemperatureSensor: boolean;
    hidePoolThermostat: boolean;
    hideSpaThermostat: boolean;
    statusPollingSeconds: number;
    createLightColorSwitches: boolean;
    disabledLightColors: [string];
}
/**npm
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export declare class ScreenLogicPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    private restoredAccessories;
    private controller;
    config: ScreenLogicPlatformConfig;
    private poolConfig?;
    private lastRefreshTime;
    private poolTempAccessory?;
    private spaTempAccessory?;
    private airTempAccessory?;
    private poolThermostatAccessory?;
    private spaThermostatAccessory?;
    private circuitAccessories;
    constructor(log: Logger, config: PlatformConfig, api: API);
    private discoverDevices;
    private setupDiscoveredAccessories;
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory): void;
    private configureAccessoryType;
    /** start polling process with truncated exponential backoff: https://cloud.google.com/storage/docs/exponential-backoff */
    private pollForStatus;
    /** gets status,  updates accessories, and resolves */
    private refreshStatus;
    private updateAccessories;
    /** refresh if cached values are "stale" */
    private refreshIfNeeded;
    /** convenience function to add an `on('get')` handler which refreshes accessory values if needed  */
    triggersRefreshIfNeded(service: Service, type: CharacteristicType): void;
    setTargetTemperature(context: ThermostatAccessoryContext, temperature: number): void;
    setTargetHeatingCoolingState(context: ThermostatAccessoryContext, state: number): void;
    setCircuitState(context: CircuitAccessoryContext, state: boolean): void;
    sendLightCommand(_context: SetColorAccessoryContext, cmd: number): void;
    generateUUID(accessorySalt: string): string;
    private backoff;
    accessoryInfo(): {
        manufacturer: string;
        model: string;
        serialNumber: string;
    };
    private applyConfigDefaults;
    /** normalize temperature to celsius for homekit */
    normalizeTemperature(temperature: number): number;
    /** map pool heat mode to thermostat target heating/coooling state  */
    mapHeatModeToTargetHeatingCoolingState(poolHeatMode: number): 1 | 0 | 2 | 3;
    /** map thermostat target heating/coooling state to pool heat mode */
    mapTargetHeatingCoolingStateToHeatMode(targetHeatingCoolingState: number): 1 | 0 | 2 | 3 | 4;
}
export {};
//# sourceMappingURL=platform.d.ts.map