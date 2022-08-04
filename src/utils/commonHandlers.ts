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

import { APIMessage, GuildMember, Message, MessagePayload, User, WebhookClient, WebhookMessageOptions, MessageOptions } from 'discord.js';
import Bot from './Bot';

export function sendToWebhook(bot: Bot, id: string, token: string, options: MessagePayload | WebhookMessageOptions): Promise<APIMessage> {
    return new Promise((resolve, reject) => {
        if (bot.limitStores.webhookFailures.has(id)) {
            reject(
                new Error(
                    `Too many webhook failures; webhook is on cooldown for ${
                        bot.limitStores.webhookFailures.options.stdTTL ?? 'UNLIMITED'
                    } seconds`
                )
            );
            return;
        }

        const webhook = new WebhookClient({ id, token });
        webhook
            .send(options)
            .then(resolve)
            .catch((err) => {
                bot.limitStores.webhookFailures.set(id, Date.now());
                reject(err);
            });
    });
}

export function sendViaDirectMessages(bot: Bot, user: User | GuildMember, options: MessagePayload | MessageOptions): Promise<Message> {
    return new Promise((resolve, reject) => {
        const id = bot.client.users.resolveId(user);
        if (!id) {
            reject(new Error(`Could not resolve user ${user}`));
            return;
        }

        if (bot.limitStores.directMessageFailures.has(id)) {
            reject(
                new Error(
                    `Too many direct message failures; user is on cooldown for ${
                        bot.limitStores.directMessageFailures.options.stdTTL ?? 'UNLIMITED'
                    } seconds`
                )
            );
            return;
        }

        user.send(options)
            .then(resolve)
            .catch((err) => {
                bot.limitStores.directMessageFailures.set(id, Date.now());
                reject(err);
            });
    });
}
