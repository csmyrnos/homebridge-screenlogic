"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenLogicPlatform = void 0;
const settings_1 = require("./settings");
const temperatureAccessory_1 = require("./temperatureAccessory");
const circuitAccessory_1 = require("./circuitAccessory");
const thermostatAccessory_1 = require("./thermostatAccessory");
const setColorAccessory_1 = require("./setColorAccessory");
const controller_1 = require("./controller");
const POOL_TEMP_NAME = 'Pool';
const SPA_TEMP_NAME = 'Spa';
const AIR_TEMP_NAME = 'Air';
const POOL_THERMOSTAT_NAME = 'Pool Heater';
const SPA_THERMOSTAT_NAME = 'Spa Heater';
/**npm
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
class ScreenLogicPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        // this is used to track restored cached accessories
        this.restoredAccessories = [];
        // the time (from Date.now()) when we last initiated or did a refresh
        this.lastRefreshTime = 0;
        this.circuitAccessories = [];
        this.log.debug('Finished initializing platform', settings_1.PLATFORM_NAME);
        this.config = config;
        // do this first to make sure we have proper defaults moving forward
        this.applyConfigDefaults(config);
        this.controller = new controller_1.Controller({
            log: this.log,
            ip_address: this.config.ip_address,
            port: this.config.port,
            username: this.config.username,
            password: this.config.password,
        });
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', () => {
            log.debug('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            this.discoverDevices(0);
        });
    }
    discoverDevices(retryAttempt) {
        // test
        this.log.info('discoverDevices');
        const pollingInterval = 60; // TODO: get from config
        this.controller
            .getPoolConfig()
            .then(config => {
            this.poolConfig = config;
            this.log.debug('got pool config', this.poolConfig);
            this.log.info(`discoverDevices connected: ${this.poolConfig.deviceId} ${this.poolConfig.softwareVersion}`);
            this.setupDiscoveredAccessories(this.poolConfig);
        })
            .catch(err => {
            // on error, start another timeout with backoff
            const timeout = this.backoff(retryAttempt, pollingInterval);
            this.log.error(`discoverDevices retryAttempt: ${retryAttempt} timeout: ${timeout} error: ${err}`);
            setTimeout(() => this.discoverDevices(retryAttempt + 1), timeout * 1000);
        });
    }
    setupDiscoveredAccessories(poolConfig) {
        // this is used to track active accessories uuids
        const activeAccessories = new Set();
        // make pool temperature sensor if needed
        if (poolConfig.hasPool && !this.config.hidePoolTemperatureSensor) {
            this.poolTempAccessory = this.configureAccessoryType(temperatureAccessory_1.TemperatureAccessory.makeAdaptor(), {
                displayName: POOL_TEMP_NAME,
                type: POOL_TEMP_NAME,
            });
            activeAccessories.add(this.poolTempAccessory.UUID);
        }
        // make spa temperature sensor if needed
        if (poolConfig.hasSpa && !this.config.hideSpaTemperatureSensor) {
            this.spaTempAccessory = this.configureAccessoryType(temperatureAccessory_1.TemperatureAccessory.makeAdaptor(), {
                displayName: SPA_TEMP_NAME,
                type: SPA_TEMP_NAME,
            });
            activeAccessories.add(this.spaTempAccessory.UUID);
        }
        // make air temperature sensor if needed
        if (!this.config.hideAirTemperatureSensor) {
            this.airTempAccessory = this.configureAccessoryType(temperatureAccessory_1.TemperatureAccessory.makeAdaptor(), {
                displayName: AIR_TEMP_NAME,
                type: AIR_TEMP_NAME,
            });
            activeAccessories.add(this.airTempAccessory.UUID);
        }
        // make pool thermostat if needed
        if (poolConfig.hasPool && !this.config.hidePoolThermostat) {
            this.poolThermostatAccessory = this.configureAccessoryType(thermostatAccessory_1.ThermostatAccessory.makeAdaptor(), {
                displayName: POOL_THERMOSTAT_NAME,
                bodyType: 0,
                minSetPoint: this.normalizeTemperature(poolConfig.poolMinSetPoint),
                maxSetPoint: this.normalizeTemperature(poolConfig.poolMaxSetPoint),
            });
            activeAccessories.add(this.poolThermostatAccessory.UUID);
        }
        // make spa thermostat if needed
        if (poolConfig.hasSpa && !this.config.hideSpaThermostat) {
            this.spaThermostatAccessory = this.configureAccessoryType(thermostatAccessory_1.ThermostatAccessory.makeAdaptor(), {
                displayName: SPA_THERMOSTAT_NAME,
                bodyType: 1,
                minSetPoint: this.normalizeTemperature(poolConfig.spaMinSetPoint),
                maxSetPoint: this.normalizeTemperature(poolConfig.spaMaxSetPoint),
            });
            activeAccessories.add(this.spaThermostatAccessory.UUID);
        }
        // filter out hidden circuits
        const hiddenNames = this.config.hidden_circuits || '';
        const hiddenCircuits = new Set(hiddenNames.split(',').map(item => item.trim()));
        poolConfig.circuits = poolConfig.circuits.filter(circuit => {
            return !hiddenCircuits.has(circuit.name);
        });
        for (const circuit of poolConfig.circuits) {
            const accessory = this.configureAccessoryType(circuitAccessory_1.CircuitAccessory.makeAdaptor(), {
                displayName: circuit.name,
                id: circuit.id,
            });
            this.circuitAccessories.push(accessory);
            activeAccessories.add(accessory.UUID);
        }
        if (this.config.createLightColorSwitches) {
            const accessory = this.configureAccessoryType(setColorAccessory_1.SetColorAccessory.makeAdaptor(), {
                displayName: 'Light Colors',
                id: 1,
            });
            activeAccessories.add(accessory.UUID);
        }
        // unregister orphaned accessories
        const staleAccessories = this.restoredAccessories.filter(accessory => !activeAccessories.has(accessory.UUID));
        if (staleAccessories.length) {
            const staleNames = staleAccessories.map(accessory => accessory.displayName);
            this.log.info('unregistering accessories', staleNames);
            this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, staleAccessories);
        }
        // start polling for status
        this.pollForStatus(0);
    }
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.restoredAccessories.push(accessory);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configureAccessoryType(adaptor, context) {
        // generate a unique id for this shade based on context
        const uuid = adaptor.generateUUID(this, context);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.restoredAccessories.find(accessory => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
            // update the context if it has changed
            if (!adaptor.sameContext(context, existingAccessory.context)) {
                existingAccessory.context = context;
                this.log.info('Updating existing accessory:', context.displayName);
                this.api.updatePlatformAccessories([existingAccessory]);
            }
            // create the accessory handler for the restored accessory
            // this is imported from `platformAccessory.ts`
            return adaptor.factory(this, existingAccessory);
        }
        else {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', context.displayName);
            // create a new accessory
            const accessory = new this.api.platformAccessory(context.displayName, uuid);
            // store a copy of the device object in the `accessory.context`
            accessory.context = context;
            // create the accessory handler for the newly create accessory
            const newAccessory = adaptor.factory(this, accessory);
            // link the accessory to platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            return newAccessory;
        }
    }
    /** start polling process with truncated exponential backoff: https://cloud.google.com/storage/docs/exponential-backoff */
    pollForStatus(retryAttempt) {
        const pollingInterval = this.config.statusPollingSeconds;
        this.refreshStatus()
            .then(() => {
            // on success, start another timeout at normal pollingInterval
            this.log.debug('_pollForStatus success, retryAttempt:', retryAttempt);
            setTimeout(() => this.pollForStatus(0), pollingInterval * 1000);
        })
            .catch(err => {
            // on error, start another timeout with backoff
            const timeout = this.backoff(retryAttempt, pollingInterval);
            this.log.error('_pollForStatus retryAttempt:', retryAttempt, 'timeout:', timeout, err);
            setTimeout(() => this.pollForStatus(retryAttempt + 1), timeout * 1000);
        });
    }
    /** gets status,  updates accessories, and resolves */
    async refreshStatus() {
        var _a;
        try {
            this.lastRefreshTime = Date.now();
            const poolStatus = await this.controller.getPoolStatus();
            this.log.debug('connected:', (_a = this.poolConfig) === null || _a === void 0 ? void 0 : _a.deviceId, '(getStatus)');
            // update all values
            this.updateAccessories(poolStatus, undefined);
            return null;
        }
        catch (err) {
            this.updateAccessories(undefined, err);
            throw err;
        }
    }
    updateAccessories(status, _err) {
        var _a, _b, _c, _d, _e, _f;
        if (status) {
            (_a = this.airTempAccessory) === null || _a === void 0 ? void 0 : _a.updateCurrentTemperature(this.normalizeTemperature(status.airTemperature));
            (_b = this.airTempAccessory) === null || _b === void 0 ? void 0 : _b.updateStatusActive(true);
            (_c = this.poolTempAccessory) === null || _c === void 0 ? void 0 : _c.updateCurrentTemperature(this.normalizeTemperature(status.poolTemperature));
            (_d = this.poolTempAccessory) === null || _d === void 0 ? void 0 : _d.updateStatusActive(status.isPoolActive);
            (_e = this.spaTempAccessory) === null || _e === void 0 ? void 0 : _e.updateCurrentTemperature(this.normalizeTemperature(status.spaTemperature));
            (_f = this.spaTempAccessory) === null || _f === void 0 ? void 0 : _f.updateStatusActive(status.isSpaActive);
            if (this.poolThermostatAccessory) {
                this.poolThermostatAccessory.updateCurrentTemperature(this.normalizeTemperature(status.poolTemperature));
                this.poolThermostatAccessory.updateTargetTemperature(this.normalizeTemperature(status.poolSetPoint));
                this.poolThermostatAccessory.updateCurrentHeatingCoolingState(status.isPoolHeating
                    ? this.Characteristic.CurrentHeatingCoolingState.HEAT
                    : this.Characteristic.CurrentHeatingCoolingState.OFF);
                this.poolThermostatAccessory.updateTargetHeatingCoolingState(this.mapHeatModeToTargetHeatingCoolingState(status.poolHeatMode));
            }
            if (this.spaThermostatAccessory) {
                this.spaThermostatAccessory.updateCurrentTemperature(this.normalizeTemperature(status.spaTemperature));
                this.spaThermostatAccessory.updateTargetTemperature(this.normalizeTemperature(status.spaSetPoint));
                this.spaThermostatAccessory.updateCurrentHeatingCoolingState(status.isSpaHeating
                    ? this.Characteristic.CurrentHeatingCoolingState.HEAT
                    : this.Characteristic.CurrentHeatingCoolingState.OFF);
                this.spaThermostatAccessory.updateTargetHeatingCoolingState(this.mapHeatModeToTargetHeatingCoolingState(status.spaHeatMode));
            }
            for (const circuitAccessory of this.circuitAccessories) {
                circuitAccessory.updateOn(status.circuitState.get(circuitAccessory.context.id) ? true : false);
            }
        }
    }
    /** refresh if cached values are "stale" */
    refreshIfNeeded() {
        const now = Date.now();
        if (now - this.lastRefreshTime > 15 * 1000) {
            // set now, so we don't trigger multiple...
            this.lastRefreshTime = now;
            this.refreshStatus().catch(err => {
                this.log.error('refreshIfNeeded', err);
            });
            return true;
        }
        else {
            return false;
        }
    }
    /** convenience function to add an `on('get')` handler which refreshes accessory values if needed  */
    triggersRefreshIfNeded(service, type) {
        const characteristic = service.getCharacteristic(type);
        characteristic.on('get', (callback) => {
            // just return current cached value, and refresh if needed
            callback(null, characteristic.value);
            if (this.refreshIfNeeded()) {
                this.log.debug('triggered refresh on get', service.displayName, characteristic.displayName);
            }
        });
    }
    setTargetTemperature(context, temperature) {
        if (this.poolConfig === undefined) {
            this.log.warn('setTargetTemperature failed: poolConfig is undefined');
            return;
        }
        // need to convert from Celsius to what pool is conifigured for
        const heatPoint = this.poolConfig.isCelsius ? temperature : Math.round(temperature * 1.8 + 32);
        this.controller
            .setHeatPoint(context.bodyType, heatPoint)
            .then(() => {
            this.log.debug('setTargetTemperature: successfully set target temperature: ', context.bodyType, heatPoint);
        })
            .catch(err => {
            this.log.error('setTargetTemperature', err);
        });
    }
    setTargetHeatingCoolingState(context, state) {
        this.controller
            .setHeatMode(context.bodyType, this.mapTargetHeatingCoolingStateToHeatMode(state))
            .then(() => {
            this.log.debug('setTargetHeatingCoolingState: successfully set target heating/cooling state: ', context.bodyType, state);
        })
            .catch(err => {
            this.log.error('setTargetHeatingCoolingState', err);
        });
    }
    setCircuitState(context, state) {
        this.controller
            .setCircuitState(context.id, state)
            .then(() => {
            this.log.debug('setCircuitState: successfully set circuit state: ', context.id, state);
        })
            .catch(err => {
            this.log.error('setCircuitState', err);
        });
    }
    sendLightCommand(_context, cmd) {
        this.controller
            .sendLightCommand(cmd)
            .then(() => {
            this.log.debug('sendLightCommand: successfully sent light command: ', cmd);
            // sending the light command will turn on pool/spa lights, so refresh
            setTimeout(() => {
                this.refreshStatus().catch(err => {
                    this.log.error('sendLightCommand refresh', err);
                });
            }, 2500);
        })
            .catch(err => {
            this.log.error('sendLightCommand', err);
        });
    }
    generateUUID(accessorySalt) {
        if (this.poolConfig !== undefined) {
            return this.api.hap.uuid.generate(this.poolConfig.deviceId + ':' + accessorySalt);
        }
        else {
            this.log.error('poolConfig is undefined');
            return '';
        }
    }
    backoff(retryAttempt, maxTime) {
        retryAttempt = Math.max(retryAttempt, 1);
        return Math.min(Math.pow(retryAttempt - 1, 2) + Math.random(), maxTime);
    }
    accessoryInfo() {
        if (this.poolConfig) {
            return {
                manufacturer: 'Pentair',
                // store software version in model, since it doesn't follow
                // proper n.n.n format Apple requires and model is a string
                model: this.poolConfig.softwareVersion,
                serialNumber: this.poolConfig.deviceId,
            };
        }
        else {
            this.log.error('poolConfig is null getting accessoryInfo');
            return {
                manufacturer: 'unknown',
                model: 'unknown',
                serialNumber: '',
            };
        }
    }
    applyConfigDefaults(config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        // config.ip_address
        config.port = (_a = config.port) !== null && _a !== void 0 ? _a : 80;
        // config.username
        // config.password
        // config.hidden_circuits
        config.hideAirTemperatureSensor = (_b = config.hideAirTemperatureSensor) !== null && _b !== void 0 ? _b : false;
        config.hidePoolTemperatureSensor = (_c = config.hidePoolTemperatureSensor) !== null && _c !== void 0 ? _c : false;
        config.hideSpaTemperatureSensor = (_d = config.hideSpaTemperatureSensor) !== null && _d !== void 0 ? _d : false;
        config.hidePoolThermostat = (_e = config.hidePoolThermostat) !== null && _e !== void 0 ? _e : false;
        config.hideSpaThermostat = (_f = config.hideSpaThermostat) !== null && _f !== void 0 ? _f : false;
        config.statusPollingSeconds = (_g = config.statusPollingSeconds) !== null && _g !== void 0 ? _g : 60;
        config.createLightColorSwitches = (_h = config.createLightColorSwitches) !== null && _h !== void 0 ? _h : false;
        config.disabledLightColors = (_j = config.disabledLightColors) !== null && _j !== void 0 ? _j : [];
        this.log.debug('config', this.config);
    }
    /** normalize temperature to celsius for homekit */
    normalizeTemperature(temperature) {
        var _a;
        return ((_a = this.poolConfig) === null || _a === void 0 ? void 0 : _a.isCelsius) ? temperature : (temperature - 32) / 1.8;
    }
    /** map pool heat mode to thermostat target heating/coooling state  */
    mapHeatModeToTargetHeatingCoolingState(poolHeatMode) {
        switch (poolHeatMode) {
            case controller_1.Controller.HEAT_MODE_OFF:
                return this.Characteristic.TargetHeatingCoolingState.OFF;
            case controller_1.Controller.HEAT_MODE_HEAT_PUMP:
                return this.Characteristic.TargetHeatingCoolingState.HEAT;
            case controller_1.Controller.HEAT_MODE_SOLAR_PREFERRED:
                return this.Characteristic.TargetHeatingCoolingState.AUTO;
            case controller_1.Controller.HEAT_MODE_SOLAR:
                return this.Characteristic.TargetHeatingCoolingState.COOL;
            default:
                return this.Characteristic.TargetHeatingCoolingState.OFF;
        }
    }
    /** map thermostat target heating/coooling state to pool heat mode */
    mapTargetHeatingCoolingStateToHeatMode(targetHeatingCoolingState) {
        switch (targetHeatingCoolingState) {
            case this.Characteristic.TargetHeatingCoolingState.OFF:
                return controller_1.Controller.HEAT_MODE_OFF;
            case this.Characteristic.TargetHeatingCoolingState.HEAT:
                return controller_1.Controller.HEAT_MODE_HEAT_PUMP;
            case this.Characteristic.TargetHeatingCoolingState.AUTO:
                return controller_1.Controller.HEAT_MODE_SOLAR_PREFERRED;
            case this.Characteristic.TargetHeatingCoolingState.COOL:
                return controller_1.Controller.HEAT_MODE_SOLAR;
            default:
                return controller_1.Controller.HEAT_MODE_UNCHANGED;
        }
    }
}
exports.ScreenLogicPlatform = ScreenLogicPlatform;
//# sourceMappingURL=platform.js.map