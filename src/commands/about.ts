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

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ColorResolvable,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import Bot from '../utils/Bot';
import { Command } from '../utils/classes/Command';
import { GuildConfig } from '../utils/types';

export default class About extends Command {
    public name = 'about';
    public description = 'Get information about this (open source) bot.';
    public builder = new SlashCommandBuilder();

    constructor(bot: Bot) {
        super(bot);
        this.builder.setName(this.name).setDMPermission(true).setDescription(this.description);
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
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Invite')
                .setURL(
                    'https://discord.com/api/oauth2/authorize?client_id=872376168865730570&permissions=0&redirect_uri=https%3A%2F%2Fcountplus.pages.dev&response_type=code&scope=identify%20bot%20applications.commands%20applications.commands.permissions.update'
                )
                .setDisabled(true),
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Website').setURL('https://countplus.pages.dev'),
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('GitHub').setURL('https://github.com/knokbak/Counting'),
        ]);
        interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
        });
    }
}
