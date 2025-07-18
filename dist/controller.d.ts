import ScreenLogic from 'node-screenlogic';
import { Logger } from 'homebridge';
interface ControllerOptions {
    log: Logger;
    ip_address?: string;
    port?: number;
    username?: string;
    password?: string;
}
/**
 * config options:
 * 1. UDP broadcast to find unit:
 *   config = {}
 * 2. find unit by static IP address.
 *   config = {
 *     ip_address: "n.n.n.n",
 *     username: "Pentair: XX-XX-XX" // optional
 *   }
 * 3. login via Pentrair remote gateway
 *   config = {
 *     username: "Pentair: XX-XX-XX",
 *     password: "..."
 *   }
 */
export declare class Controller {
    static readonly SPA_CIRCUIT_ID = 500;
    static readonly POOL_CIRCUIT_ID = 505;
    static readonly HEAT_MODE_OFF = 0;
    static readonly HEAT_MODE_SOLAR = 1;
    static readonly HEAT_MODE_SOLAR_PREFERRED = 2;
    static readonly HEAT_MODE_HEAT_PUMP = 3;
    static readonly HEAT_MODE_UNCHANGED = 4;
    private readonly log;
    private readonly ip_address?;
    private readonly port?;
    private readonly username?;
    private readonly password?;
    constructor(settings: ControllerOptions);
    getPoolConfig(): Promise<PoolConfig>;
    getPoolStatus(): Promise<PoolStatus>;
    setCircuitState(circuitId: number, circuitState: boolean): Promise<void>;
    setHeatPoint(bodyType: number, heatPoint: number): Promise<void>;
    sendLightCommand(cmd: number): Promise<void>;
    setHeatMode(bodyType: number, heatMode: number): Promise<void>;
    _getPoolConfig(connection: ScreenLogic.UnitConnection): Promise<PoolConfig>;
    _setCircuitState(connection: ScreenLogic.UnitConnection, circuitId: number, circuitState: boolean): Promise<void>;
    _sendLightCommand(connection: ScreenLogic.UnitConnection, cmd: number): Promise<void>;
    _setHeatPoint(connection: ScreenLogic.UnitConnection, bodyType: number, heatPoint: number): Promise<void>;
    _setHeatMode(connection: ScreenLogic.UnitConnection, bodyType: number, heatMode: number): Promise<void>;
    _getPoolStatus(connection: ScreenLogic.UnitConnection): Promise<PoolStatus>;
    _login(connection: ScreenLogic.UnitConnection): Promise<void>;
    _getConnection(): Promise<ScreenLogic.UnitConnection>;
    /** get a connection by udp broadcast */
    _getConnectionByBroadcast(): Promise<ScreenLogic.UnitConnection>;
    /** get a connection by IP address */
    _getConnectionByIPAddress(): Promise<ScreenLogic.UnitConnection>;
    /** find a unit by remote login */
    _getConnectionByRemoteLogin(): Promise<ScreenLogic.UnitConnection>;
}
export declare class ControllerError extends Error {
}
export declare class PoolCircuit {
    readonly id: number;
    readonly name: string;
    constructor(id: number, name: string);
}
export declare class PoolConfig {
    readonly gatewayName: string;
    readonly deviceId: string;
    readonly softwareVersion: string;
    readonly isCelsius: boolean;
    readonly poolMinSetPoint: number;
    readonly poolMaxSetPoint: number;
    readonly spaMinSetPoint: number;
    readonly spaMaxSetPoint: number;
    readonly hasSpa: boolean;
    readonly hasPool: boolean;
    circuits: PoolCircuit[];
    constructor(gatewayName: string, softwareVersion: string, config: any);
}
export declare class PoolStatus {
    readonly circuitState: Map<number, number>;
    readonly hasPool: boolean;
    readonly poolTemperature: number;
    readonly poolSetPoint: number;
    readonly isPoolActive: boolean;
    readonly isPoolHeating: boolean;
    readonly poolHeatMode: number;
    readonly hasSpa: boolean;
    readonly spaTemperature: number;
    readonly spaSetPoint: number;
    readonly isSpaActive: boolean;
    readonly isSpaHeating: boolean;
    readonly spaHeatMode: number;
    readonly airTemperature: number;
    constructor(status: any);
}
export {};
//# sourceMappingURL=controller.d.ts.map