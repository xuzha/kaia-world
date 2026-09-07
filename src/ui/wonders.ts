import { icon, toyIcon } from './icons';
import { stories, storyIds, type StoryId } from '../play/stories';

export const drawingColors = ['#6b6455', '#c98770', '#e0b65f', '#8fa580', '#88aaa9', '#b0a0bb'];

function storyArt(story: StoryId) {
  const scenes = {
    ocean: `<rect width="120" height="128" fill="#afcbbb"/><circle cx="88" cy="27" r="12" fill="#efe0ac"/><path d="M0 89 Q30 81 60 91 T120 90 V128 H0Z" fill="#8aafa7"/><path d="M29 88 H102 L86 103 H42Z" fill="#c48d6c"/><path d="M64 28 V82 H26Z M70 45 L99 82 H70Z" fill="#fff1d3"/><path d="M11 112 Q24 106 38 112 T67 112 T97 112" stroke="#ecf1da" stroke-width="2" fill="none"/>`,
    space: `<rect width="120" height="128" fill="#b9bdd7"/><circle cx="88" cy="31" r="15" fill="#e7c7a1"/><ellipse cx="88" cy="31" rx="24" ry="6" stroke="#f6e6c7" stroke-width="4" transform="rotate(-22 88 31)"/><path d="M32 96 L27 112 L38 105 L45 115 L47 94Z" fill="#e8c782"/><path d="M25 89 L23 108 L40 96 L58 108 L56 87Z" fill="#ca947f"/><path d="M25 84 Q25 48 41 34 Q59 52 57 84 V95 H25Z" fill="#fff0d5"/><path d="M29 56 Q33 42 41 34 Q49 42 54 56Z" fill="#c98f7d"/><circle cx="41" cy="74" r="9" fill="#94b5c2"/><path d="M18 21 V31 M13 26 H23 M91 91 V103 M85 97 H97 M75 62 V68 M72 65 H78" stroke="#fff0d5" stroke-width="2"/>`,
    zoo: `<rect width="120" height="128" fill="#c0d0a6"/><path d="M0 107 Q55 88 120 104 V128 H0Z" fill="#9fb68b"/><path d="M21 39 V101" stroke="#b89a71" stroke-width="6"/><circle cx="20" cy="37" r="20" fill="#8fac82"/><path d="M53 91 V118 M82 91 V118 M79 90 V38" stroke="#e3bd78" stroke-width="10" stroke-linecap="round"/><ellipse cx="66" cy="87" rx="23" ry="14" fill="#e3bd78"/><ellipse cx="87" cy="34" rx="17" ry="10" fill="#e3bd78"/><path d="M78 26 V19 M88 26 V18" stroke="#b08a57" stroke-width="3" stroke-linecap="round"/><circle cx="95" cy="32" r="2" fill="#655d48"/><g fill="#b38d58"><circle cx="80" cy="56" r="4"/><circle cx="78" cy="72" r="4"/><circle cx="57" cy="85" r="5"/><circle cx="75" cy="91" r="4"/></g>`,
    polar: `<rect width="120" height="128" fill="#284e68"/><path d="M-8 39 C35-2 55 82 132 13" stroke="#639dba" stroke-width="19" opacity=".4"/><path d="M-8 39 C35-2 55 82 132 13" stroke="#79c9b0" stroke-width="8"/><path d="M0 103 Q60 82 120 103 V128 H0Z" fill="#bddbe0"/><path d="M9 99 A31 31 0 0 1 71 99Z" fill="#ebf0e5"/><path d="M19 77 H60 M12 89 H68 M40 69 V77 M29 77 V89 M53 77 V89" stroke="#b1ccd2" stroke-width="1.5"/><path d="M40 99 V92 A10 10 0 0 1 60 92 V99Z" fill="#557c90"/><ellipse cx="91" cy="96" rx="14" ry="24" fill="#26475a"/><ellipse cx="91" cy="100" rx="10" ry="15" fill="#f2eddb"/><path d="M87 87 H96 L91 91Z M77 120 H87 M95 120 H105" fill="#d6a36b" stroke="#d6a36b" stroke-width="3" stroke-linecap="round"/><circle cx="87" cy="81" r="1.7" fill="#f5eddb"/><circle cx="96" cy="81" r="1.7" fill="#f5eddb"/><g fill="#dfecdb"><circle cx="22" cy="16" r="1"/><circle cx="88" cy="14" r="1.2"/><circle cx="109" cy="57" r="1"/></g>`,
    forest: `<rect width="120" height="128" fill="#294b48"/><circle cx="88" cy="24" r="10" fill="#e2dcba"/><path d="M23 31 V128 M101 57 V128" stroke="#8b7856" stroke-width="8"/><ellipse cx="25" cy="29" rx="27" ry="17" fill="#5c7958"/><ellipse cx="109" cy="48" rx="18" ry="13" fill="#466950"/><path d="M39 127 V104 M70 127 V104" stroke="#8c7753" stroke-width="4"/><path d="M11 104 H88" stroke="#bda572" stroke-width="6"/><path d="M79 100 Q90 113 109 85 M79 87 Q90 100 109 72" stroke="#bcb791" stroke-width="1.5"/><path d="M91 91 V105 M100 84 V98" stroke="#bcb791" stroke-width="1"/><path d="M26 72 H72 V101 H26Z" fill="#b2986a"/><path d="M19 73 L49 48 L80 73Z" fill="#729079"/><rect x="35" y="79" width="16" height="15" rx="2" fill="#f2d18e"/><path d="M43 79 V94 M35 86 H51" stroke="#947e54" stroke-width="1.5"/><g fill="#d8e8a3"><circle cx="12" cy="74" r="1.4"/><circle cx="98" cy="114" r="1.7"/><circle cx="89" cy="66" r="1.3"/><circle cx="63" cy="37" r="1.2"/></g>`,
  };
  return `<svg viewBox="0 0 120 128" fill="none" aria-hidden="true">${scenes[story]}</svg>`;
}

