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

const { version } = require('../../package.json');

import { ChatInputCommandInteraction, ColorResolvable, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import Bot from '../utils/Bot';
import { Command } from '../utils/classes/Command';
import { GuildConfig } from '../utils/types';

export default class About extends Command {
    public name = 'about';
    public description = 'Get information about this (open source) bot.';
    public builder = new SlashCommandBuilder();

    constructor(bot: Bot) {
        super(bot);
        this.builder.setName(this.name).setDescription(this.description);
    }

    public execute(interaction: ChatInputCommandInteraction, guildConfig: GuildConfig) {
        const embed = new EmbedBuilder()
            .setColor([242, 17, 17])
            .setAuthor({
                name: 'Count+ by olli',
                iconURL: this.bot.client.user?.displayAvatarURL(),
                url: 'https://github.com/knokbak/Counting',
            })
            .addFields([
                {
                    name: 'Name',
                    value: this.bot.client.user!.tag,
                    inline: true,
                },
                {
                    name: 'Version',
                    value: `v${version}`,
                    inline: true,
                },
                {
                    name: 'GitHub',
                    value: `[knokbak/counting](https://github.com/knokbak/counting)`,
                    inline: true,
                },
                {
                    name: 'GNU Affero General Public License v3.0',
                    value:
                        'Under the GNU Affero General Public License, you may have a right to recieve this ' +
                        "bot's source code. An unmodified version of knokbak/counting can be found on " +
                        '[GitHub](https://github.com/knokbak/counting).\n' +
                        '```\n' +
                        'https://github.com/knokbak/counting\n' +
                        'Copyright (C) 2022  knokbak\n' +
                        '\n' +
                        'This program is free software: you can redistribute it and/or modify ' +
                        'it under the terms of the GNU Affero General Public License as published ' +
                        'by the Free Software Foundation, either version 3 of the License, or ' +
                        '(at your option) any later version.\n' +
                        '\n' +
                        'This program is distributed in the hope that it will be useful, ' +
                        'but WITHOUT ANY WARRANTY; without even the implied warranty of ' +
                        'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the ' +
                        'GNU Affero General Public License for more details.\n' +
                        '\n' +
                        'You should have received a copy of the GNU Affero General Public License ' +
                        'along with this program.  If not, see <https://www.gnu.org/licenses/>.\n' +
                        '```',
                },
            ])
            .setFooter({
                text: 'Made with ❤️ by olli#2075 & contributors',
            });
        interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }
}
