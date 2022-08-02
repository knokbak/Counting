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

import 'reflect-metadata';

import * as Dotenv from 'dotenv';
Dotenv.config();

import Bot from './utils/Bot.js';
import createClient from './utils/client.js';
import createCommands from './utils/commands.js';
import createListeners from './utils/listeners.js';
import readdirp from 'readdirp';
import { fileURLToPath } from 'url';
import { GatewayIntentBits } from 'discord.js';

const client = createClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    allowedMentions: {
        parse: ['users'],
    },
});

const commands = createCommands();
const listeners = createListeners();

const commandFiles = readdirp(fileURLToPath(new URL('./commands', import.meta.url)), { fileFilter: '*.js' });
const listenerFiles = readdirp(fileURLToPath(new URL('./events', import.meta.url)), { fileFilter: '*.js' });

const bot = new Bot(client, commandFiles, listenerFiles);
await bot.init(commands, listeners);
