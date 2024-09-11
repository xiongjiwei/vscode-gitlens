/*global*/
import './home.scss';
import { consume } from '@lit/context';
import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { getApplicablePromo } from '../../../plus/gk/account/promos';
import type { State } from '../../home/protocol';
import { CollapseSectionCommand } from '../../home/protocol';
import { GlApp } from '../shared/app';
import type { HostIpc } from '../shared/ipc';
import { stateContext } from './context';
import { homeStyles } from './home.css';
import { HomeStateProvider } from './stateProvider';
import '../shared/components/button';
import '../shared/components/code-icon';
import '../shared/components/feature-badge';
import '../shared/components/overlays/tooltip';
import '../shared/components/promo';
import '../plus/account/components/account-content';
import './components/feature-nav';
import './components/repo-alerts';

@customElement('gl-home-app')
export class GlHomeApp extends GlApp<State> {
	static override styles = [homeStyles];

	private badgeSource = { source: 'home', detail: 'badge' };

	protected override createStateProvider(state: State, ipc: HostIpc) {
		return new HomeStateProvider(this, state, ipc);
	}

	@consume<State>({ context: stateContext, subscribe: true })
	@state()
	private _state!: State;

	get alertVisibility() {
		const sections = {
			header: false,
			untrusted: false,
			noRepo: false,
			unsafeRepo: false,
		};
		if (this._state == null) {
			return sections;
		}

		if (!this._state.repositories.trusted) {
			sections.header = true;
			sections.untrusted = true;
		} else if (this._state.repositories.openCount === 0) {
			sections.header = true;
			sections.noRepo = true;
		} else if (this._state.repositories.hasUnsafe) {
			sections.header = true;
			sections.unsafeRepo = true;
		}

		return sections;
	}
	private onSectionExpandClicked(e: MouseEvent, isToggle = false) {
		if (isToggle) {
			e.stopImmediatePropagation();
		}
		const target = (e.target as HTMLElement).closest('[data-section-expand]') as HTMLElement;
		const section = target?.dataset.sectionExpand;
		if (section !== 'walkthrough') {
			return;
		}

		if (isToggle) {
			this.updateCollapsedSections(!this._state.walkthroughCollapsed);
			return;
		}

		this.updateCollapsedSections(false);
	}

	private updateCollapsedSections(toggle = this._state.walkthroughCollapsed) {
		this._state.walkthroughCollapsed = toggle;
		this.requestUpdate();
		this._ipc.sendCommand(CollapseSectionCommand, {
			section: 'walkthrough',
			collapsed: toggle,
		});
	}

	renderAlerts() {
		if (this._state == null || !this.alertVisibility.header) {
			return;
		}

		return html`
			<header class="home__header" id="header" ?hidden=${!this.alertVisibility.header}>
				${when(
					this.alertVisibility.noRepo,
					() => html`
						<div id="no-repo-alert" class="alert alert--info mb-0" ?hidden=${!this.alertVisibility.noRepo}>
							<h1 class="alert__title">No repository detected</h1>
							<div class="alert__description">
								<p>
									To use GitLens, open a folder containing a git repository or clone from a URL from
									the Explorer.
								</p>
								<p class="centered">
									<gl-button class="is-basic" href="command:workbench.view.explorer"
										>Open a Folder or Repository</gl-button
									>
								</p>
								<p class="mb-0">
									If you have opened a folder with a repository, please let us know by
									<a
										class="one-line"
										href="https://github.com/gitkraken/vscode-gitlens/issues/new/choose"
										>creating an Issue</a
									>.
								</p>
							</div>
						</div>
					`,
				)}
				${when(
					this.alertVisibility.unsafeRepo,
					() => html`
						<div
							id="unsafe-repo-alert"
							class="alert alert--info mb-0"
							?hidden=${!this.alertVisibility.unsafeRepo}
						>
							<h1 class="alert__title">Unsafe repository</h1>
							<div class="alert__description">
								<p>
									Unable to open any repositories as Git blocked them as potentially unsafe, due to
									the folder(s) not being owned by the current user.
								</p>
								<p class="centered">
									<gl-button class="is-basic" href="command:workbench.view.scm"
										>Manage in Source Control</gl-button
									>
								</p>
							</div>
						</div>
					`,
				)}
				${when(
					this.alertVisibility.untrusted,
					() => html`
						<div
							id="untrusted-alert"
							class="alert alert--info mb-0"
							aria-hidden="true"
							?hidden=${!this.alertVisibility.untrusted}
						>
							<h1 class="alert__title">Untrusted workspace</h1>
							<div class="alert__description">
								<p>Unable to open repositories in Restricted Mode.</p>
								<p class="centered">
									<gl-button class="is-basic" href="command:workbench.trust.manage"
										>Manage Workspace Trust</gl-button
									>
								</p>
							</div>
						</div>
					`,
				)}
			</header>
		`;
	}

