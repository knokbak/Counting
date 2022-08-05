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

import { Interaction, Events } from 'discord.js';
import { RateLimiterRes } from 'rate-limiter-flexible';
import { Listener } from '../utils/classes/Listener';
import { GuildConfigDefault } from '../utils/types';

export default class InteractionCreate extends Listener<typeof Events.InteractionCreate> {
    public name: Events.InteractionCreate = Events.InteractionCreate;

    public async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.guild) {
            const rateLimit = await this.bot.rateLimiters.guildCommands
                .consume(interaction.guild.id, 1)
                .then(() => null)
                .catch((x) => x);
            if (rateLimit instanceof RateLimiterRes) {
                if (!rateLimit.isFirstInDuration) return;
                console.warn(
                    `[${new Date().toISOString()}] ${interaction.guild.name} (${interaction.guild.id}) has been (guild-level) rate limited`
                );
                interaction.reply({
                    content:
                        "Whoops! It seems that this server has quite high traffic levels. So everything doesn't crash and burn into a massive pit of fire and destruction, commands from this server won't be recognised for a few seconds.",
                    ephemeral: true,
                });
                return;
            }
        }

        this.bot.rateLimiters.command
            .consume(interaction.user.id, 1)
            .then(async () => {
                try {
                    const command = this.bot.commands.get(interaction.commandName.toLowerCase());
                    if (!command) return console.warn(`Command ${interaction.commandName} not found`);

                    let guildConfig = null;

                    if (interaction.guild) {
                        const defConfig = GuildConfigDefault;
                        defConfig.id = interaction.guild.id;
                        guildConfig = await this.bot.caches.guildConfigs.ensure(defConfig.id, defConfig);
                        console.log(
                            `[${new Date().toISOString()}] ${interaction.user.tag} (${interaction.user.id}) used command /${
                                interaction.commandName
                            } in ${interaction.guild.name} (${interaction.guild.id})`
                        );
                    } else {
                        console.log(
                            `[${new Date().toISOString()}] ${interaction.user.tag} (${interaction.user.id}) used command /${
                                interaction.commandName
                            }`
                        );
                    }

                    return await command.execute.bind(command)(interaction, guildConfig);
                } catch (err) {
                    console.error(err);
                }
            })
            .catch((rateLimit: RateLimiterRes) => {
                if (!rateLimit.isFirstInDuration) {
                    this.bot.rateLimiters.command.block(interaction.user.id, 5);
                    console.warn(
                        `[${new Date().toISOString()}] ${interaction.user.tag} (${interaction.user.id}) has been rate limited; timer reset`
                    );
                    return;
                }
                console.warn(`[${new Date().toISOString()}] ${interaction.user.tag} (${interaction.user.id}) has been rate limited`);
                interaction.reply({
                    content: `You have been rate limited. Please wait ${Math.ceil(
                        rateLimit.msBeforeNext / 1000
                    )} seconds before using this command again. If you don't wait, your time restriction will be reset and you'll have to wait longer. *You won't receive further replies until your limit is lifted.*`,
                    ephemeral: true,
                });
            });
    }
}
