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

import { Client, REST, Routes } from 'discord.js';
import { Cache } from './Cache';
import Josh from '@joshdb/core';
// @ts-expect-error Typings - we'll use this in prod
import MongoDB from '@joshdb/mongo';
/*// @ts-expect-error Typings
import SQLite from '@joshdb/sqlite';*/
import readdirp from 'readdirp';
import { pathToFileURL } from 'url';
import { CountEntry, GuildConfig, GuildConfigDefault } from './types';
import { Command } from './classes/Command';
import { Listener } from './classes/Listener';
import NodeCache from 'node-cache';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export default class Bot {
    public client: Client;
    public commandFiles: readdirp.ReaddirpStream;
    public listenerFiles: readdirp.ReaddirpStream;
    public commands: Map<string, Command> = new Map<string, Command>();
    public listeners: Map<string, Listener<any>> = new Map<string, Listener<any>>();

    private readonly dbOptions = {
        dbName: 'countplus',
        url: process.env.MONGO_CONNECTION_URI as string,
    };

    public databases = {
        counts: new Josh({
            name: 'counts',
            provider: MongoDB,
            providerOptions: {
                ...this.dbOptions,
                collection: 'counts',
            },
        }),
        guildConfigs: new Josh({
            name: 'guilds',
            provider: MongoDB,
            providerOptions: {
                ...this.dbOptions,
                collection: 'guild-configs',
            },
        }),
    };
    public caches = {
        counts: new Cache<CountEntry>(this, this.databases.counts, Infinity, 30_000, 10_000),
        guildConfigs: new Cache<GuildConfig>(this, this.databases.guildConfigs, Infinity, 30_000, 10_000),
    };
    public limitStores = {
        webhookFailures: new NodeCache({ stdTTL: 30, checkperiod: 5 }),
        directMessageFailures: new NodeCache({ stdTTL: 30, checkperiod: 5 }),
    };
    public rateLimiters = {
        // Limits a user from having multiple messages recognized in short succession
        message: new RateLimiterMemory({ points: 1, duration: 1 }),
        // Limits a user from spamming commands - the limit increases if another command is tried before the cooldown is over
        command: new RateLimiterMemory({ points: 1, duration: 5, blockDuration: 3 }),
        // Prevents a single guild from attempting to overload the bot using messages in their counting channel
        guildMessages: new RateLimiterMemory({ points: 35, duration: 5, blockDuration: 10 }),
        // Prevents a single guild from attempting to overload the bot using commands
        guildCommands: new RateLimiterMemory({ points: 10, duration: 5, blockDuration: 5 }),
    };

    constructor(client: Client, commandFiles: readdirp.ReaddirpStream, listenerFiles: readdirp.ReaddirpStream) {
        this.client = client;
        this.commandFiles = commandFiles;
        this.listenerFiles = listenerFiles;
    }

    public async init() {
        if (typeof process.env.DISCORD_TOKEN !== 'string' || typeof process.env.DISCORD_ID !== 'string') {
            throw new Error('oi give me a token and id');
        }

        for await (const dir of this.commandFiles) {
            const command: any = new (await import(dir.fullPath)).default(this);
            this.commands.set(command.name.toLowerCase(), command);
        }

        for await (const dir of this.listenerFiles) {
            const listener: Listener<any> = new (await import(dir.fullPath)).default(this);
            this.listeners.set(listener.name, listener);
            // @ts-expect-error
            this.client.on(listener.name, listener.execute.bind(listener));
        }

        const token = process.env.DISCORD_TOKEN;
        await this.client.login(token);

        setTimeout(async () => {
            if (!this.client.user?.id) return;

            const rest = new REST({ version: '10' }).setToken(token);
            await rest.put(Routes.applicationCommands(this.client.user.id), {
                body: [...this.commands.values()].map((c) => c.builder.toJSON()),
            });
            /*await rest.put(Routes.applicationGuildCommands(this.client.user.id, 'guild_id'), {
                body: [],
            });*/
            console.log(`Registered ${this.commands.size} commands!`);
        }, 10_000);
    }
}
