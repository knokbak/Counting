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
import { Events } from 'discord.js';

@injectable()
export default class MessageCreate implements IListener<typeof Events.ClientReady> {
    public name: Events.ClientReady = Events.ClientReady;

    public async execute() {
        console.log(`Logged in!`);
    }
}
