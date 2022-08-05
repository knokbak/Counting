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

export default class Help extends Command {
    public name = 'help';
    public description = 'Provides information on how to setup the bot.';
    public builder = new SlashCommandBuilder();

    constructor(bot: Bot) {
        super(bot);
        this.builder.setName(this.name).setDMPermission(true).setDescription(this.description);
    }

    public execute(interaction: ChatInputCommandInteraction, guildConfig: GuildConfig) {
        return interaction.reply({
            content: `:wave: **Hi there!** Use the \`/set-channel <channel>\` command to set the channel for counting. Once you've done that, everything should work as intended! Simple, right?`,
            ephemeral: true,
        });
    }
}
