import { injectable } from 'tsyringe';
import { CommandInteraction } from 'discord.js';
import ICommand from '../utils/structures/Command';

@injectable()
export default class Ping implements ICommand {
    public name = 'ping';
    public description = "Pings the bot and returns it's latency.";

    public execute(interaction: CommandInteraction) {
        return interaction.reply({
            content: 'Pong!',
        });
    }
}
