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

import { Interaction, Events } from 'discord.js';
import { Listener } from '../utils/classes/Listener';
import { GuildConfigDefault } from '../utils/types';

export default class InteractionCreate extends Listener<typeof Events.InteractionCreate> {
    public name: Events.InteractionCreate = Events.InteractionCreate;

    public async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand() || !interaction.guild) return;

        const command = this.bot.commands.get(interaction.commandName.toLowerCase());
        if (!command) return;

        const defConfig = GuildConfigDefault;
        defConfig.id = interaction.guild.id;
        const guildConfig = await this.bot.caches.guildConfigs.ensure(defConfig.id, defConfig);

        return command.execute.bind(command)(interaction, guildConfig);
    }
}
