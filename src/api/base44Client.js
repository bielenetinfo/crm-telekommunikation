import { bielenet } from '@/lib/bielenet-sdk';
import { createMonitoredClient } from '@/lib/monitoring';

export const base44 = createMonitoredClient(bielenet);
