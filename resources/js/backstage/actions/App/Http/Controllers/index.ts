import Auth from './Auth'
import OfficeController from './OfficeController'
import SellablesController from './SellablesController'
import EventAttendeeController from './EventAttendeeController'
import TicketScannerController from './TicketScannerController'
import EmailDistributorController from './EmailDistributorController'
import DistributionController from './DistributionController'
import MailsController from './MailsController'
import InventoryController from './InventoryController'
import StoreManagerController from './StoreManagerController'
import SalesController from './SalesController'
import Settings from './Settings'

const Controllers = {
    Auth: Object.assign(Auth, Auth),
    OfficeController: Object.assign(OfficeController, OfficeController),
    SellablesController: Object.assign(SellablesController, SellablesController),
    EventAttendeeController: Object.assign(EventAttendeeController, EventAttendeeController),
    TicketScannerController: Object.assign(TicketScannerController, TicketScannerController),
    EmailDistributorController: Object.assign(EmailDistributorController, EmailDistributorController),
    DistributionController: Object.assign(DistributionController, DistributionController),
    MailsController: Object.assign(MailsController, MailsController),
    InventoryController: Object.assign(InventoryController, InventoryController),
    StoreManagerController: Object.assign(StoreManagerController, StoreManagerController),
    SalesController: Object.assign(SalesController, SalesController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers