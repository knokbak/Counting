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

import { Message, Events, ChannelType, TextChannel } from 'discord.js';
import { CountEntryDefault, GuildConfigDefault } from '../utils/types';
import { Listener } from '../utils/classes/Listener';
import { sendToWebhook, sendViaDirectMessages } from '../utils/commonHandlers';
import { RateLimiterRes } from 'rate-limiter-flexible';

export default class MessageCreate extends Listener<typeof Events.MessageCreate> {
    public name: Events.MessageCreate = Events.MessageCreate;

    public async execute(message: Message) {
        try {
            if (!message.author.bot && !message.guild && !message.guildId) {
                this.bot.rateLimiters.command
                    .consume(message.author.id, 1)
                    .then(() => {
                        message.author.send({
                            content:
                                'Under the GNU Affero General Public License, you may have a right to recieve this ' +
                                "bot's source code. An unmodified version of knokbak/counting can be found on " +
                                'GitHub @ <https://github.com/knokbak/counting>.\n' +
                                '```\n' +
                                'https://github.com/knokbak/counting\n' +
                                'Copyright (C) 2022  knokbak\n' +
                                '\n' +
                                'This program is free software: you can redistribute it and/or modify\n' +
                                'it under the terms of the GNU Affero General Public License as published\n' +
                                'by the Free Software Foundation, either version 3 of the License, or\n' +
                                '(at your option) any later version.\n' +
                                '\n' +
                                'This program is distributed in the hope that it will be useful,\n' +
                                'but WITHOUT ANY WARRANTY; without even the implied warranty of\n' +
                                'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n' +
                                'GNU Affero General Public License for more details.\n' +
                                '\n' +
                                'You should have received a copy of the GNU Affero General Public License\n' +
                                'along with this program.  If not, see <https://www.gnu.org/licenses/>.\n' +
                                '```',
                        });
                    })
                    .catch(() => {});
                return;
            }

            if (message.author.bot || !message.guild || message.channel.type !== ChannelType.GuildText) return;
            const channel = message.channel as unknown as TextChannel;

            const defConfig = GuildConfigDefault;
            defConfig.id = message.guild.id;
            const guildConfig = await this.bot.caches.guildConfigs.ensure(defConfig.id, defConfig);

            if (
                !guildConfig.active ||
                !guildConfig.webhook.id ||
                !guildConfig.webhook.token ||
                !guildConfig.channel ||
                guildConfig.channel !== channel.id
            ) {
                return;
            }

            const myPermissions = channel.permissionsFor(await message.guild.members.fetchMe()).toArray();

            if (
                ['ManageWebhooks', 'ManageChannels', 'ManageRoles', 'SendMessages', 'EmbedLinks', 'AttachFiles', 'ReadMessageHistory'].some(
                    (p: any) => !myPermissions.includes(p)
                )
            ) {
                return;
            }

            const defCount = CountEntryDefault;
            defCount.guild = message.guild.id;
            const currentCount = await this.bot.caches.counts.ensure(message.guild.id, defCount);
            const nextCount = currentCount.count + 1;
            const providedInt = Number.parseInt(`${message.content}`.replace(/[^0-9]/g, ''));

            if (
                (Number.isNaN(providedInt) || (providedInt !== nextCount && Number.isNaN(parseInt(message.content)))) &&
                (message.member!.permissions.has('ManageMessages') ||
                    channel.permissionsFor(message.author)!.has('ManageMessages') ||
                    message.author.id === process.env.BOT_OWNER_ID)
            ) {
                return;
            }

            if (message.deletable) {
                message.delete().catch(console.error);
            }

            this.bot.rateLimiters.guildMessages
                .consume(message.guild.id, 1)
                .then(() => {
                    this.bot.rateLimiters.message
                        .consume(message.author.id, 1)
                        .then(async () => {
                            try {
                                if (channel.rateLimitPerUser < 3) {
                                    channel
                                        .setRateLimitPerUser(3, "To prevent abuse, the channel's slowmode must be set to at least 3 seconds")
                                        .catch(() => {});
                                }

                                if (currentCount.lastCounter === message.author.id) {
                                    await sendViaDirectMessages(this.bot, message.author, {
                                        content: `You have already counted in ${message.channel}! Wait for someone else to count before you count again.`,
                                    });
                                    return;
                                }

                                if (providedInt === nextCount) {
                                    currentCount.lastCounter = message.author.id;
                                    currentCount.count = nextCount;
                                    await this.bot.caches.counts.set(message.guild!.id, currentCount, true);

                                    await sendToWebhook(this.bot, guildConfig.webhook.id!, guildConfig.webhook.token!, {
                                        username: message.member!.displayName,
                                        avatarURL: message.author.displayAvatarURL(),
                                        content: providedInt.toLocaleString('en-US'),
                                    });

                                    if (providedInt % 1_000_000 === 0) {
                                        const estSeconds = providedInt * 3;
                                        const estDays = Math.floor(estSeconds / 86400);
                                        let ggMessage: Message = null!;
                                        if (providedInt === 1_000_000) {
                                            ggMessage = await message.channel.send({
                                                content: `*We've counted to **1 million**! That means everyone's collectively spent around ${estDays} days counting! That's insane. GG!*`,
                                            });
                                        } else {
                                            ggMessage = await message.channel.send({
                                                content: `*We've counted to another million! That means everyone's collectively spent around ${estDays} days counting! That's insane. GG!*`,
                                            });
                                        }
                                        if (myPermissions.includes('AddReactions')) {
                                            await ggMessage.react('🎉');
                                        }
                                    }
                                } else {
                                    await sendViaDirectMessages(this.bot, message.author, {
                                        content: `That was not the correct number! The next count is **${nextCount.toLocaleString('en-US')}**.`,
                                    });
                                }
                            } catch (err) {
                                console.error(err);
                            }
                        })
                        .catch(() => {});
                })
                .catch((rateLimit: RateLimiterRes) => {
                    if (!rateLimit.isFirstInDuration) return;
                    console.warn(
                        `[${new Date().toISOString()}] ${message.guild!.name} (${message.guild!.id}) has been (guild-level) rate limited`
                    );
                    message.channel
                        .send({
                            content:
                                "*Whoops! It seems that this server has quite high traffic levels. So everything doesn't crash and burn into a massive pit of fire and destruction, messages won't be recognised for a few seconds.*",
                        })
                        .catch(() => {});
                });
        } catch (err) {
            console.error(err);
        }
    }
}
