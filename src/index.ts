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

import Dotenv from 'dotenv';
Dotenv.config();

import Bot from './utils/Bot';
import createClient from './utils/client';
import readdirp from 'readdirp';
import { GatewayIntentBits } from 'discord.js';
import { join } from 'path';

const client = createClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
    allowedMentions: {
        parse: ['users'],
    },
});

const commandFiles = readdirp(join(__dirname + '/commands/'), { fileFilter: '*.js' });
const listenerFiles = readdirp(join(__dirname + '/events/'), { fileFilter: '*.js' });

const bot = new Bot(client, commandFiles, listenerFiles);
bot.init();
