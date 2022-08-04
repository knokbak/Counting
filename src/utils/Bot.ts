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
// @ts-expect-error Typings
import SQLite from '@joshdb/sqlite';
import readdirp from 'readdirp';
import { pathToFileURL } from 'url';
import { CountEntry, GuildConfig, GuildConfigDefault } from './types';
import { Command } from './classes/Command';
import { Listener } from './classes/Listener';

const dbOptions = {};

export default class Bot {
    public client: Client;
    public commandFiles: readdirp.ReaddirpStream;
    public listenerFiles: readdirp.ReaddirpStream;
    public commands: Map<string, Command> = new Map<string, Command>();
    public listeners: Map<string, Listener<any>> = new Map<string, Listener<any>>();

    public databases = {
        counts: new Josh({
            name: 'counts',
            provider: SQLite,
            providerOptions: dbOptions,
        }),
        guildConfigs: new Josh({
            name: 'guilds',
            provider: SQLite,
            providerOptions: dbOptions,
        }),
    };
    public caches = {
        counts: new Cache<CountEntry>(this, this.databases.counts, Infinity, 30_000, 10_000),
        guildConfigs: new Cache<GuildConfig>(this, this.databases.guildConfigs, Infinity, 30_000, 10_000),
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
            const command: any = (await import(dir.fullPath)).default;
            this.commands.set(command.name.toLowerCase(), new command(this));
        }

        for await (const dir of this.listenerFiles) {
            const listener: Listener<any> = new (await import(dir.fullPath)).default(this);
            this.listeners.set(listener.name, listener);
            // @ts-expect-error
            this.client.on(listener.name, listener.execute.bind(listener));
        }

        await this.client.login(process.env.DISCORD_TOKEN);

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(process.env.DISCORD_ID), { body: [] });
        await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_ID, '452237221840551938'), {
            body: [...this.commands.values()].map((c) => c.builder.toJSON()),
        });
        console.log(`Registered ${this.commands.size} commands!`);
    }
}
