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

import { Awaitable, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Bot from '../Bot';
import { GuildConfig } from '../types';

export abstract class Command {
    abstract name: string;
    abstract description: string;
    ownerOnly: boolean = false;
    abstract builder: SlashCommandBuilder;
    bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    abstract execute(interaction: ChatInputCommandInteraction, guildConfig: GuildConfig): Awaitable<unknown>;
}
