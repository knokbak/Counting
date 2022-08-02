import { ClientEvents, Awaitable } from 'discord.js';

export default interface IListener<T extends keyof ClientEvents | symbol> {
    name: T;
    once?: boolean;

    execute: (...args: T extends keyof ClientEvents ? ClientEvents[T] : unknown[]) => Awaitable<unknown>;
}
