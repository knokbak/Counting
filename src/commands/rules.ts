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

import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from 'discord.js';
import Bot from '../utils/Bot';
import { Command } from '../utils/classes/Command';
import { GuildConfig } from '../utils/types';

export default class Ping extends Command {
    public name = 'rules';
    public description = 'Rules lets you setup automatic actions using count+.';
    public builder = new SlashCommandBuilder();

    constructor(bot: Bot) {
        super(bot);
        this.builder
            .setName(this.name)
            .setDMPermission(false)
            .setDescription(this.description)
            .addSubcommand(new SlashCommandSubcommandBuilder().setName('help').setDescription('Find out more about count+ rules.'))
            .addSubcommand(new SlashCommandSubcommandBuilder().setName('list').setDescription('View a list of all count+ rules.'))
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('view')
                    .setDescription('View or modify a specific count+ rule.')
                    .addStringOption((option) => option.setName('id').setRequired(true).setDescription('The ID of the rule to view or modify.'))
            )
            .addSubcommandGroup(
                new SlashCommandSubcommandGroupBuilder()
                    .setName('create')
                    .setDescription('Create a new count+ rule.')
                    .addSubcommand(
                        new SlashCommandSubcommandBuilder()
                            .setName('pin')
                            .setDescription('Create a new count+ rule that pins a message in the counting channel automatically.')
                            .addStringOption((option) =>
                                option
                                    .setName('type')
                                    .setRequired(true)
                                    .setDescription('When this rule should be executed.')
                                    .addChoices(
                                        { name: 'When count equals ...', value: 'equals' },
                                        { name: 'When count is a multiple of ...', value: 'multiple_of' }
                                    )
                            )
                            .addIntegerOption((option) =>
                                option
                                    .setName('count')
                                    .setRequired(true)
                                    .setDescription('The value for this rule (used by the type setting).')
                                    .setMinValue(1)
                                    .setMaxValue(100_000_000)
                            )
                    )
                    .addSubcommand(
                        new SlashCommandSubcommandBuilder()
                            .setName('send-dm')
                            .setDescription('Create a new count+ rule that sends a DM to a user automatically.')
                            .addStringOption((option) =>
                                option
                                    .setName('type')
                                    .setRequired(true)
                                    .setDescription('When this rule should be executed.')
                                    .addChoices(
                                        { name: 'When count equals ...', value: 'equals' },
                                        { name: 'When count is a multiple of ...', value: 'multiple_of' }
                                    )
                            )
                            .addIntegerOption((option) =>
                                option
                                    .setName('count')
                                    .setRequired(true)
                                    .setDescription('The value for this rule (used by the type setting).')
                                    .setMinValue(1)
                                    .setMaxValue(100_000_000)
                            )
                            .addStringOption((option) =>
                                option
                                    .setName('message-content')
                                    .setRequired(true)
                                    .setDescription('The content of the DM to send. Use {{count}} to insert the current count.')
                            )
                    )
                    .addSubcommand(
                        new SlashCommandSubcommandBuilder()
                            .setName('send-message')
                            .setDescription('Create a new count+ rule that sends a message in the counting channel automatically.')
                            .addStringOption((option) =>
                                option
                                    .setName('type')
                                    .setRequired(true)
                                    .setDescription('When this rule should be executed.')
                                    .addChoices(
                                        { name: 'When count equals ...', value: 'equals' },
                                        { name: 'When count is a multiple of ...', value: 'multiple_of' }
                                    )
                            )
                            .addIntegerOption((option) =>
                                option
                                    .setName('count')
                                    .setRequired(true)
                                    .setDescription('The value for this rule (used by the type setting).')
                                    .setMinValue(1)
                                    .setMaxValue(100_000_000)
                            )
                            .addStringOption((option) =>
                                option
                                    .setName('message-content')
                                    .setRequired(true)
                                    .setDescription('The content of the message to send. Use {{count}} to insert the current count.')
                            )
                    )
            );
    }

    public execute(interaction: ChatInputCommandInteraction, guildConfig: GuildConfig) {
        if (interaction.user.id !== process.env.BOT_OWNER_ID) {
            return interaction.reply({
                content: `:wave: Hi there! This command is still being built. Check back later!`,
                ephemeral: true,
            });
        }
    }
}
