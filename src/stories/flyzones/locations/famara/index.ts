import { Location } from '../index';
import metadata from './metadata';
import takeoffs from './takeoffs';
import landingSpots from './landingSpots';
import flyzone from './flyzone';

const famara: Location = {
  ...metadata,
  takeoffs,
  landingSpots,
  flyzone
};

export default famara; 