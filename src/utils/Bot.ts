import { Client, GatewayIntentBits } from 'discord.js';
import { Cache } from './Cache.js';
import { container } from 'tsyringe';
import IListener from './structures/Listener.js';
import ICommand from './structures/Command.js';
import Josh from '@joshdb/core';
import readdirp from 'readdirp';
// @ts-expect-error Typings
import SQLite from '@joshdb/sqlite';
import { pathToFileURL } from 'url';

const dbOptions = {};

export default class Bot {
    public client: Client;
    public commandFiles: readdirp.ReaddirpStream;
    public listenerFiles: readdirp.ReaddirpStream;

    public databases = {
        counts: new Josh({
            name: 'counts',
            provider: SQLite,
            providerOptions: dbOptions,
        }),
    };
    public caches = {
        counts: new Cache(this, this.databases.counts, Infinity, 30_000, 10_000),
    };

    constructor(client: Client, commandFiles: readdirp.ReaddirpStream, listenerFiles: readdirp.ReaddirpStream) {
        this.client = client;
        this.commandFiles = commandFiles;
        this.listenerFiles = listenerFiles;
    }

    public async init(commands: Map<string, ICommand>, listeners: Map<string, IListener<any>>) {
        for await (const dir of this.commandFiles) {
            const command = container.resolve<ICommand>((await import(pathToFileURL(dir.fullPath).href)).default);
            commands.set(command.name.toLowerCase(), command);

            // TODO: Register the slash command
        }

        for await (const dir of this.listenerFiles) {
            const listener = container.resolve<IListener<any>>(
                (await import(pathToFileURL(dir.fullPath).href)).default
            );
            listeners.set(listener.name.toLowerCase(), listener);

            this.client.on(listener.name, (...args) => void listener.execute(args));
        }

        this.client.login(process.env.DISCORD_TOKEN);
    }
}
