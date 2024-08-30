import { createContext } from '@lit/context';
import type { State } from '../../../../plus/webviews/account/protocol';

export const stateContext = createContext<State>('state');
