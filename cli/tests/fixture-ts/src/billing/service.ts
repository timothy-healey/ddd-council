import { placeOrder } from '@app/ordering/api';
import { shipOrder } from '@app/fulfilment/api';
import { notify } from '@app/notifications/api';
export const bill = () => { placeOrder(); shipOrder(); notify(); };
