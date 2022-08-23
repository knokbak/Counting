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

import { ActivitiesOptions, ActivityType, Client, Guild, REST, Routes } from 'discord.js';
import { Cache } from './Cache';
import Josh from '@joshdb/core';
// @ts-expect-error Typings - we'll use this in prod
import MongoDB from '@joshdb/mongo';
/*// @ts-expect-error Typings
import SQLite from '@joshdb/sqlite';*/
import readdirp from 'readdirp';
import { CountEntry, GuildConfig, GuildRule } from './types';
import { Command } from './classes/Command';
import { Listener } from './classes/Listener';
import NodeCache from 'node-cache';
import { GuildConfigDefault } from './types';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export default class Bot {
    public client: Client;
    public commandFiles: readdirp.ReaddirpStream;
    public listenerFiles: readdirp.ReaddirpStream;
    public commands: Map<string, Command> = new Map<string, Command>();
    public listeners: Map<string, Listener<any>> = new Map<string, Listener<any>>();

    private currentStatus = 0;
    private readonly statuses: ActivitiesOptions[] = [
        {
            name: 'github.com/knokbak/counting',
            type: ActivityType.Watching,
        },
        {
            name: '/about',
            type: ActivityType.Listening,
        },
        {
            name: "I'm on GitHub!",
            type: ActivityType.Playing,
        },
        {
            name: 'the GNU AGPLv3.0',
            type: ActivityType.Listening,
        },
    ];

    private readonly dbOptions = {
        dbName: 'countplus',
        url: process.env.MONGO_CONNECTION_URI as string,
    };

    public databases = {
        counts: new Josh<CountEntry | null>({
            name: 'counts',
            provider: MongoDB,
            providerOptions: {
                ...this.dbOptions,
                collection: 'counts',
            },
        }),
        guildConfigs: new Josh<GuildConfig | null>({
            name: 'guilds',
            provider: MongoDB,
            providerOptions: {
                ...this.dbOptions,
                collection: 'guild-configs',
            },
        }),
        rules: new Josh<GuildRule | null>({
            name: 'guild-rules',
            provider: MongoDB,
            providerOptions: {
                ...this.dbOptions,
                collection: 'guild-rules',
            },
        }),
    };
    public caches = {
        counts: new Cache<CountEntry>(this, this.databases.counts, Infinity, 30_000, 10_000),
        guildConfigs: new Cache<GuildConfig>(this, this.databases.guildConfigs, Infinity, 30_000, 10_000),
    };
    public limitStores = {
        webhookFailures: new NodeCache({ stdTTL: 30, checkperiod: 5 }),
        directMessageFailures: new NodeCache({ stdTTL: 60, checkperiod: 5 }),
    };
    public rateLimiters = {
        // Limits a user from having multiple messages recognized in short succession
        message: new RateLimiterMemory({ points: 1, duration: 1 }),
        // Limits a user from spamming commands - the limit increases if another command is tried before the cooldown is over
        command: new RateLimiterMemory({ points: 1, duration: 5, blockDuration: 3 }),
        // Prevents a single guild from attempting to overload the bot using messages in their counting channel
        guildMessages: new RateLimiterMemory({ points: 50, duration: 5, blockDuration: 10 }),
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
        this.rotatePresence();

        this.databases.rules.set('test', {
            id: 'test',
            guild: '707282488489148456',
            trigger: 'count',
            type: 'equals',
            value: 1,
            action: {
                type: 'send_dm',
                content: 'lol hi',
            },
        });

        setTimeout(async () => {
            if (!this.client.user?.id) return;

            const rest = new REST({ version: '10' }).setToken(token);
            await rest.put(Routes.applicationCommands(this.client.user.id), {
                body: [...this.commands.values()].map((c) => c.builder.toJSON()),
            });
            console.log(`Registered ${this.commands.size} commands!`);
        }, 10_000);

        setInterval(() => this.rotatePresence(), 15_000);
    }

    public rotatePresence() {
        try {
            this.client.user!.setPresence({
                activities: [this.statuses[this.currentStatus]],
                status: 'idle',
            });
            this.currentStatus = (this.currentStatus + 1) % this.statuses.length;
        } catch (err) {
            console.warn(err);
        }
    }

    public async getGuildConfig(guild: string | Guild): Promise<GuildConfig> {
        if (typeof guild === 'string') {
            guild = await this.client.guilds.fetch(guild);
        }
        if (!guild || !guild.id) {
            throw new Error('Guild not available');
        }
        const defaultConfig = GuildConfigDefault;
        defaultConfig.id = guild.id;
        const guildConfig = await this.caches.guildConfigs.ensure(guild.id, defaultConfig);
        for (const key in defaultConfig) {
            if (!(key in guildConfig)) {
                // @ts-expect-error
                guildConfig[key] = defaultConfig[key];
            }
        }
        return guildConfig;
    }
}
