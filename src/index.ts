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

import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from 'discord.js';
import { readdirSync } from 'fs';
import Path from 'path';

export default class Bot {
    client: Client = new Client({
        intents: ['Guilds', 'GuildMessages', 'MessageContent'],
        allowedMentions: {
            parse: ['users'],
        },
    });

    async init() {
        for (const file of readdirSync(Path.join(__dirname, 'events'))) {
            const Handler = require(Path.join(__dirname, 'events', file));
            const handler = new Handler.default(this);
            this.client.on(handler.name, handler.handle.bind(handler));
        }

        this.client.login(process.env.DISCORD_TOKEN);
    }
}