	override render() {
		return html`
			<div class="home scrollable">
				<gl-repo-alerts class="home__header"></gl-repo-alerts>
				<main class="home__main scrollable" id="main">
					${when(
						this.alertVisibility.header,
						() => html`
							<p data-requires="norepo">
								<code-icon icon="question"></code-icon> Features which need a repository are currently
								unavailable
							</p>
						`,
					)}
					<div
						id="section-walkthrough"
						data-section-expand="walkthrough"
						class="alert${this.state.walkthroughCollapsed ? ' is-collapsed' : ''}"
						@click=${(e: MouseEvent) => this.onSectionExpandClicked(e)}
					>
						<h1 class="alert__title">Get Started with GitLens</h1>
						<div class="alert__description">
							<p>Explore all of the powerful features in GitLens</p>
							<p class="button-container button-container--trio">
								<gl-button
									appearance="secondary"
									full
									href="command:gitlens.showWelcomePage"
									aria-label="Open Welcome"
									>Start Here (Welcome)</gl-button
								>
								<span class="button-group button-group--single">
									<gl-button appearance="secondary" full href="command:gitlens.getStarted?%22home%22"
										>Walkthrough</gl-button
									>
									<gl-button
										appearance="secondary"
										full
										href=${'https://youtu.be/oJdlGtsbc3U?utm_source=inapp&utm_medium=home_banner&utm_id=GitLens+tutorial'}
										aria-label="Watch the GitLens Tutorial video"
										tooltip="Watch the GitLens Tutorial video"
										><code-icon icon="vm-running" slot="prefix"></code-icon>Tutorial</gl-button
									>
								</span>
							</p>
						</div>
						<a
							href="#"
							class="alert__close"
							data-section-toggle="walkthrough"
							@click=${(e: MouseEvent) => this.onSectionExpandClicked(e, true)}
						>
							<gl-tooltip hoist>
								<code-icon icon="chevron-down" aria-label="Collapse walkthrough section"></code-icon>
								<span slot="content">Collapse</span>
							</gl-tooltip>
							<gl-tooltip hoist>
								<code-icon icon="chevron-right" aria-label="Expand walkthrough section"></code-icon>
								<span slot="content">Expand</span>
							</gl-tooltip>
						</a>
					</div>
					<gl-feature-nav .badgeSource=${this.badgeSource}></gl-feature-nav>
				</main>

				<footer class="home__footer">
					<account-content id="account-content">
						<div class="home__nav">
							<gl-promo
								.promo=${getApplicablePromo(this.state.subscription.state)}
								class="promo-banner promo-banner--eyebrow"
								id="promo"
								type="link"
							></gl-promo>
							<nav class="inline-nav" id="links" aria-label="Help and Resources">
								<div class="inline-nav__group">
									<gl-tooltip hoist>
										<a
											class="inline-nav__link inline-nav__link--text"
											href="https://help.gitkraken.com/gitlens/gitlens-release-notes-current/"
											aria-label="What's New"
											><code-icon icon="megaphone"></code-icon><span>What's New</span></a
										>
										<span slot="content">What's New</span>
									</gl-tooltip>
									<gl-tooltip hoist>
										<a
											class="inline-nav__link inline-nav__link--text"
											href="https://help.gitkraken.com/gitlens/gitlens-home/"
											aria-label="Help Center"
											><code-icon icon="question"></code-icon><span>Help</span></a
										>
										<span slot="content">Help Center</span>
									</gl-tooltip>
									<gl-tooltip hoist>
										<a
											class="inline-nav__link inline-nav__link--text"
											href="https://github.com/gitkraken/vscode-gitlens/issues"
											aria-label="Feedback"
											><code-icon icon="feedback"></code-icon><span>Feedback</span></a
										>
										<span slot="content">Feedback</span>
									</gl-tooltip>
								</div>
								<div class="inline-nav__group">
									<gl-tooltip hoist>
										<a
											class="inline-nav__link"
											href="https://github.com/gitkraken/vscode-gitlens/discussions"
											aria-label="GitHub Discussions"
											><code-icon icon="comment-discussion"></code-icon
										></a>
										<span slot="content">GitHub Discussions</span>
									</gl-tooltip>
									<gl-tooltip hoist>
										<a
											class="inline-nav__link"
											href="https://github.com/gitkraken/vscode-gitlens"
											aria-label="GitHub Repo"
											><code-icon icon="github"></code-icon
										></a>
										<span slot="content">GitHub Repo</span>
									</gl-tooltip>
									<gl-tooltip hoist>
										<a
											class="inline-nav__link"
											href="https://twitter.com/gitlens"
											aria-label="@gitlens on Twitter"
											><code-icon icon="twitter"></code-icon
										></a>
										<span slot="content">@gitlens on Twitter</span>
									</gl-tooltip>
									<gl-tooltip hoist>
										<a
											class="inline-nav__link"
											href=${'https://gitkraken.com/gitlens?utm_source=gitlens-extension&utm_medium=in-app-links&utm_campaign=gitlens-logo-links'}
											aria-label="GitLens Website"
											><code-icon icon="globe"></code-icon
										></a>
										<span slot="content">GitLens Website</span>
									</gl-tooltip>
								</div>
							</nav>
						</div>
					</account-content>
				</footer>
			</div>
		`;
	}
}
