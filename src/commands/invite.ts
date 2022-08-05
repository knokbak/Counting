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

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Bot from '../utils/Bot';
import { Command } from '../utils/classes/Command';
import { GuildConfig } from '../utils/types';

export default class Invite extends Command {
    public name = 'invite';
    public description = 'Get a link you can use to invite count+ to your server!';
    public builder = new SlashCommandBuilder();

    constructor(bot: Bot) {
        super(bot);
        this.builder.setName(this.name).setDMPermission(true).setDescription(this.description);
    }

    public execute(interaction: ChatInputCommandInteraction, guildConfig: GuildConfig) {
        return interaction.reply({
            content: `**Invite the public count+ bot here:** https://discord.com/api/oauth2/authorize?client_id=872376168865730570&permissions=0&redirect_uri=https%3A%2F%2Fcountplus.pages.dev&response_type=code&scope=identify%20bot%20applications.commands%20applications.commands.permissions.update`,
            ephemeral: true,
        });
    }
}