export function wonderBar() {
  return `<nav class="wonder-bar" aria-label="奇妙玩法">
    <button id="open-imagination" aria-haspopup="dialog">${icon('sparkle', 17)}<span>去想象</span></button>
    <button id="open-drawing" aria-haspopup="dialog">${icon('pencil', 17)}<span>画个玩具</span></button>
    <button id="open-together" aria-haspopup="dialog">${icon('heart', 17)}<span>一起玩</span></button>
  </nav>
  <section id="together-card" class="together-card" aria-label="一起玩" hidden>
    <div class="play-card-top"><strong id="together-title">一起玩</strong><button id="end-together" class="icon-button" aria-label="结束一起玩">${icon('close', 17)}</button></div>
    <p id="together-status" role="status" aria-live="polite"></p>
    <div id="roll-controls" hidden><button id="roll-ball" class="primary-button">把球滚给 Kaia ${icon('arrow', 16)}</button><span id="roll-count" class="play-count"></span></div>
    <div id="hide-controls" hidden><div class="hiding-choices"><button data-hide="0">靠枕后面</button><button data-hide="1">小篮子里</button><button data-hide="2">野餐毯下</button></div><button id="hide-again" class="text-button" hidden>再藏一次 ${icon('rotate', 14)}</button></div>
    <div id="bubble-controls" hidden><div class="bubble-buttons"><button id="blow-bubbles" class="primary-button">${icon('bubbles', 18)} 吹一口泡泡</button><button id="bubble-mic" class="secondary-button" aria-pressed="false">${icon('mic', 16)} 用麦克风吹</button></div><p class="mic-note" id="mic-status" role="status">点泡泡就能戳破。麦克风只检测音量，不录音。</p><meter id="mic-level" min="0" max="1" value="0" aria-label="吹气音量" hidden></meter></div>
    <div id="plush-controls" hidden><button id="hug-again" class="primary-button">再抱抱新朋友 ${icon('heart', 16)}</button></div>
  </section>`;
}

