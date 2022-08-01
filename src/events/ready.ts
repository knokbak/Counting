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

import Bot from '../index';
import { ActivityType } from 'discord-api-types/v10';

export default class Ready {
    readonly name = 'ready';
    bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    async handle() {
        console.log(`Logged in as ${this.bot.client.user?.tag}!`);
        this.bot.client.user?.setPresence({
            status: 'dnd',
            activities: [
                {
                    name: "Sound's World",
                    type: ActivityType.Watching,
                },
            ],
        });
    }
}
