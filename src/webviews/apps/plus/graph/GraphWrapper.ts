import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import type { State } from '../../../../plus/webviews/graph/protocol';
import { stateContext } from './context';
import './graph-container';
import { GlTooltip } from '../../shared/components/overlays/tooltip.react';
import { GlPopover } from '../../shared/components/overlays/popover.react';
import { GlButton } from '../../shared/components/button.react';
import { GlSearchBox } from '../../shared/components/search/react';
import { GlFeatureBadge } from '../../shared/components/react/feature-badge';
import { GlFeatureGate } from '../../shared/components/react/feature-gate';
import { GlGraphHover } from './hover/graphHover.react';
import { GlGraphMinimapContainer } from './minimap/minimap-container.react';
import { GlGraphSideBar } from './sidebar/sidebar.react';
import { GlIssuePullRequest } from '../../shared/components/react/issue-pull-request';
import { GlConnect } from '../../shared/components/integrations/connect.react';
import { GlMarkdown } from '../../shared/components/markdown/markdown.react';
import { GlCheckbox } from '../../shared/components/checkbox';
import { GlRadio, GlRadioGroup } from '../../shared/components/radio/radio.react';
import { MenuDivider, MenuItem, MenuLabel } from '../../shared/components/menu/react';
import { SlSelect, SlOption } from '@shoelace-style/shoelace';

