"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitAccessory = void 0;
class CircuitAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        // set accessory information
        const accessoryInfo = platform.accessoryInfo();
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, accessoryInfo.manufacturer)
            .setCharacteristic(this.platform.Characteristic.Model, accessoryInfo.model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessoryInfo.serialNumber);
        // get the Switch service if it exists, otherwise create a new Switch service
        this.service =
            this.accessory.getService(this.platform.Service.Switch) ||
                this.accessory.addService(this.platform.Service.Switch);
        // set the service name, this is what is displayed as the default name on the Home app
        this.service.setCharacteristic(this.platform.Characteristic.Name, this.context.displayName);
        // register handlers for the On Characteristic
        this.service.getCharacteristic(this.platform.Characteristic.On).on('set', this.setOn.bind(this));
        // trigger refresh if needed when HomeKit asks for this value
        this.platform.triggersRefreshIfNeded(this.service, this.platform.Characteristic.On);
    }
    static makeAdaptor() {
        return {
            generateUUID: CircuitAccessory.generateUUID,
            sameContext: CircuitAccessory.sameContext,
            factory: function (platform, accessory) {
                return new CircuitAccessory(platform, accessory);
            },
        };
    }
    static generateUUID(platform, context) {
        return platform.generateUUID('switch:' + context.displayName);
    }
    static sameContext(a, b) {
        return a.displayName === b.displayName && a.id === b.id;
    }
    get UUID() {
        return this.accessory.UUID;
    }
    get context() {
        return this.accessory.context;
    }
    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    setOn(value, callback) {
        this.platform.log.debug('setOn:', value, this.context);
        this.platform.setCircuitState(this.context, value);
        callback(null, value);
    }
    updateOn(on) {
        this.platform.log.debug('updateOn:', on, this.context);
        this.service.updateCharacteristic(this.platform.Characteristic.On, on);
    }
}
exports.CircuitAccessory = CircuitAccessory;
//# sourceMappingURL=circuitAccessory.js.map