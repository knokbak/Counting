import { container } from 'tsyringe';
import ICommand from './structures/Command.js';
import { kCommands } from '../tokens.js';

export default function createCommands() {
    const commands = new Map<string, ICommand>();
    container.register(kCommands, { useValue: commands });

    return commands;
}
