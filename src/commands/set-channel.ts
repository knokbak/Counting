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

import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder, TextChannel, PermissionsBitField } from 'discord.js';
import Bot from '../utils/Bot';
import { Command } from '../utils/classes/Command';
import { sendToWebhook } from '../utils/commonHandlers';
import { GuildConfig } from '../utils/types';

export default class SetChannel extends Command {
    public name = 'set-channel';
    public description = 'Sets the channel to use for counting.';
    public builder = new SlashCommandBuilder();

    constructor(bot: Bot) {
        super(bot);
        this.builder
            .setName(this.name)
            .setDescription(this.description)
            .addChannelOption((option) => option.setName('channel').setDescription('The channel to use for counting.').setRequired(true));
    }

    public async execute(interaction: ChatInputCommandInteraction, guildConfig: GuildConfig) {
        if (!interaction.member || !interaction.member.permissions) return;
        if (!interaction.memberPermissions?.has('ManageGuild') && interaction.user.id !== process.env.BOT_OWNER_ID) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        const channel = interaction.options.getChannel('channel', true) as TextChannel;

        if (!channel || !channel.viewable) {
            interaction.reply({
                content: `${this.bot.client.user} does not have access to that channel. Check its permission overwrites!`,
                ephemeral: true,
            });
            return;
        }

        if (channel.type !== ChannelType.GuildText) {
            interaction.reply({
                content: 'The channel must be a text channel.',
                ephemeral: true,
            });
            return;
        }

        const myPermissions = channel.permissionsFor(await interaction.guild!.members.fetchMe()).toArray();

        if (
            ['ManageWebhooks', 'ManageChannels', 'ManageRoles', 'SendMessages', 'EmbedLinks', 'AttachFiles', 'ReadMessageHistory'].some(
                (p: any) => !myPermissions.includes(p)
            )
        ) {
            interaction.reply({
                content: `${this.bot.client.user} does not have access the correct overwrites in that channel. Ensure I have the following permissions there: Manage Webhooks, Manage Channel, Manage Permissions, Send Messages, Embed Links, Attach Files and Read Message History.`,
                ephemeral: true,
            });
            return;
        }

        let webhook;

        try {
            webhook = await channel.createWebhook({
                name: 'github.com/knokbak/counting',
                avatar: this.bot.client.user!.displayAvatarURL(),
                reason: `${interaction.user.tag} ran the /set-channel command in ${channel.name}`,
            });
            if (!webhook || !webhook.id || !webhook.token) throw new Error('Webhook not created.');
        } catch (err) {
            console.error(err);
            interaction.reply({
                content: `I was unable to create a webhook in ${channel.name}. This is likely a temporary issue with Discord, as my permissions seem correct. Please try again.`,
                ephemeral: true,
            });
            return;
        }

        guildConfig.active = true;
        guildConfig.channel = channel.id;
        guildConfig.webhook.id = webhook.id;
        guildConfig.webhook.token = webhook.token;
        await this.bot.caches.guildConfigs.set(interaction.guildId!, guildConfig);

        await sendToWebhook(this.bot, guildConfig.webhook.id, guildConfig.webhook.token, {
            username: interaction.user.username,
            avatarURL: interaction.user.displayAvatarURL(),
            content: `*Created a webhook and set ${channel} as the channel to use for counting.*`,
        });

        interaction.reply({
            content: `${this.bot.client.user} is now counting in ${channel.name}! To view the next count, use the \`/current\` command. If you had an old channel, you should delete ${this.bot.client.user}'s webhook in that channel's settings.`,
            ephemeral: true,
        });
    }
}
