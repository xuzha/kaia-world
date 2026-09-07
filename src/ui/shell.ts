import { toyDefinitions } from '../toys/registry';
import { MAT_AREA } from '../world/room';
import { avatar, flower, icon, toyIcon } from './icons';
import { wonderBar, wonderPanels } from './wonders';

export function renderShell() {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="paper-grain" aria-hidden="true"></div>
    <header class="site-header">
      <a href="${import.meta.env.BASE_URL}" class="wordmark" aria-label="Kaia 的小小世界首页">${flower()}<span>kaia<span class="wordmark-dot">.</span><small>her little world</small></span></a>
      <div class="header-note"><span class="tiny-dot"></span> 好好玩耍，慢慢长大 <span class="note-line"></span></div>
      <div class="header-actions">
        <button class="weather" id="weather" aria-label="切换到晚安时光" aria-pressed="false">${icon('sun', 18)}<span>午后阳光</span><i>24°</i></button>
        <div class="header-divider"></div>
        <button class="icon-button" id="sound" aria-label="开启轻柔音乐" aria-pressed="false" data-tip="听听小世界">${icon('muted')}</button>
        <button class="icon-button" id="about" aria-label="关于这个小世界" data-tip="关于小世界">${icon('heart')}</button>
      </div>
    </header>
    <main>
      <aside class="intro">
        <div class="eyebrow"><span></span> A LITTLE WORLD OF WONDER</div>
        <h1>把日子，<br>玩成<span class="storybook">童话<svg viewBox="0 0 100 12" aria-hidden="true"><path d="M2 7Q43 0 97 5M17 11Q58 5 86 9"/></svg></span>。</h1>
        <p class="english-line">Little moments,<br>big wonder.</p>
        <p class="intro-copy">阳光、玩具，还有无尽的好奇。<br>欢迎来到 Kaia 的两岁小宇宙。</p>
        <button class="explore-link" id="open-cabinet">逛逛她的玩具箱 ${icon('arrow', 17)}</button>
        <div class="little-flower" aria-hidden="true">${flower()}<span>made of love & little things</span></div>
      </aside>
      <section id="world" class="world" aria-label="可旋转和缩放的 Kaia 3D 游戏室" tabindex="0">
        <div id="loading" class="loading"><span class="loading-flower">${flower()}</span><p>把阳光搬进来…</p></div>
        <div id="speech" class="speech" aria-hidden="true">今天也要认真玩耍！<span>✦</span></div>
        <div id="toy-tooltip" class="toy-tooltip" hidden></div>
        <span class="space-credit">银河：<a href="https://www.eso.org/public/images/eso0932a/" target="_blank" rel="noopener noreferrer">ESO/S. Brunier</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></span>
      </section>
      <div class="world-tag"><span class="tiny-dot"></span><span id="world-name">Kaia 的游戏室</span><span class="tag-divider">/</span> <span>${Math.round(MAT_AREA)}㎡ 的小小宇宙</span></div>
      ${wonderBar()}
      <aside class="kaia-status" aria-label="Kaia 的近况">
        <div class="status-person">${avatar()}<div><strong>Kaia</strong><p>2 岁 · 小小探索家</p></div><span class="live-dot" title="正在这个小世界里"></span></div>
        <div class="status-rule"></div>
        <div class="status-activity"><span class="activity-dot"></span><span id="activity" aria-live="polite">今天想玩点什么呢？</span></div>
        <div class="status-footer"><span id="mode-label">自由探索中</span><button id="autoplay" aria-label="关闭自主探索" aria-pressed="true" class="toggle"><span></span></button></div>
      </aside>
      <div class="scene-toolbar" aria-label="视角控制">
        <button class="icon-button" id="zoom-in" aria-label="放大视角" data-tip="靠近一点">${icon('plus')}</button>
        <button class="icon-button" id="zoom-out" aria-label="缩小视角" data-tip="远一点看">${icon('minus')}</button>
        <span class="toolbar-rule"></span>
        <button class="icon-button" id="rotate" aria-label="旋转视角" data-tip="换个角度">${icon('rotate')}</button>
        <button class="icon-button" id="reset-camera" aria-label="恢复全景" data-tip="回到全景">${icon('home')}</button>
        <span class="toolbar-rule"></span>
        <button class="icon-button" id="snapshot" aria-label="保存此刻的照片" data-tip="收藏这一刻">${icon('camera')}</button>
      </div>
      <div class="family-actions"><span>爱，偶尔会来串门</span><button id="invite-mom" aria-label="邀请妈妈来陪玩" data-tip="妈妈来陪玩"><span class="parent-avatar mom-avatar">妈</span></button><button id="invite-dad" aria-label="邀请爸爸来陪玩" data-tip="爸爸来陪玩"><span class="parent-avatar dad-avatar">爸</span></button></div>
      <div class="view-hint">${icon('mouse', 17)}<span class="desktop-hint">拖拽旋转<span>·</span>滚轮缩放<span>·</span>点击玩具一起玩</span><span class="mobile-hint">单指旋转 · 双指缩放 · 点点玩具</span></div>
      <nav class="toy-dock" aria-label="邀请 Kaia 玩玩具">
        <div class="dock-heading"><span class="eyebrow">A LITTLE PLAYTIME</span><strong>今天，玩点什么？</strong><button id="collection-count">探索了 <span id="visited-count">0</span> / ${toyDefinitions.length} 个小乐趣 ${icon('arrow', 12)}</button></div>
        <div class="toy-list">${toyDefinitions.map((t) => `<button class="toy-button" data-toy="${t.id}" aria-label="邀请 Kaia 玩${t.name}" aria-pressed="false"><span class="toy-illustration">${toyIcon(t.id)}<span class="visited-mark">${icon('check', 9)}</span></span><span>${t.name}</span><i></i></button>`).join('')}</div>
        <div class="dock-actions"><button class="pause-button" id="pause" aria-label="暂停小世界" aria-pressed="false" data-tip="让时光停一停">${icon('pause', 17)}</button><button class="shuffle-button" id="shuffle" aria-label="随机选择一个玩具" data-tip="交给好奇心">${icon('shuffle', 17)}</button></div>
      </nav>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>
      <div id="pause-indicator" class="pause-indicator" hidden>${icon('pause', 12)} 时光暂停中</div>
    </main>
    <div id="modal-backdrop" class="modal-backdrop" hidden></div>
    ${wonderPanels()}
    <section id="cabinet" class="cabinet" role="dialog" aria-modal="true" aria-labelledby="cabinet-title" hidden>
      <div class="panel-top"><span class="eyebrow">COLLECT LITTLE JOYS</span><button class="icon-button close-panel" aria-label="关闭玩具箱">${icon('close')}</button></div>
      <h2 id="cabinet-title">Kaia 的玩具箱<span>so much to discover.</span></h2>
      <p class="panel-copy">每一件小玩具，都藏着一个新世界。<br>选一个，邀请 Kaia 一起发现。</p>
      <div class="cabinet-grid">${toyDefinitions.map((t) => `<button data-invite="${t.id}" class="cabinet-toy"><span class="cabinet-art" style="--toy-color:${t.color}">${toyIcon(t.id)}</span><strong>${t.name}</strong><small>${t.english}</small><p>${t.description}</p><span class="invite-label">一起玩 ${icon('arrow', 14)}</span></button>`).join('')}</div>
      <p class="cabinet-footer">${icon('heart', 14)} 小小的快乐，值得一遍又一遍。</p>
    </section>
    <section id="about-panel" class="about-panel" role="dialog" aria-modal="true" aria-labelledby="about-title" hidden>
      <button class="icon-button close-panel" aria-label="关闭关于小世界">${icon('close')}</button>
      ${flower()}<span class="eyebrow">A LOVE LETTER TO THE EVERYDAY</span>
      <h2 id="about-title">她的小小世界，<br>我们的整个世界。</h2>
      <p>Kaia 两岁了。她会对着一本书发呆，<br>把积木搭了又推倒，骑着木马去很远的地方。<br>爸爸妈妈偶尔来串门，更多的时候，<br>让她慢慢发现自己的小宇宙。</p>
      <p class="about-note">这里没有任务，也没有倒计时。<br>陪她玩一会儿，就很好。</p>
      <span class="about-signature">with love, always.</span>
    </section>
  `;
}
