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
import QuickLRU from 'quick-lru';
import { Awaitable } from 'discord.js';
import Bot from './Bot';

export class Cache<T extends unknown> {
    public bot: Bot;
    public db: Josh;
    public cache: QuickLRU<string, T>;
    private pendingUpdates: string[] = [];
    private interval: NodeJS.Timer | null = null;

    constructor(bot: Bot, db: Josh, maxSize: number, maxAge: number, checkInterval: number) {
        this.bot = bot;
        this.db = db;
        this.cache = new QuickLRU<string, T>({
            maxSize,
            maxAge,
            onEviction: (key) => this.removePendingUpdate(key),
        });

        if (checkInterval > maxAge) {
            throw new Error('Check interval cannot be greater than max age; this would cause some values to not be saved correctly');
        }

        this.interval = setInterval(this.writeAllPendingUpdates, checkInterval);
    }

    public get(key: string, force?: boolean): Awaitable<T | null> {
        const fromCache = this.cache.get(key) ?? null;
        return fromCache && !force ? fromCache : this.db.get(key);
    }

    public async ensure(key: string, value: T): Promise<T> {
        // @ts-expect-error - always returns either the database entry or the default value provided
        const out: T = await this.db.ensure(key, value);
        this.cache.set(key, value);
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
        this.cache.delete(key);
        this.removePendingUpdate(key);
        return this;
    }

    public async delete(key: string): Promise<Cache<T>> {
        this.cache.delete(key);
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
        const updates = this.pendingUpdates;
        this.pendingUpdates = [];

        const array: [string, unknown][] = updates.map((key) => [key, this.cache.get(key)]);
        await this.db.setMany(array.filter(([, value]) => value !== undefined));
        return this;
    }

    public clearInterval(): Cache<T> {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
        return this;
    }
}
