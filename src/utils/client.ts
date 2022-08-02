import { container } from 'tsyringe';
import { ClientOptions, Client } from 'discord.js';

export default function createClient(options: ClientOptions) {
    const client = new Client(options);
    container.register(Client, { useValue: client });

    return client;
}
