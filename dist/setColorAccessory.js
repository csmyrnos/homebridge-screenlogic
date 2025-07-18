"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetColorAccessory = void 0;
const node_screenlogic_1 = __importDefault(require("node-screenlogic"));
const setColorConfig = [
    { name: 'Pool Color Set', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_SET },
    { name: 'Pool Color Sync', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_SYNC },
    { name: 'Pool Color Swim', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_SWIM },
    { name: 'Pool Mode Party', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_MODE_PARTY },
    { name: 'Pool Mode Romance', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_MODE_ROMANCE },
    { name: 'Pool Mode Caribbean', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_MODE_CARIBBEAN },
    { name: 'Pool Mode American', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_MODE_AMERICAN },
    { name: 'Pool Mode Sunset', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_MODE_SUNSET },
    { name: 'Pool Mode Royal', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_MODE_ROYAL },
    { name: 'Pool Color Blue', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_BLUE },
    { name: 'Pool Color Green', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_GREEN },
    { name: 'Pool Color Red', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_RED },
    { name: 'Pool Color White', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_WHITE },
    { name: 'Pool Color Purple', cmd: node_screenlogic_1.default.LIGHT_CMD_COLOR_PURPLE },
];
class SetColorAccessory {
    constructor(platform, accessory) {
        var _a;
        this.platform = platform;
        this.accessory = accessory;
        // set accessory information
        const accessoryInfo = platform.accessoryInfo();
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, accessoryInfo.manufacturer)
            .setCharacteristic(this.platform.Characteristic.Model, accessoryInfo.model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessoryInfo.serialNumber);
        for (const colorConfig of setColorConfig) {
            if (!platform.config.disabledLightColors.includes(colorConfig.name)) {
                this.platform.log.info('adding enabled light color:', colorConfig.name);
                // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
                // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
                // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');
                const service = (_a = this.accessory.getService(colorConfig.name)) !== null && _a !== void 0 ? _a : this.accessory.addService(this.platform.Service.Switch, colorConfig.name, colorConfig.name);
                // set the service name, this is what is displayed as the default name on the Home app
                service.setCharacteristic(this.platform.Characteristic.Name, colorConfig.name);
                // register handlers for the On Characteristic
                service
                    .getCharacteristic(this.platform.Characteristic.On)
                    .on('set', (value, callback) => {
                    this.setOn(service, value, callback, colorConfig);
                });
            }
        }
        const servicesToRemove = this.accessory.services.filter(service => {
            if (service.UUID === this.platform.Service.Switch.UUID) {
                return platform.config.disabledLightColors.includes(service.displayName);
            }
            else {
                return false;
            }
        });
        for (const service of servicesToRemove) {
            this.platform.log.info('removing disabled light color:', service.displayName);
            this.accessory.removeService(service);
        }
    }
    static makeAdaptor() {
        return {
            generateUUID: SetColorAccessory.generateUUID,
            sameContext: SetColorAccessory.sameContext,
            factory: function (platform, accessory) {
                return new SetColorAccessory(platform, accessory);
            },
        };
    }
    static generateUUID(platform, context) {
        return platform.generateUUID('setcolor:' + context.displayName);
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
    setOn(service, value, callback, colorConfig) {
        this.platform.log.debug('setOn:', value, colorConfig);
        this.platform.sendLightCommand(this.context, colorConfig.cmd);
        callback(null, value);
        setTimeout(() => {
            service.updateCharacteristic(this.platform.Characteristic.On, false);
        }, 1000);
    }
}
exports.SetColorAccessory = SetColorAccessory;
//# sourceMappingURL=setColorAccessory.js.map