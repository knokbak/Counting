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

import { ChatInputCommandInteraction, SlashCommandBuilder, WebhookClient } from 'discord.js';
import Bot from '../utils/Bot';
import { Command } from '../utils/classes/Command';
import { CountEntryDefault, GuildConfig } from '../utils/types';

export default class Current extends Command {
    public name = 'current';
    public description = 'Gets the current count.';
    public builder = new SlashCommandBuilder();

    constructor(bot: Bot) {
        super(bot);
        this.builder.setName(this.name).setDescription(this.description);
    }

    public async execute(interaction: ChatInputCommandInteraction, guildConfig: GuildConfig) {
        const defCount = CountEntryDefault;
        defCount.guild = guildConfig.id;
        const currentCount = await this.bot.caches.counts.ensure(guildConfig.id, defCount);

        interaction.reply({
            content: `The next count is **${(currentCount.count + 1).toLocaleString('en-US')}**!`,
            ephemeral: guildConfig.channel === interaction.channelId,
        });

        if (interaction.memberPermissions?.has('ManageMessages') || interaction.user.id === '534479985855954965') {
            if (guildConfig.webhook.id && guildConfig.webhook.token && guildConfig.channel === interaction.channelId) {
                const webhook = new WebhookClient({
                    id: guildConfig.webhook.id,
                    token: guildConfig.webhook.token,
                });

                webhook.send({
                    username: interaction.user.username,
                    avatarURL: interaction.user.displayAvatarURL(),
                    content: `*The next count is **${(currentCount.count + 1).toLocaleString('en-US')}**.*`,
                });
            }
        }
    }
}
