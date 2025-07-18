"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemperatureAccessory = void 0;
class TemperatureAccessory {
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
        // get the TemperatureSensor service if it exists, otherwise create a new TemperatureSensor service
        this.service =
            this.accessory.getService(this.platform.Service.TemperatureSensor) ||
                this.accessory.addService(this.platform.Service.TemperatureSensor);
        // set the service name, this is what is displayed as the default name on the Home app
        this.service.setCharacteristic(this.platform.Characteristic.Name, this.context.displayName);
        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature).setProps({
            format: "float" /* FLOAT */,
            minValue: -40,
            maxValue: 60,
        });
        // trigger refresh if needed when HomeKit asks for this value
        this.platform.triggersRefreshIfNeded(this.service, this.platform.Characteristic.CurrentTemperature);
    }
    static makeAdaptor() {
        return {
            generateUUID: TemperatureAccessory.generateUUID,
            sameContext: TemperatureAccessory.sameContext,
            factory: function (platform, accessory) {
                return new TemperatureAccessory(platform, accessory);
            },
        };
    }
    static generateUUID(platform, context) {
        return platform.generateUUID('temp:' + context.type);
    }
    static sameContext(a, b) {
        return a.displayName === b.displayName && a.type === b.type;
    }
    get UUID() {
        return this.accessory.UUID;
    }
    get context() {
        return this.accessory.context;
    }
    updateCurrentTemperature(temperature) {
        this.platform.log.debug('updateCurrentTemperature:', temperature, this.context);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, temperature);
    }
    updateStatusActive(active) {
        this.platform.log.debug('updateStatusActive:', active, this.context);
        this.service.updateCharacteristic(this.platform.Characteristic.StatusActive, active);
    }
}
exports.TemperatureAccessory = TemperatureAccessory;
//# sourceMappingURL=temperatureAccessory.js.map