@customElement('gl-graph-wrapper')
export class GlGraphWrapper extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property({ type: Object })
  @consume({ context: stateContext, subscribe: true })
  state!: State;

  render() {
    return html`
      <div class="graph-wrapper">
        ${this.renderHeaderRow1()}
        ${this.renderHeaderRow2()}
        ${this.renderHeaderRow3()}
        <graph-container .state=${this.state}></graph-container>
      </div>
    `;
  }

  private renderHeaderRow1() {
    return html`
      <div class="header-row-1">
        <div class="titlebar__group">
          ${this.state.repo?.provider?.url
            ? html`
                <gl-tooltip placement="bottom">
                  <a
                    href=${this.state.repo.provider.url}
                    class="action-button"
                    style="margin-right: -0.5rem"
                    aria-label="Open Repository on ${this.state.repo.provider.name}"
                  >
                    <span
                      class=${this.state.repo.provider.icon === 'cloud'
                        ? 'codicon codicon-cloud action-button__icon'
                        : `glicon glicon-provider-${this.state.repo.provider.icon} action-button__icon`}
                      aria-hidden="true"
                    ></span>
                  </a>
                  <span slot="content">Open Repository on ${this.state.repo.provider.name}</span>
                </gl-tooltip>
              `
            : ''}
          ${this.state.repo?.provider?.connected !== true
            ? html`
                <gl-connect
                  type="action"
                  .connected=${false}
                  .integration=${this.state.repo.provider.name}
                  .connectUrl=${createCommandLink('gitlens.plus.cloudIntegrations.connect', {
                    args: {
                      source: 'graph',
                    },
                  })}
                ></gl-connect>
              `
            : ''}
          <gl-tooltip placement="bottom">
            <button
              type="button"
              class="action-button"
              aria-label="Switch to Another Repository..."
              ?disabled=${this.state.repos.length < 2}
              @click=${this.handleChooseRepository}
            >
              ${this.state.repo?.formattedName ?? 'none selected'}
              ${this.state.repos.length > 1
                ? html`<span class="codicon codicon-chevron-down action-button__more" aria-hidden="true"></span>`
                : ''}
            </button>
            <span slot="content">Switch to Another Repository...</span>
          </gl-tooltip>
          ${this.state.allowed && this.state.repo
            ? html`
                <span><span class="codicon codicon-chevron-right"></span></span>
                ${this.state.branchState?.pr
                  ? html`
                      <gl-popover placement="bottom">
                        <button slot="anchor" type="button" class="action-button">
                          <gl-issue-pull-request
                            type="pr"
                            .identifier=${`#${this.state.branchState.pr.id}`}
                            .status=${this.state.branchState.pr.state}
                            compact
                          />
                        </button>
                        <div slot="content">
                          <gl-issue-pull-request
                            type="pr"
                            .name=${this.state.branchState.pr.title}
                            .url=${this.state.branchState.pr.url}
                            .identifier=${`#${this.state.branchState.pr.id}`}
                            .status=${this.state.branchState.pr.state}
                            .date=${this.state.branchState.pr.updatedDate}
                            .dateFormat=${this.state.graphConfig?.dateFormat}
                            .dateStyle=${this.state.graphConfig?.dateStyle}
                            details
                            @open-details=${() =>
                              this.state.branchState.pr?.id
                                ? this.onOpenPullRequest(this.state.branchState.pr)
                                : undefined}
                          />
                        </div>
                      </gl-popover>
                    `
                  : ''}
                <gl-popover placement="bottom">
                  <a
                    slot="anchor"
                    href=${createWebviewCommandLink(
                      'gitlens.graph.switchToAnotherBranch',
                      this.state.webviewId,
                      this.state.webviewInstanceId,
                    )}
                    class="action-button"
                    style=${this.state.branchState?.pr ? 'margin-left: -0.6rem' : ''}
                    aria-label="Switch to Another Branch..."
                  >
                    ${!this.state.branchState?.pr
                      ? html`<span class="codicon codicon-git-branch" aria-hidden="true"></span>`
                      : ''}
                    ${this.state.branchName}
                    <span class="codicon codicon-chevron-down action-button__more" aria-hidden="true"></span>
                  </a>
                  <div slot="content">
                    <span>
                      Switch to Another Branch...
                      <hr />
                      <span class="codicon codicon-git-branch" aria-hidden="true"></span>
                      <span class="md-code">${this.state.branchName}</span>
                    </span>
                  </div>
                </gl-popover>
                <gl-button class="jump-to-ref" appearance="toolbar" @click=${this.handleJumpToRef}>
                  <code-icon icon="target"></code-icon>
                  <span slot="tooltip">
                    Jump to HEAD
                    <br />
                    [Alt] Jump to Reference...
                  </span>
                </gl-button>
                <span><span class="codicon codicon-chevron-right"></span></span>
                ${this.renderFetchAction()}
              `
            : ''}
        </div>
        <div class="titlebar__group">
          <gl-tooltip placement="bottom">
            <a
              href=${`command:gitlens.showLaunchpad?${encodeURIComponent(
                JSON.stringify({
                  source: 'graph',
                }),
              )}`}
              class="action-button"
            >
              <span class="codicon codicon-rocket"></span>
            </a>
            <span slot="content">
              <span style="white-space: break-spaces">
                <strong>Launchpad</strong> &mdash; organizes your pull requests into actionable groups to help you focus
                and keep your team unblocked
              </span>
            </span>
          </gl-tooltip>
          ${this.state.subscription == null || !isSubscriptionPaid(this.state.subscription)
            ? html`
                <gl-feature-badge
                  .source=${{ source: 'graph', detail: 'badge' }}
                  .subscription=${this.state.subscription}
                ></gl-feature-badge>
              `
            : ''}
        </div>
      </div>
    `;
  }

  private renderHeaderRow2() {
    return html`
      <div class="header-row-2">
        <div class="titlebar__group">
          <gl-tooltip placement="top" content="Branches Visibility">
            <sl-select value=${this.state.branchesVisibility} @sl-change=${this.handleBranchesVisibility} hoist>
              <code-icon icon="chevron-down" slot="expand-icon"></code-icon>
              <sl-option value="all" ?disabled=${this.state.repo?.isVirtual}>All Branches</sl-option>
              <sl-option value="smart" ?disabled=${this.state.repo?.isVirtual}>
                Smart Branches
                ${!this.state.repo?.isVirtual
                  ? html`
                      <gl-tooltip placement="right" slot="suffix">
                        <code-icon icon="info"></code-icon>
                        <span slot="content">
                          Shows only relevant branches
                          <br /><br />
                          <i>Includes the current branch, its upstream, and its base or target branch</i>
                        </span>
                      </gl-tooltip>
                    `
                  : html`<code-icon icon="info" slot="suffix"></code-icon>`}
              </sl-option>
              <sl-option value="current">Current Branch</sl-option>
            </sl-select>
          </gl-tooltip>
          <gl-popover class="popover" placement="bottom-start" trigger="focus" arrow=${false} distance=${0}>
            <gl-tooltip placement="top" slot="anchor">
              <button type="button" class="action-button">
                <span class=${`codicon codicon-filter${this.hasFilters ? '-filled' : ''}`}></span>
                <span class="codicon codicon-chevron-down action-button__more" aria-hidden="true"></span>
              </button>
              <span slot="content">Graph Filtering</span>
            </gl-tooltip>
            <div slot="content">
              <menu-label>Graph Filters</menu-label>
              ${this.state.repo?.isVirtual !== true
                ? html`
                    <menu-item role="none">
                      <gl-tooltip
                        placement="right"
                        content="Only follow the first parent of merge commits to provide a more linear history"
                      >
                        <gl-checkbox
                          value="onlyFollowFirstParent"
                          @change=${this.handleFilterChange}
                          ?checked=${this.state.graphConfig?.onlyFollowFirstParent ?? false}
                        >
                          Simplify Merge History
                        </gl-checkbox>
                      </gl-tooltip>
                    </menu-item>
                    <menu-divider></menu-divider>
                    <menu-item role="none">
                      <gl-checkbox
                        value="remotes"
                        @change=${this.handleFilterChange}
                        ?checked=${this.state.excludeTypes?.remotes ?? false}
                      >
                        Hide Remote-only Branches
                      </gl-checkbox>
                    </menu-item>
                    <menu-item role="none">
                      <gl-checkbox
                        value="stashes"
                        @change=${this.handleFilterChange}
                        ?checked=${this.state.excludeTypes?.stashes ?? false}
                      >
                        Hide Stashes
                      </gl-checkbox>
                    </menu-item>
                  `
                : ''}
              <menu-item role="none">
                <gl-checkbox value="tags" @change=${this.handleFilterChange} ?checked=${this.state.excludeTypes?.tags ?? false}>
                  Hide Tags
                </gl-checkbox>
              </menu-item>
              <menu-divider></menu-divider>
              <menu-item role="none">
                <gl-checkbox value="mergeCommits" @change=${this.handleFilterChange} ?checked=${this.state.graphConfig?.dimMergeCommits ?? false}>
                  Dim Merge Commit Rows
                </gl-checkbox>
              </menu-item>
            </div>
          </gl-popover>
          <span><span class="action-divider"></span></span>
          <gl-search-box
            ref=${this.searchEl}
            label="Search Commits"
            step=${this.searchPosition}
            total=${this.state.searchResults?.count ?? 0}
            valid=${Boolean(this.state.searchQuery?.query && this.state.searchQuery.query.length > 2)}
            more=${this.state.searchResults?.paging?.hasMore ?? false}
            searching=${this.state.searching}
            value=${this.state.searchQuery?.query ?? ''}
            errorMessage=${this.state.searchResultsError?.error ?? ''}
            resultsHidden=${this.state.searchResultsHidden}
            resultsLoaded=${this.state.searchResults != null}
            @change=${this.handleSearchInput}
            @navigate=${this.handleSearchNavigation}
            @open-in-view=${this.handleSearchOpenInView}
          ></gl-search-box>
          <span><span class="action-divider"></span></span>
          <span class="button-group">
            <gl-tooltip placement="bottom">
              <button
                type="button"
                role="checkbox"
                class="action-button"
                aria-label="Toggle Minimap"
                aria-checked=${this.state.graphConfig?.minimap ?? false}
                @click=${this.handleOnMinimapToggle}
              >
                <span class="codicon codicon-graph-line action-button__icon"></span>
              </button>
              <span slot="content">Toggle Minimap</span>
            </gl-tooltip>
            <gl-popover class="popover" placement="bottom-end" trigger="focus" arrow=${false} distance=${0}>
              <gl-tooltip placement="top" distance=${7} slot="anchor">
                <button type="button" class="action-button" aria-label="Minimap Options">
                  <span class="codicon codicon-chevron-down action-button__more" aria-hidden="true"></span>
                </button>
                <span slot="content">Minimap Options</span>
              </gl-tooltip>
              <div slot="content">
                <menu-label>Minimap</menu-label>
                <menu-item role="none">
                  <gl-radio-group value=${this.state.graphConfig?.minimapDataType ?? 'commits'} @change=${this.handleOnMinimapDataTypeChange}>
                    <gl-radio name="minimap-datatype" value="commits">Commits</gl-radio>
                    <gl-radio name="minimap-datatype" value="lines">Lines Changed</gl-radio>
                  </gl-radio-group>
                </menu-item>
                <menu-divider></menu-divider>
                <menu-label>Markers</menu-label>
                <menu-item role="none">
                  <gl-checkbox
                    value="localBranches"
                    @change=${this.handleOnMinimapAdditionalTypesChange}
                    ?checked=${this.state.graphConfig?.minimapMarkerTypes?.includes('localBranches') ?? false}
                  >
                    <span class="minimap-marker-swatch" data-marker="localBranches"></span>
                    Local Branches
                  </gl-checkbox>
                </menu-item>
                <menu-item role="none">
                  <gl-checkbox
                    value="remoteBranches"
                    @change=${this.handleOnMinimapAdditionalTypesChange}
                    ?checked=${this.state.graphConfig?.minimapMarkerTypes?.includes('remoteBranches') ?? true}
                  >
                    <span class="minimap-marker-swatch" data-marker="remoteBranches"></span>
                    Remote Branches
                  </gl-checkbox>
                </menu-item>
                <menu-item role="none">
                  <gl-checkbox
                    value="pullRequests"
                    @change=${this.handleOnMinimapAdditionalTypesChange}
                    ?checked=${this.state.graphConfig?.minimapMarkerTypes?.includes('pullRequests') ?? true}
                  >
                    <span class="minimap-marker-swatch" data-marker="pullRequests"></span>
                    Pull Requests
                  </gl-checkbox>
                </menu-item>
                <menu-item role="none">
                  <gl-checkbox
                    value="stashes"
                    @change=${this.handleOnMinimapAdditionalTypesChange}
                    ?checked=${this.state.graphConfig?.minimapMarkerTypes?.includes('stashes') ?? false}
                  >
                    <span class="minimap-marker-swatch" data-marker="stashes"></span>
                    Stashes
                  </gl-checkbox>
                </menu-item>
                <menu-item role="none">
                  <gl-checkbox
                    value="tags"
                    @change=${this.handleOnMinimapAdditionalTypesChange}
                    ?checked=${this.state.graphConfig?.minimapMarkerTypes?.includes('tags') ?? true}
                  >
                    <span class="minimap-marker-swatch" data-marker="tags"></span>
                    Tags
                  </gl-checkbox>
                </menu-item>
              </div>
            </gl-popover>
          </span>
        </div>
      </div>
    `;
  }

  private renderHeaderRow3() {
    return html`
      <div class="header-row-3">
        <gl-graph-minimap-container
          .activeDay=${this.state.activeDay}
          .disabled=${!this.state.graphConfig?.minimap}
          .rows=${this.state.rows}
          .rowsStats=${this.state.rowsStats}
          .dataType=${this.state.graphConfig?.minimapDataType ?? 'commits'}
          .markerTypes=${this.state.graphConfig?.minimapMarkerTypes}
          .refMetadata=${this.state.refsMetadata}
          .searchResults=${this.state.searchResults}
          .visibleDays=${this.state.visibleDays}
          @selected=${this.handleOnMinimapDaySelected}
        ></gl-graph-minimap-container>
      </div>
    `;
  }

  private handleChooseRepository() {
    this.dispatchEvent(new CustomEvent('choose-repository'));
  }

  private handleJumpToRef(e: MouseEvent) {
    this.dispatchEvent(new CustomEvent('jump-to-ref', { detail: { altKey: e.altKey } }));
  }

  private handleBranchesVisibility(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('branches-visibility', { detail: e.detail.value }));
  }

  private handleFilterChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(new CustomEvent('filter-change', { detail: { value: target.value, checked: target.checked } }));
  }

  private handleSearchInput(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('search-input', { detail: e.detail }));
  }

  private handleSearchNavigation(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('search-navigation', { detail: e.detail }));
  }

  private handleSearchOpenInView() {
    this.dispatchEvent(new CustomEvent('search-open-in-view'));
  }

  private handleOnMinimapToggle() {
    this.dispatchEvent(new CustomEvent('minimap-toggle'));
  }

  private handleOnMinimapDataTypeChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(new CustomEvent('minimap-data-type-change', { detail: target.value }));
  }

  private handleOnMinimapAdditionalTypesChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(new CustomEvent('minimap-additional-types-change', { detail: { value: target.value, checked: target.checked } }));
  }

  private handleOnMinimapDaySelected(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('minimap-day-selected', { detail: e.detail }));
  }

  private renderFetchAction() {
    let action: 'fetch' | 'pull' | 'push' = 'fetch';
    let icon = 'repo-fetch';
    let label = 'Fetch';
    let isBehind = false;
    let isAhead = false;

    const remote = this.state.branchState?.upstream
      ? html`<span class="md-code">${this.state.branchState.upstream}</span>`
      : 'remote';

    let tooltip;
    if (this.state.branchState) {
      isAhead = this.state.branchState.ahead > 0;
      isBehind = this.state.branchState.behind > 0;

      const branchPrefix = html`<span><span class="md-code">${this.state.branchName}</span> is</span>`;

      if (isBehind) {
        action = 'pull';
        icon = 'repo-pull';
        label = 'Pull';
        tooltip = html`<span>Pull ${pluralize('commit', this.state.branchState.behind)} from ${remote}${this.state.branchState.provider?.name ? ` on ${this.state.branchState.provider?.name}` : ''}</span>`;
        if (isAhead) {
          tooltip = html`<span>${tooltip}<hr />${branchPrefix} ${pluralize('commit', this.state.branchState.behind)} behind and ${pluralize('commit', this.state.branchState.ahead)} ahead of ${remote}${this.state.branchState.provider?.name ? ` on ${this.state.branchState.provider?.name}` : ''}</span>`;
        } else {
          tooltip = html`<span>${tooltip}<hr />${branchPrefix} ${pluralize('commit', this.state.branchState.behind)} behind ${remote}${this.state.branchState.provider?.name ? ` on ${this.state.branchState.provider?.name}` : ''}</span>`;
        }
      } else if (isAhead) {
        action = 'push';
        icon = 'repo-push';
        label = 'Push';
        tooltip = html`<span>Push ${pluralize('commit', this.state.branchState.ahead)} to ${remote}${this.state.branchState.provider?.name ? ` on ${this.state.branchState.provider?.name}` : ''}<hr />${branchPrefix} ${pluralize('commit', this.state.branchState.ahead)} ahead of ${remote}</span>`;
      }
    }

    const lastFetchedDate = this.state.lastFetched && new Date(this.state.lastFetched);
    const fetchedText = lastFetchedDate && lastFetchedDate.getTime() !== 0 ? fromNow(lastFetchedDate) : undefined;

    return html`
      ${(isBehind || isAhead)
        ? html`
            <gl-tooltip placement="bottom">
              <a
                href=${createWebviewCommandLink(`gitlens.graph.${action}`, this.state.webviewId, this.state.webviewInstanceId)}
                class=${`action-button${isBehind ? ' is-behind' : ''}${isAhead ? ' is-ahead' : ''}`}
              >
                <span class=${`glicon glicon-${icon} action-button__icon`}></span>
                ${label}
                ${(isAhead || isBehind)
                  ? html`
                      <span>
                        <span class="pill action-button__pill">
                          ${isBehind
                            ? html`
                                <span>
                                  ${this.state.branchState!.behind}
                                  <span class="codicon codicon-arrow-down"></span>
                                </span>
                              `
                            : ''}
                          ${isAhead
                            ? html`
                                <span>
                                  ${isBehind ? html`&nbsp;&nbsp;` : ''}
                                  ${this.state.branchState!.ahead}
                                  <span class="codicon codicon-arrow-up"></span>
                                </span>
                              `
                            : ''}
                        </span>
                      </span>
                    `
                  : ''}
              </a>
              <div slot="content" style="white-space: break-spaces">
                ${tooltip}
                ${fetchedText
                  ? html`
                      <hr />
                      Last fetched ${fetchedText}
                    `
                  : ''}
              </div>
            </gl-tooltip>
          `
        : ''}
      <gl-tooltip placement="bottom">
        <a
          href=${createWebviewCommandLink('gitlens.graph.fetch', this.state.webviewId, this.state.webviewInstanceId)}
          class="action-button"
        >
          <span class="glicon glicon-repo-fetch action-button__icon"></span>
          Fetch ${fetchedText ? html`<span class="action-button__small">(${fetchedText})</span>` : ''}
        </a>
        <span slot="content" style="white-space: break-spaces">
          Fetch from ${remote}${this.state.branchState?.provider?.name ? ` on ${this.state.branchState.provider?.name}` : ''}
          ${fetchedText
            ? html`
                <hr />
                Last fetched ${fetchedText}
              `
            : ''}
        </span>
      </gl-tooltip>
    `;
  }
}