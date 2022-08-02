import Josh from '@joshdb/core';
import QuickLRU from 'quick-lru';
import { Awaitable } from 'discord.js';
import Bot from './Bot';

export class Cache<T extends unknown> {
    public bot: Bot;
    public db: Josh;
    public cache: QuickLRU<string, T>;
    private pendingUpdates: string[] = [];

    constructor(bot: Bot, db: Josh, maxSize: number, maxAge: number, checkInterval: number) {
        this.bot = bot;
        this.db = db;
        this.cache = new QuickLRU<string, T>({
            maxSize,
            maxAge,
            onEviction: (key) => this.removePendingUpdate(key),
        });

        if (checkInterval > maxAge) {
            throw new Error(
                'Check interval cannot be greater than max age; this would cause some values to not be saved correctly'
            );
        }

        setInterval(() => {
            if (this.pendingUpdates.length === 0) return;
            const updates = this.pendingUpdates;
            this.pendingUpdates = [];

            const array: [string, unknown][] = updates.map((key) => [key, this.cache.get(key)]);
            this.db.setMany(array.filter(([, value]) => value !== undefined));
        }, checkInterval);
    }

    public get(key: string, force?: boolean): Awaitable<T | null> {
        const fromCache = this.cache.get(key) ?? null;
        return fromCache && !force ? fromCache : this.db.get(key);
    }

    public async set(key: string, value: T): Promise<T> {
        this.cache.set(key, value);
        await this.db.set(key, value);
        return value;
    }

    public evictFromCache(key: string): void {
        this.cache.delete(key);
        this.removePendingUpdate(key);
    }

    public async delete(key: string): Promise<void> {
        this.cache.delete(key);
        this.removePendingUpdate(key);
        await this.db.delete(key);
        return;
    }

    public async removePendingUpdate(key: string): Promise<void> {
        if (this.pendingUpdates.includes(key)) {
            this.pendingUpdates.splice(this.pendingUpdates.indexOf(key), 1);
        }
        return;
    }
}
