import { toyDefinitions } from '../toys/registry';
import { MAT_AREA } from '../world/room';
import { avatar, flower, icon, toyIcon } from './icons';
import { wonderBar, wonderPanels } from './wonders';

export function renderShell() {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="paper-grain" aria-hidden="true"></div>
    <header class="site-header">
      <a href="${import.meta.env.BASE_URL}" class="wordmark" aria-label="Kaia’s little world home">${flower()}<span>kaia<span class="wordmark-dot">.</span><small>her little world</small></span></a>
      <div class="header-note"><span class="tiny-dot"></span> Play a little. Grow a little. <span class="note-line"></span></div>
      <div class="header-actions">
        <button class="weather" id="weather" aria-label="Switch to bedtime" aria-pressed="false">${icon('sun', 18)}<span>Afternoon</span><i>24°</i></button>
        <div class="header-divider"></div>
        <button class="icon-button" id="sound" aria-label="Turn on gentle music" aria-pressed="false" data-tip="Listen to her world">${icon('muted')}</button>
        <button class="icon-button" id="about" aria-label="About Kaia’s little world" data-tip="About this little world">${icon('heart')}</button>
      </div>
    </header>
    <main>
      <aside class="intro">
        <div class="eyebrow"><span></span> A LITTLE WORLD OF WONDER</div>
        <h1>Small days,<br> big <span class="storybook">stories<svg viewBox="0 0 100 12" aria-hidden="true"><path d="M2 7Q43 0 97 5M17 11Q58 5 86 9"/></svg></span>.</h1>
        <p class="english-line">Little moments,<br> big wonder.</p>
        <p class="intro-copy">Sunshine, toys, and endless curiosity.<br>Welcome to two-year-old Kaia’s world.</p>
        <button class="explore-link" id="open-cabinet">Peek inside her toy box ${icon('arrow', 17)}</button>
        <div class="little-flower" aria-hidden="true">${flower()}<span>made of love & little things</span></div>
      </aside>
      <section id="world" class="world" aria-label="Kaia’s 3D playroom. Drag to rotate and scroll or pinch to zoom." tabindex="0">
        <div id="loading" class="loading"><span class="loading-flower">${flower()}</span><p>Letting the sunshine in…</p></div>
        <div id="speech" class="speech" aria-hidden="true">Today is a good day to play!<span>✦</span></div>
        <div id="toy-tooltip" class="toy-tooltip" hidden></div>
        <span class="space-credit">Milky Way: <a href="https://www.eso.org/public/images/eso0932a/" target="_blank" rel="noopener noreferrer">ESO/S. Brunier</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></span>
      </section>
      <div class="world-tag"><span class="tiny-dot"></span><span id="world-name">Kaia’s playroom</span><span class="tag-divider">/</span> <span>${Math.round(MAT_AREA)} m² of wonder</span></div>
      ${wonderBar()}
      <aside class="kaia-status" aria-label="What Kaia is up to">
        <div class="status-person">${avatar()}<div><strong>Kaia</strong><p>Age 2 · Little explorer</p></div><span class="live-dot" title="Here in her little world"></span></div>
        <div class="status-rule"></div>
        <div class="status-activity"><span class="activity-dot"></span><span id="activity" aria-live="polite">What shall we play today?</span></div>
        <div class="status-footer"><span id="mode-label">Exploring freely</span><button id="autoplay" aria-label="Turn off free exploration" aria-pressed="true" class="toggle"><span></span></button></div>
      </aside>
      <div class="scene-toolbar" aria-label="Camera controls">
        <button class="icon-button" id="zoom-in" aria-label="Zoom in" data-tip="A little closer">${icon('plus')}</button>
        <button class="icon-button" id="zoom-out" aria-label="Zoom out" data-tip="A wider view">${icon('minus')}</button>
        <span class="toolbar-rule"></span>
        <button class="icon-button" id="rotate" aria-label="Rotate the view" data-tip="Another angle">${icon('rotate')}</button>
        <button class="icon-button" id="reset-camera" aria-label="Reset the view" data-tip="See the whole world">${icon('home')}</button>
        <span class="toolbar-rule"></span>
        <button class="icon-button" id="snapshot" aria-label="Save a photo of this moment" data-tip="Keep this moment">${icon('camera')}</button>
      </div>
      <div class="family-actions"><span>A little visit, a lot of love</span><button id="invite-mom" aria-label="Invite Mom to play" data-tip="A visit from Mom"><span class="parent-avatar mom-avatar">Mom</span></button><button id="invite-dad" aria-label="Invite Dad to play" data-tip="A visit from Dad"><span class="parent-avatar dad-avatar">Dad</span></button></div>
      <div class="view-hint">${icon('mouse', 17)}<span class="desktop-hint">Drag to rotate<span>·</span>Scroll to zoom<span>·</span>Tap a toy to play</span><span class="mobile-hint">Drag to rotate · Pinch to zoom · Tap a toy</span></div>
      <nav class="toy-dock" aria-label="Invite Kaia to play with a toy">
        <div class="dock-heading"><span class="eyebrow">A LITTLE PLAYTIME</span><strong>What shall we play?</strong><button id="collection-count">Explored <span id="visited-count">0</span> / ${toyDefinitions.length} toys ${icon('arrow', 12)}</button></div>
        <div class="toy-list">${toyDefinitions.map((t) => `<button class="toy-button" data-toy="${t.id}" aria-label="Invite Kaia to play with ${t.name}" aria-pressed="false"><span class="toy-illustration">${toyIcon(t.id)}<span class="visited-mark">${icon('check', 9)}</span></span><span>${t.name}</span><i></i></button>`).join('')}</div>
        <div class="dock-actions"><button class="pause-button" id="pause" aria-label="Pause this little world" aria-pressed="false" data-tip="Pause for a moment">${icon('pause', 17)}</button><button class="shuffle-button" id="shuffle" aria-label="Choose a random toy" data-tip="Follow your curiosity">${icon('shuffle', 17)}</button></div>
      </nav>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>
      <div id="pause-indicator" class="pause-indicator" hidden>${icon('pause', 12)} A moment on pause</div>
    </main>
    <div id="modal-backdrop" class="modal-backdrop" hidden></div>
    ${wonderPanels()}
    <section id="cabinet" class="cabinet" role="dialog" aria-modal="true" aria-labelledby="cabinet-title" hidden>
      <div class="panel-top"><span class="eyebrow">COLLECT LITTLE JOYS</span><button class="icon-button close-panel" aria-label="Close the toy box">${icon('close')}</button></div>
      <h2 id="cabinet-title">Kaia’s toy box<span>so much to discover.</span></h2>
      <p class="panel-copy">Every little toy holds a new world.<br>Choose one and discover it with Kaia.</p>
      <div class="cabinet-grid">${toyDefinitions.map((t) => `<button data-invite="${t.id}" class="cabinet-toy"><span class="cabinet-art" style="--toy-color:${t.color}">${toyIcon(t.id)}</span><strong>${t.name}</strong><small>${t.english}</small><p>${t.description}</p><span class="invite-label">Let’s play ${icon('arrow', 14)}</span></button>`).join('')}</div>
      <p class="cabinet-footer">${icon('heart', 14)} Little joys are worth finding again and again.</p>
    </section>
    <section id="about-panel" class="about-panel" role="dialog" aria-modal="true" aria-labelledby="about-title" hidden>
      <button class="icon-button close-panel" aria-label="Close the about panel">${icon('close')}</button>
      ${flower()}<span class="eyebrow">A LOVE LETTER TO THE EVERYDAY</span>
      <h2 id="about-title">Her little world.<br>Our whole world.</h2>
      <p>Kaia is two. She gets lost in picture books, builds towers just to knock them down, and rides her rocking horse to faraway places. Mom and Dad drop by while she discovers the world in her own time.</p>
      <p class="about-note">No tasks. No ticking clock.<br>Just a little time to play together.</p>
      <span class="about-signature">with love, always.</span>
    </section>
  `;
}
