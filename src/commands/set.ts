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
import { sendToWebhook } from '../utils/commonHandlers';

export default class Set extends Command {
    public name = 'set';
    public description = 'Sets the current count.';
    public builder = new SlashCommandBuilder();

    constructor(bot: Bot) {
        super(bot);
        this.builder
            .setName(this.name)
            .setDMPermission(false)
            .setDescription(this.description)
            .addIntegerOption((option) =>
                option
                    .setName('count')
                    .setDescription('The number the count should be set to.')
                    .setMinValue(0)
                    .setMaxValue(100_000_000)
                    .setRequired(true)
            );
    }

    public async execute(interaction: ChatInputCommandInteraction, guildConfig: GuildConfig) {
        if (!interaction.member || !interaction.member.permissions) return;
        if (!interaction.memberPermissions?.has('ManageMessages') && interaction.user.id !== process.env.BOT_OWNER_ID) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        const count = Math.floor(interaction.options.getInteger('count', true));
        if (count < 0 || count > 100_000_000) return;

        const defCount = CountEntryDefault;
        defCount.guild = guildConfig.id;
        const currentCount = await this.bot.caches.counts.ensure(guildConfig.id, defCount);

        currentCount.count = count;
        await this.bot.caches.counts.set(guildConfig.id, currentCount);

        interaction.reply({
            content: `The count has been set to ${count.toLocaleString('en-US')}!`,
            ephemeral: guildConfig.channel === interaction.channelId,
        });

        if (guildConfig.webhook.id && guildConfig.webhook.token) {
            sendToWebhook(this.bot, guildConfig.webhook.id, guildConfig.webhook.token, {
                username: interaction.user.username,
                avatarURL: interaction.user.displayAvatarURL(),
                content: `*The next number is **${(count + 1).toLocaleString('en-US')}**!*`,
            });
        }
    }
}
