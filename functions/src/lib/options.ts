import type { CallableOptions } from 'firebase-functions/v2/https';
import { REGION } from '../config/region';

/**
 * Shared by every callable. 2nd gen, one region, small instances, and a hard
 * ceiling on instances so a flood of guesses cannot run up a bill.
 */
export const CALLABLE: CallableOptions = {
  region: REGION,
  memory: '256MiB',
  timeoutSeconds: 30,
  maxInstances: 10,
  concurrency: 80,
};
