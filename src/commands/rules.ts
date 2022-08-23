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

import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import Bot from '../utils/Bot';
import { Command } from '../utils/classes/Command';
import { GuildConfig, GuildRule } from '../utils/types';
import { parseJoshFilterResponse } from '../utils/commonHandlers';
import UniqId from 'uniqid';

export default class Rules extends Command {
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
                    .setDescription('View information on a specific count+ rule.')
                    .addStringOption((option) => option.setName('id').setRequired(true).setDescription('The ID of the rule to view.'))
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('delete')
                    .setDescription('Delete a specific count+ rule. This is permanent and irreversible.')
                    .addStringOption((option) => option.setName('id').setRequired(true).setDescription('The ID of the rule to delete.'))
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
                                    .setName('value')
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
                                    .setName('value')
                                    .setRequired(true)
                                    .setDescription('The value for this rule (used by the type setting).')
                                    .setMinValue(1)
                                    .setMaxValue(100_000_000)
                            )
                            .addStringOption((option) =>
                                option
                                    .setName('content')
                                    .setRequired(true)
                                    .setMaxLength(1_000)
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
                                    .setName('value')
                                    .setRequired(true)
                                    .setDescription('The value for this rule (used by the type setting).')
                                    .setMinValue(1)
                                    .setMaxValue(100_000_000)
                            )
                            .addStringOption((option) =>
                                option
                                    .setName('content')
                                    .setRequired(true)
                                    .setMaxLength(1_000)
                                    .setDescription('The content of the message to send. Use {{count}} to insert the current count.')
                            )
                    )
            );
    }

    public async execute(interaction: ChatInputCommandInteraction, guildConfig: GuildConfig) {
        if (!interaction.member || !interaction.member.permissions) return;
        if (!interaction.memberPermissions?.has('ManageGuild') && interaction.user.id !== process.env.BOT_OWNER_ID) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        const topCommand = interaction.options.getSubcommandGroup(false) || interaction.options.getSubcommand(true);
        switch (topCommand) {
            case 'help': {
                const embed = new EmbedBuilder()
                    .setColor([242, 17, 17])
                    .setAuthor({
                        name: 'count+ rules',
                        iconURL: this.bot.client.user?.displayAvatarURL(),
                        url: 'https://github.com/knokbak/Counting',
                    })
                    .setDescription(
                        'With count+, you can create rules that automatically perform actions when certian conditions are met. This ' +
                            'means that you can create rules to, for example, pin every count that is a multiple of 10,000.'
                    )
                    .addFields([
                        {
                            name: 'Rule types',
                            value:
                                '**Equal to:** When the count reaches a specific value, execute the rule.\n' +
                                '**Multiple of:** When the count becomes a multiple of a specific value (`c % v === 0`), execute the rule.\n',
                        },
                        {
                            name: 'Rule actions',
                            value:
                                '**Pin message:** Pin a message in the counting channel. If you have hit the pin limit (50), count+ will automatically ' +
                                'unpin the oldest message *sent by a webhook*. If it cannot unpin that message, it will not pin anymore messages.\n' +
                                '**Send DM:** Send a DM to a user. You can use `{{count}}` in your message content to refer to the current count. If ' +
                                'count+ fails to send a message to the user, it will not try to send any more messages to that user for a few minutes.\n' +
                                '**Send message:** Send a message in the counting channel. You can use `{{count}}` in your message content to refer to ' +
                                'the current count. You can also use `{{user}}` to ping the user who counted the message.',
                        },
                        {
                            name: 'Examples',
                            value:
                                'Create a rule that pins every 10,000th message:\n' +
                                '`/rules create pin multiple_of 10000`\n' +
                                '... or instead, send a DM to the user who counts the 10,000th number:\n' +
                                '`/rules create send-dm multiple_of 10000 "You just counted the {{count}}th number. Thanks for playing!"`\n' +
                                '... or instead, send the message to the entire channel:\n' +
                                '`/rules create send-message multiple_of 10000 "{{user}} just counted the {{count}}th number. GG!"`',
                        },
                    ])
                    .setFooter({
                        text: 'Made with ❤️ by olli#2075 & contributors',
                    });
                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }
            case 'list': {
                const rules = parseJoshFilterResponse<GuildRule>(await this.bot.databases.rules.filter('guild', guildConfig.id));
                if (rules.length === 0) {
                    return interaction.reply({
                        content: "You haven't created any rules yet!",
                        ephemeral: true,
                    });
                }
                const array: string[] = [];
                for (let i = 0; i < rules.length; i++) {
                    const value = rules[i][1] as unknown as GuildRule;
                    array.push(
                        `\`${value.id}\` - If ${ruleTypeToString(value.type)} ${value.value.toLocaleString('en-US')}: ${ruleActionTypeToString(
                            value.action.type
                        )}`
                    );
                }
                console.log(rules, array);
                const embed = new EmbedBuilder()
                    .setColor([242, 17, 17])
                    .setAuthor({
                        name: 'All active rules',
                        iconURL: this.bot.client.user?.displayAvatarURL(),
                        url: 'https://github.com/knokbak/Counting',
                    })
                    .setDescription(array.join('\n'))
                    .setFooter({
                        text: 'View: /rules view <id> | Delete: /rules delete <id>',
                    });
                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }
            case 'view': {
                const ruleId = interaction.options.getString('id', true);
                const rule = await this.bot.databases.rules.get(ruleId);
                if (!rule || (rule.guild !== guildConfig.id && interaction.user.id !== process.env.BOT_OWNER_ID)) {
                    return interaction.reply({
                        content: `Rule \`${ruleId}\` was not found.`,
                        ephemeral: true,
                    });
                }
                let actionText = ruleActionTypeToString(rule.action.type);
                if ('content' in rule.action) {
                    switch (rule.action.type) {
                        case 'send_dm': {
                            actionText = `send "${rule.action.content}" to the user who counted`;
                            break;
                        }
                        case 'send_message': {
                            actionText = `send "${rule.action.content}" to the counting channel`;
                            break;
                        }
                    }
                }
                const embed = new EmbedBuilder()
                    .setColor([242, 17, 17])
                    .setAuthor({
                        name: `Rule ${rule.id}`,
                        iconURL: this.bot.client.user?.displayAvatarURL(),
                        url: 'https://github.com/knokbak/Counting',
                    })
                    .addFields([
                        {
                            name: 'Rule ID',
                            value: rule.id,
                            inline: true,
                        },
                        {
                            name: 'Server ID',
                            value: rule.guild,
                            inline: true,
                        },
                        {
                            name: 'State',
                            value: 'Active',
                            inline: true,
                        },
                        {
                            name: 'Expression',
                            value:
                                `\`\`\`\n` +
                                `ONCE the count is ${ruleTypeToString(rule.type)} ${rule.value.toLocaleString('en-US')}\n` +
                                `IMMEDIATELY ${actionText}\n` +
                                `\`\`\``,
                        },
                    ])
                    .setFooter({
                        text: `Delete: /rules delete ${rule.id}`,
                    });
                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }
            case 'delete': {
                const ruleId = interaction.options.getString('id', true);
                const rule = await this.bot.databases.rules.get(ruleId);
                if (!rule || (rule.guild !== guildConfig.id && interaction.user.id !== process.env.BOT_OWNER_ID)) {
                    return interaction.reply({
                        content: `Rule \`${ruleId}\` was not found.`,
                        ephemeral: true,
                    });
                }
                await this.bot.databases.rules.delete(ruleId);
                return interaction.reply({
                    content: `Rule \`${ruleId}\` has been deleted.`,
                    ephemeral: true,
                });
            }
            case 'create': {
                const rules = parseJoshFilterResponse<GuildRule>(await this.bot.databases.rules.filter('guild', guildConfig.id));
                if (rules.length >= 3) {
                    return interaction.reply({
                        content:
                            'You can only have 3 rules active at once. Delete one using `/rules list` and `/rules delete <id>` before creating a new one.',
                        ephemeral: true,
                    });
                }

                const subcommand = interaction.options.getSubcommand(true);
                const type = interaction.options.getString('type', true);
                const value = interaction.options.getInteger('value', true);
                const id = UniqId();
                const entry: any = {
                    id: id,
                    guild: guildConfig.id,
                    trigger: 'count',
                    type: type as any,
                    value: value,
                    action: {},
                };

                switch (subcommand) {
                    case 'pin': {
                        entry.action.type = 'pin';
                        await this.bot.databases.rules.set(id, entry);
                        break;
                    }
                    case 'send-dm': {
                        const content = interaction.options.getString('content', true);
                        entry.action.type = 'send_dm';
                        entry.action.content = content;
                        await this.bot.databases.rules.set(id, entry);
                        break;
                    }
                    case 'send-message': {
                        const content = interaction.options.getString('content', true);
                        entry.action.type = 'send_message';
                        entry.action.content = content;
                        await this.bot.databases.rules.set(id, entry);
                        break;
                    }
                }

                return interaction.reply({
                    content: `Your rule has been created. View it using \`/rules view ${id}\`.`,
                    ephemeral: true,
                });
            }
        }
    }
}

function ruleTypeToString(type: string) {
    switch (type) {
        case 'multiple_of':
            return 'a multiple of';
        case 'equals':
            return 'equal to';
        default:
            return type;
    }
}

function ruleActionTypeToString(type: string) {
    switch (type) {
        case 'pin':
            return 'pin message';
        case 'send_dm':
            return 'send message to the user who counted';
        case 'send_message':
            return 'send message in the counting channel';
        default:
            return type;
    }
}
