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

import { injectable } from 'tsyringe';
import IListener from '../utils/structures/Listener.js';
import { Message, Events } from 'discord.js';
import { GuildConfigDefault } from '../utils/types.js';

@injectable()
export default class MessageCreate implements IListener<typeof Events.MessageCreate> {
    public name: Events.MessageCreate = Events.MessageCreate;

    public async execute(message: Message) {
        if (message.channel.id !== '1003780101214838917' || message.author.bot || !message.guild) return;
        if (message.content === '!test') return message.channel.send('hi!');

        // const guildConfig = this.bot.caches.guildConfigs.get(message.guild.id);
        const guildConfig = GuildConfigDefault;
    }
}

// export default class MessageCreate {
//     readonly name = 'messageCreate';
//     bot: Bot;

//     constructor(bot: Bot) {
//         this.bot = bot;
//     }

//     async handle(message: Message) {
//         if (
//             message.channel.id !== '1003780101214838917' ||
//             message.author.bot
//         ) return;

//         console.log(`${message.author.tag}: ${message.content}`);
//         message.delete();

//         if (
//             message.author.id === '534479985855954965' &&
//             message.content.startsWith('!eval ')
//         ) {
//             // TODO: move this eyesore somewhere else
//             const code = message.content.substring(6);
//             try {
//                 try {
//                     const result = await eval(code);
//                     console.log(result);
//                     message.author.send(
//                         `\`\`\`js\n${`${result}`.substring(0, 1500)}\n\`\`\``
//                     );
//                 } catch (err) {
//                     message.author.send(
//                         // @ts-ignore
//                         `\`\`\`js\n${`${err.stack}`.substring(0, 1500)}\n\`\`\``
//                     );
//                     console.error(err);
//                 }
//             } catch {}
//             return;
//         }

//         const int = Number.parseInt(message.content.replace(/\D/g, ''));
//         if (Number.isNaN(int)) return;

//         const currentCount = this.bot.caches.counts.get(message.guild!.id);

//         if (int !== currentCount + 1) {
//             try {
//                 message.author.send({
//                     content: `That number was not correct! The next number is ${(
//                         currentCount + 1
//                     ).toLocaleString('en-US')}.`,
//                 });
//             } catch {}
//             return;
//         }

//         this.bot.caches.counts.set(message.guild!.id, int);

//         const webhook = new WebhookClient(
//             {
//                 id: `${process.env.DISCORD_WEBHOOK_ID}`,
//                 token: `${process.env.DISCORD_WEBHOOK_TOKEN}`,
//             }
//         );

//         webhook.send({
//             content: `${Math.floor(int).toLocaleString('en-US')}`,
//             username: message.author.username,
//             avatarURL: message.author.displayAvatarURL(),
//         });
//     }
// }
