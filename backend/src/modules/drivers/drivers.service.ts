import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation.js';
import { CallsService } from '../calls/calls.service.js';
import type {
  CreateDriverInput,
  UpdateDriverInput,
} from './dto/driver.inputs.js';
import { DriversRepository } from './drivers.repository.js';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    private readonly drivers: DriversRepository,
    private readonly calls: CallsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  list(ownerId: string) {
    return this.drivers.findAllForOwner(ownerId);
  }

  /** A driver this owner may see. Someone else's driver looks exactly like a missing one. */
  async get(id: string, ownerId: string) {
    const driver = await this.drivers.findById(id);
    if (!driver || driver.ownerId !== ownerId) {
      throw new NotFoundException(`Driver ${id} not found`);
    }
    return driver;
  }

  findByPhone(phone: string) {
    return this.drivers.findByPhone(phone);
  }

  /** Adds a driver and rings them once so they know who'll be calling at night. */
  async create(input: CreateDriverInput, ownerId: string) {
    if (await this.drivers.findByPhone(input.phone)) {
      throw new ConflictException(
        `A driver with phone ${input.phone} already exists`,
      );
    }
    // First check-in comes one interval after the welcome call, not right on its heels.
    const interval = this.config.get('CALL_INTERVAL_MINUTES', { infer: true });
    const driver = await this.drivers.create({
      ...input,
      ownerId,
      nextCallAt: new Date(Date.now() + interval * 60_000),
    });
    await this.calls
      .callDriver(driver, 'WELCOME')
      .catch((err: Error) =>
        this.logger.error(
          `Welcome call to driver ${driver.id} failed: ${err.message}`,
        ),
      );
    return driver;
  }

  createDemo(input: Pick<CreateDriverInput, 'name' | 'phone' | 'language'>) {
    return this.drivers.create({ ...input, isDemo: true, active: false });
  }

  async update(id: string, input: UpdateDriverInput, ownerId: string) {
    await this.get(id, ownerId);
    return this.drivers.update(id, input);
  }

  /** Demo drivers have no owner; only the public demo flow updates them. */
  updateDemo(id: string, input: Pick<CreateDriverInput, 'name' | 'language'>) {
    return this.drivers.update(id, input);
  }

  async remove(id: string, ownerId: string) {
    await this.get(id, ownerId);
    return this.drivers.delete(id);
  }

  async callNow(id: string, ownerId: string) {
    return this.calls.callDriver(await this.get(id, ownerId), 'CHECK_IN');
  }
}
