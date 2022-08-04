/*
 * https://github.com/knokbak/counting
 * Copyright (C) 2022  knokbak
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import Josh from '@joshdb/core';
import NodeCache from 'node-cache';
import { Awaitable } from 'discord.js';
import Bot from './Bot';

export class Cache<T extends unknown> {
    public bot: Bot;
    public db: Josh;
    public cache: NodeCache;
    private pendingUpdates: string[] = [];
    private interval: NodeJS.Timer | null = null;

    constructor(bot: Bot, db: Josh, maxSize: number, maxAge: number, checkInterval: number) {
        this.bot = bot;
        this.db = db;
        this.cache = new NodeCache({
            maxKeys: maxSize == Infinity ? -1 : maxSize,
            stdTTL: maxAge,
            checkperiod: checkInterval + 5000,
        });

        if (checkInterval > maxAge) {
            throw new Error('Check interval cannot be greater than max age; this would cause some values to not be saved correctly');
        }

        this.interval = setInterval(this.writeAllPendingUpdates.bind(this), checkInterval);

        process.on('beforeExit', this.writeAllPendingUpdates.bind(this));
        process.on('uncaughtException', async () => {
            await this.writeAllPendingUpdates();
            process.exit(1);
        });
        process.on('unhandledRejection', async () => {
            await this.writeAllPendingUpdates();
            process.exit(1);
        });
    }

    public get(key: string, force?: boolean): Awaitable<T | null> {
        const fromCache = this.cache.get(key) ?? null;
        // @ts-expect-error - always returns a value from the cache or db, which is validated anyway
        return fromCache && !force ? fromCache : this.db.get(key);
    }

    public async ensure(key: string, value: T): Promise<T> {
        if (this.cache.has(key)) return this.cache.get(key) as T;
        // @ts-expect-error - always returns either the database entry or the default value provided
        const out: T = await this.db.ensure(key, value);
        this.cache.set(key, out);
        return out;
    }

    public async set(key: string, value: T, usePendingUpdates?: boolean): Promise<T> {
        this.cache.set(key, value);
        if (this.pendingUpdates.includes(key)) {
            this.pendingUpdates.splice(this.pendingUpdates.indexOf(key), 1);
        }
        if (usePendingUpdates) {
            this.pendingUpdates.push(key);
        } else {
            await this.db.set(key, value);
        }
        return value;
    }

    public evictFromCache(key: string): Cache<T> {
        this.cache.del(key);
        this.removePendingUpdate(key);
        return this;
    }

    public async resyncValue(key: string): Promise<T | null> {
        const value = await this.db.get(key);
        if (value) {
            this.cache.set(key, value);
        } else {
            this.cache.del(key);
        }
        // @ts-expect-error - always returns a value from the cache or db, which is validated anyway
        return this ?? null;
    }

    public async delete(key: string): Promise<Cache<T>> {
        this.cache.del(key);
        this.removePendingUpdate(key);
        await this.db.delete(key);
        return this;
    }

    public async removePendingUpdate(key: string): Promise<Cache<T>> {
        if (this.pendingUpdates.includes(key)) {
            this.pendingUpdates.splice(this.pendingUpdates.indexOf(key), 1);
        }
        return this;
    }

    public clearAllPendingUpdates(): Cache<T> {
        this.pendingUpdates = [];
        return this;
    }

    public async writeAllPendingUpdates(): Promise<Cache<T>> {
        if (this.pendingUpdates.length === 0) return this;
        const updates: string[] = this.pendingUpdates;
        this.pendingUpdates = [];

        let dataToSet: [string, T | undefined][] = updates.map((key) => [key, this.cache.get(key)]);
        dataToSet = dataToSet.filter(([, value]) => value !== undefined);

        for (let i = 0; i < dataToSet.length; i++) {
            const [key, value] = dataToSet[i];
            await this.db.set(key, value);
        }
        return this;
    }

    public clearInterval(): Cache<T> {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
        return this;
    }
}
