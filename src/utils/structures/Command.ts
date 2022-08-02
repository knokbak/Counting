import { Awaitable, CommandInteraction } from 'discord.js';

export default interface ICommand {
    name: string;
    description: string;
    ownerOnly?: boolean;

    execute: (interaction: CommandInteraction) => Awaitable<unknown>;
}
