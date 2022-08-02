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

import Bot from '../utils/Bot';
import { injectable, container } from 'tsyringe';
import IListener from '../utils/structures/Listener.js';
import ICommand from '../utils/structures/Command.js';
import { Interaction, Events } from 'discord.js';

@injectable()
export default class InteractionCreate implements IListener<typeof Events.InteractionCreate> {
    public name: Events.InteractionCreate = Events.InteractionCreate;

    public async execute(interaction: Interaction) {
        // Check if command is a slash command:
        if (!interaction.isChatInputCommand()) return;

        // Resolve command and if found, run it:
        const command = container.resolve<ICommand>(interaction.commandName);
        if (!command) return;

        return command.execute(interaction);
    }
}
