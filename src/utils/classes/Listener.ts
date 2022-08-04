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

import { Awaitable, ClientEvents } from 'discord.js';
import Bot from '../Bot';

export abstract class Listener<T extends keyof ClientEvents | symbol> {
    abstract name: string;
    once: boolean = false;
    bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    abstract execute(...args: T extends keyof ClientEvents ? ClientEvents[T] : unknown[]): Awaitable<unknown>;
}
