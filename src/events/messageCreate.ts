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

import { Message, Events, WebhookClient } from 'discord.js';
import { CountEntryDefault, GuildConfigDefault } from '../utils/types';
import { Listener } from '../utils/classes/Listener';
import { sendToWebhook, sendViaDirectMessages } from '../utils/commonHandlers';

export default class MessageCreate extends Listener<typeof Events.MessageCreate> {
    public name: Events.MessageCreate = Events.MessageCreate;

    public async execute(message: Message) {
        try {
            if (message.channel.id !== '1003780101214838917' || message.author.bot || !message.guild) return;

            const defConfig = GuildConfigDefault;
            defConfig.id = message.guild.id;
            const guildConfig = await this.bot.caches.guildConfigs.ensure(defConfig.id, defConfig);
            if (!guildConfig.active || !guildConfig.webhook.id || !guildConfig.webhook.token || !guildConfig.channel) return;

            const defCount = CountEntryDefault;
            defCount.guild = message.guild.id;
            const currentCount = await this.bot.caches.counts.ensure(message.guild.id, defCount);
            const nextCount = currentCount.count + 1;
            const providedInt = Number.parseInt(`${message.content}`.replace(/[^0-9]/g, ''));

            if (
                Number.isNaN(providedInt) &&
                (message.member?.permissions.has('ManageMessages') || message.author.id === process.env.BOT_OWNER_ID)
            ) {
                return;
            }

            if (message.deletable) {
                message.delete().catch(console.error);
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
                await this.bot.caches.counts.set(message.guild.id, currentCount, true);

                await sendToWebhook(this.bot, guildConfig.webhook.id, guildConfig.webhook.token, {
                    username: message.author.username,
                    avatarURL: message.author.displayAvatarURL(),
                    content: providedInt.toLocaleString('en-US'),
                });
            } else {
                await sendViaDirectMessages(this.bot, message.author, {
                    content: `That was not the correct number! The next count is **${nextCount.toLocaleString('en-US')}**.`,
                });
            }
        } catch (err) {
            console.error(err);
        }
    }
}