export function wonderPanels() {
  return `<section id="imagination-panel" class="wonder-panel story-panel" role="dialog" aria-modal="true" aria-labelledby="imagination-title" hidden>
    <div class="panel-top"><span class="eyebrow">A STORY YOU CAN STEP INTO</span><button class="icon-button close-panel" aria-label="关闭想象绘本">${icon('close')}</button></div>
    <h2 id="imagination-title">今天，想去哪里？</h2>
    <p class="story-intro">选一本绘本，让整个房间走进故事里。</p>
    <div class="story-picker" role="group" aria-label="选择想象绘本">${storyIds.map((story) => `<button class="story-card" data-story="${story}" aria-pressed="${story === 'ocean'}"><span class="story-cover">${storyArt(story)}</span><strong>${stories[story].name}</strong><small>${stories[story].subtitle}</small></button>`).join('')}</div>
    <p id="story-description" class="panel-copy">${stories.ocean.description}</p>
    <button id="enter-story" class="primary-button">翻开航海绘本 ${icon('arrow', 17)}</button>
    <button id="leave-story" class="text-button" hidden>合上绘本，回到游戏室</button>
  </section>
  <section id="drawing-panel" class="wonder-panel drawing-panel" role="dialog" aria-modal="true" aria-labelledby="drawing-title" hidden>
    <div class="panel-top"><span class="eyebrow">FROM YOUR HANDS, WITH LOVE</span><button class="icon-button close-panel" aria-label="关闭画画桌">${icon('close')}</button></div>
    <h2 id="drawing-title">画一个，抱得到的朋友。</h2>
    <p class="panel-copy">画下轮廓，添上颜色。让它变成立体布偶，陪 Kaia 玩。</p>
    <div class="drawing-workspace">
      <div class="drawing-paper"><canvas id="drawing-canvas" width="384" height="384" aria-label="画玩具的画布，使用鼠标或手指绘画，也可选择下方图案" tabindex="0"></canvas><span id="drawing-hint">小兔、星星，或一只谁也没见过的小怪兽…</span></div>
      <div class="drawing-tools">
        <span class="tool-label">挑一支蜡笔</span>
        <div class="crayon-colors" role="group" aria-label="蜡笔颜色">${drawingColors.map((color, i) => `<button data-crayon="${color}" style="--crayon:${color}" aria-label="${['可可棕', '珊瑚粉', '蜂蜜黄', '鼠尾草绿', '海水蓝', '丁香紫'][i]}" aria-pressed="${i === 0}"></button>`).join('')}</div>
        <label class="brush-label" for="brush-size">笔触粗细 <input id="brush-size" type="range" min="3" max="24" value="9" /></label>
        <div class="drawing-edit"><button id="undo-drawing" class="secondary-button" disabled>${icon('undo', 15)} 撤回</button><button id="clear-drawing" class="secondary-button" disabled>清空</button></div>
        <span class="tool-label starter-label">也可以从这里开始</span>
        <div class="drawing-starters"><button data-drawing-starter="bunny">一只小兔</button><button data-drawing-starter="star">一颗星星</button></div>
        <label class="name-label" for="plush-name">它叫什么？<input id="plush-name" type="text" maxlength="16" value="小小布偶" autocomplete="off" /></label>
      </div>
    </div>
    <div class="drawing-footer"><p id="drawing-message" role="status">作品只保存在这台设备。可以随时重新画。</p><button id="create-plush" class="primary-button" disabled>变成小布偶 ${icon('sparkle', 17)}</button></div>
    <button id="play-with-plush" class="text-button" hidden>和上次画的朋友玩 ${icon('heart', 15)}</button>
  </section>
  <section id="together-panel" class="wonder-panel together-panel" role="dialog" aria-modal="true" aria-labelledby="together-panel-title" hidden>
    <div class="panel-top"><span class="eyebrow">A LITTLE TIME, TOGETHER</span><button class="icon-button close-panel" aria-label="关闭一起玩菜单">${icon('close')}</button></div>
    <h2 id="together-panel-title">这次，换你陪她玩。</h2>
    <p class="panel-copy">一颗来回滚的小球，一次藏起来的惊喜。<br>你的小动作，她都会回应。</p>
    <div class="together-options">
      <button data-together="roll"><span class="play-art">${toyIcon('ball')}</span><span><strong>小球，滚过来</strong><small>你传给她，她再滚回来。</small></span>${icon('arrow', 17)}</button>
      <button data-together="hide"><span class="play-art hide-art">${icon('search', 34)}</span><span><strong>小熊藏在哪里？</strong><small>选一个藏身处，看她找呀找。</small></span>${icon('arrow', 17)}</button>
      <button data-together="bubbles"><span class="play-art bubble-art">${icon('bubbles', 38)}</span><span><strong>吹一口，满屋泡泡</strong><small>点一下，或用麦克风轻轻吹。</small></span>${icon('arrow', 17)}</button>
    </div>
  </section>`;
}
