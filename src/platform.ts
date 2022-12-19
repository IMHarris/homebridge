import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { SIPIrrigationSystemAccessory } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      log.debug('Hello world!1');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    // TODO Start here!!!
    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    // TODO: This is where accessories are discovered.  For now, Lists take the place of discovered devices
    // const exampleDevices = [
    //   {
    //     exampleUniqueId: 'ABCDx',
    //     exampleDisplayName: 'Bedroom2',
    //   },
    //   {
    //     exampleUniqueId: 'EFGH',
    //     exampleDisplayName: 'Kitchen',
    //   },
    // ];
    const IrrigationSystems = [
      {
        UniqueId: 'LMNOp',
        DisplayName: 'Backyard2',
        Active: 1,
        ProgramMode: 0,
        InUse: 1,
        Valves: [
          {
            Name: 'Potss',
            Active: 1,
            InUse: 0,
            ValveType: 1,
          },
          {
            Name: 'Perennialss',
            Active: 1,
            InUse: 0,
            ValveType: 1,
          },
        ],
      },
    ];

    // Here is how you remove a registered accessory
    // const uuid = this.api.hap.uuid.generate('ABCD');
    // const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
    // this.log.debug('Foundit', existingAccessory.displayName);
    // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
    // loop over the discovered devices and register each one if it has not already been registered

    const discoveredUuid : string[] = [];
    for (const device of IrrigationSystems) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.UniqueId.concat('IrrSys'));
      discoveredUuid.push(uuid);
      // this.log.debug(this.accessories.entries.toString());
      this.log.debug('uuid', device.DisplayName, device.UniqueId, uuid);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new SIPIrrigationSystemAccessory(this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.DisplayName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.DisplayName, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new SIPIrrigationSystemAccessory(this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
    // Loop through loaded accessories and check them against what has been discovered
    // If not discovered, they need to be removed.
    const deleteUuid : string[] = [];
    for (const accessory of this.accessories) {
      this.log.debug('Found loaded in homebridge:', accessory.displayName);
      // If there are accessories loaded, but not discovered, we will remove them from Homebridge
      this.log.debug('stored accessory UUID', accessory.UUID);
      if (discoveredUuid.find(accuuid => accuuid === accessory.UUID) === undefined) {
        this.log.debug('Loaded accessory not discovered to be removed:', accessory.displayName);
        deleteUuid.push(accessory.UUID);
      }
    }
    deleteUuid.forEach((uuid) => {
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
      if (existingAccessory) {
        this.log.debug('unregistering:', existingAccessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
      }
    });
  }
  // registerDevice(accessory: PlatformAccessory) {
  //
  // }
}
