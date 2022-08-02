import { container } from 'tsyringe';
import IListener from './structures/Listener.js';
import { kListeners } from '../tokens.js';

export default function createListeners() {
    const listeners = new Map<string, IListener<any>>();
    container.register(kListeners, { useValue: listeners });

    return listeners;
}
