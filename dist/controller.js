"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolStatus = exports.PoolConfig = exports.PoolCircuit = exports.ControllerError = exports.Controller = void 0;
const node_screenlogic_1 = __importDefault(require("node-screenlogic"));
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
class Controller {
    constructor(settings) {
        this.log = settings.log;
        this.ip_address = settings.ip_address;
        this.port = settings.port;
        this.username = settings.username;
        this.password = settings.password;
    }
    async getPoolConfig() {
        const connection = await this._getConnection();
        try {
            await this._login(connection);
            return await this._getPoolConfig(connection);
        }
        finally {
            connection.close();
        }
    }
    async getPoolStatus() {
        const connection = await this._getConnection();
        try {
            await this._login(connection);
            return await this._getPoolStatus(connection);
        }
        finally {
            connection.close();
        }
    }
    async setCircuitState(circuitId, circuitState) {
        const connection = await this._getConnection();
        try {
            await this._login(connection);
            return await this._setCircuitState(connection, circuitId, circuitState);
        }
        finally {
            connection.close();
        }
    }
    async setHeatPoint(bodyType, heatPoint) {
        const connection = await this._getConnection();
        try {
            await this._login(connection);
            return await this._setHeatPoint(connection, bodyType, heatPoint);
        }
        finally {
            connection.close();
        }
    }
    async sendLightCommand(cmd) {
        const connection = await this._getConnection();
        try {
            await this._login(connection);
            return await this._sendLightCommand(connection, cmd);
        }
        finally {
            connection.close();
        }
    }
    async setHeatMode(bodyType, heatMode) {
        const connection = await this._getConnection();
        try {
            await this._login(connection);
            return await this._setHeatMode(connection, bodyType, heatMode);
        }
        finally {
            connection.close();
        }
    }
    async _getPoolConfig(connection) {
        let softwareVersion = '';
        return new Promise((resolve, reject) => {
            connection
                .once('version', version => {
                softwareVersion = version.version;
                connection.getControllerConfig();
            })
                .once('controllerConfig', poolConfig => {
                this.log.debug('controllerConfig', poolConfig);
                resolve(new PoolConfig(connection.gatewayName, softwareVersion, poolConfig));
            })
                .on('error', err => {
                reject(err);
            });
            connection.getVersion();
        });
    }
    async _setCircuitState(connection, circuitId, circuitState) {
        return new Promise((resolve, reject) => {
            connection
                .once('circuitStateChanged', () => {
                resolve();
            })
                .once('badParameter', () => {
                reject(new ControllerError('bad parameter passed to set command'));
            })
                .on('error', err => {
                reject(err);
            });
            connection.setCircuitState(0, circuitId, circuitState ? 1 : 0);
        });
    }
    async _sendLightCommand(connection, cmd) {
        return new Promise((resolve, reject) => {
            connection
                .once('sentLightCommand', () => {
                resolve();
            })
                .once('badParameter', () => {
                reject(new ControllerError('bad parameter passed to send light command'));
            })
                .on('error', err => {
                reject(err);
            });
            connection.sendLightCommand(0, cmd);
        });
    }
    async _setHeatPoint(connection, bodyType, heatPoint) {
        return new Promise((resolve, reject) => {
            connection
                .once('setPointChanged', () => {
                resolve();
            })
                .once('badParameter', () => {
                reject(new ControllerError('bad parameter passed to set command'));
            })
                .on('error', err => {
                reject(err);
            });
            connection.setSetPoint(0, bodyType, heatPoint);
        });
    }
    async _setHeatMode(connection, bodyType, heatMode) {
        return new Promise((resolve, reject) => {
            connection
                .once('heatModeChanged', () => {
                resolve();
            })
                .once('badParameter', () => {
                reject(new ControllerError('bad parameter passed to set command'));
            })
                .on('error', err => {
                reject(err);
            });
            connection.setHeatMode(0, bodyType, heatMode);
        });
    }
    async _getPoolStatus(connection) {
        return new Promise((resolve, reject) => {
            connection
                .once('poolStatus', status => {
                //this.log.debug('poolStatus', status)
                resolve(new PoolStatus(status));
            })
                .on('error', err => {
                reject(err);
            });
            connection.getPoolStatus();
        });
    }
    async _login(connection) {
        return new Promise((resolve, reject) => {
            connection
                .once('loggedIn', () => {
                resolve();
            })
                .once('loginFailed', () => {
                reject(new ControllerError('unable to login'));
            })
                .on('error', err => {
                reject(err);
            });
            connection.connect();
        });
    }
    async _getConnection() {
        if (this.ip_address) {
            return this._getConnectionByIPAddress();
        }
        else if (this.username && this.password) {
            return this._getConnectionByRemoteLogin();
        }
        else {
            return this._getConnectionByBroadcast();
        }
    }
    /** get a connection by udp broadcast */
    async _getConnectionByBroadcast() {
        return new Promise((resolve, reject) => {
            const finder = new node_screenlogic_1.default.FindUnits();
            finder
                .on('serverFound', server => {
                finder.close();
                const connection = new node_screenlogic_1.default.UnitConnection(server);
                connection.gatewayName = server.gatewayName;
                resolve(connection);
            })
                .on('error', err => {
                reject(err);
            });
            finder.search();
        });
    }
    /** get a connection by IP address */
    async _getConnectionByIPAddress() {
        return new Promise((resolve, _reject) => {
            var _a;
            const connection = new node_screenlogic_1.default.UnitConnection(this.port || 80, this.ip_address, this.password);
            connection.gatewayName = (_a = this.username) !== null && _a !== void 0 ? _a : 'Pentair: XX-XX-XX';
            resolve(connection);
        });
    }
    /** find a unit by remote login */
    async _getConnectionByRemoteLogin() {
        return new Promise((resolve, reject) => {
            const remote = new node_screenlogic_1.default.RemoteLogin(this.username);
            remote
                .on('gatewayFound', unit => {
                remote.close();
                if (unit && unit.gatewayFound) {
                    const connection = new node_screenlogic_1.default.UnitConnection(unit.port, unit.ipAddr, this.password);
                    connection.gatewayName = this.username;
                    resolve(connection);
                }
                else {
                    reject(new ControllerError('no remote unit found'));
                }
            })
                .on('error', (err) => {
                reject(err);
            });
            remote.connect();
        });
    }
}
exports.Controller = Controller;
Controller.SPA_CIRCUIT_ID = 500;
Controller.POOL_CIRCUIT_ID = 505;
Controller.HEAT_MODE_OFF = 0;
Controller.HEAT_MODE_SOLAR = 1;
Controller.HEAT_MODE_SOLAR_PREFERRED = 2;
Controller.HEAT_MODE_HEAT_PUMP = 3;
Controller.HEAT_MODE_UNCHANGED = 4;
class ControllerError extends Error {
}
exports.ControllerError = ControllerError;
class PoolCircuit {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}
exports.PoolCircuit = PoolCircuit;
class PoolConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(gatewayName, softwareVersion, config) {
        var _a, _b, _c, _d;
        this.circuits = [];
        this.gatewayName = gatewayName;
        this.deviceId = gatewayName.replace('Pentair: ', '');
        this.softwareVersion = softwareVersion;
        this.isCelsius = config.degC;
        this.poolMinSetPoint = (_a = config.minSetPoint[0]) !== null && _a !== void 0 ? _a : 0;
        this.poolMaxSetPoint = (_b = config.maxSetPoint[0]) !== null && _b !== void 0 ? _b : 0;
        this.spaMinSetPoint = (_c = config.minSetPoint[1]) !== null && _c !== void 0 ? _c : 0;
        this.spaMaxSetPoint = (_d = config.maxSetPoint[1]) !== null && _d !== void 0 ? _d : 0;
        this.hasSpa = false;
        this.hasPool = false;
        this.circuits = [];
        for (const circuit of config.bodyArray) {
            const poolCircuit = new PoolCircuit(circuit.circuitId, circuit.name);
            this.circuits.push(poolCircuit);
            if (poolCircuit.id === Controller.POOL_CIRCUIT_ID) {
                this.hasPool = true;
            }
            else if (poolCircuit.id === Controller.SPA_CIRCUIT_ID) {
                this.hasSpa = true;
            }
        }
    }
}
exports.PoolConfig = PoolConfig;
class PoolStatus {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(status) {
        this.circuitState = new Map();
        // save circuit state
        this.circuitState = new Map();
        for (const circuit of status.circuitArray) {
            this.circuitState.set(circuit.id, circuit.state);
        }
        this.hasPool = this.circuitState.get(Controller.POOL_CIRCUIT_ID) !== undefined;
        this.hasSpa = this.circuitState.get(Controller.SPA_CIRCUIT_ID) !== undefined;
        this.poolTemperature = status.currentTemp[0];
        this.poolSetPoint = status.setPoint[0];
        this.isPoolActive = this.hasPool && status.isPoolActive();
        this.isPoolHeating = this.hasPool && status.heatStatus[0] !== 0;
        this.poolHeatMode = status.heatMode[0];
        this.spaTemperature = status.currentTemp[1];
        this.spaSetPoint = status.setPoint[1];
        this.isSpaActive = this.hasSpa && status.isSpaActive();
        this.isSpaHeating = this.hasSpa && status.heatStatus[1] !== 0;
        this.spaHeatMode = status.heatMode[1];
        this.airTemperature = status.airTemp;
    }
}
exports.PoolStatus = PoolStatus;
//# sourceMappingURL=controller.js.map