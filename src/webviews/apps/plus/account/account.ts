import './account.scss';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { State } from '../../../../plus/webviews/account/protocol';
import { GlApp } from '../../shared/app';
import type { HostIpc } from '../../shared/ipc';
import './components/account-content';
import { AccountStateProvider } from './stateProvider';

@customElement('gl-account-app')
export class GlAccountApp extends GlApp<State> {
	// override connectedCallback() {
	// 	super.connectedCallback();

	// 	this.addEventListener('click', this.onClick);
	// }

	// override disconnectedCallback() {
	// 	super.disconnectedCallback();

	// 	this.removeEventListener('click', this.onClick);
	// }

	protected override createStateProvider(state: State, ipc: HostIpc) {
		return new AccountStateProvider(this, state, ipc);
	}

	override render() {
		return html`<account-content id="account-content"></account-content>`;
	}

	// private onClick = (e: MouseEvent) => {
	// 	if (!(e.target instanceof HTMLElement)) return;

	// 	e.preventDefault();

	// 	const target = e.target.closest('[data-action]') as HTMLElement;
	// 	if (target?.hasAttribute('data-action')) {
	// 		const action = target.dataset.action;
	// 		if (action?.startsWith('command:')) {
	// 			this._ipc.sendCommand(ExecuteCommand, { command: action.slice(8) });
	// 		}
	// 	}
	// };
}
