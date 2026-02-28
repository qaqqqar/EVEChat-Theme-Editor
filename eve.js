let _initPhase = true;
const defaultImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop';
const colorPickerRegistry = {};
// ==================== 补全缺失的核心渲染函数 ====================
function updatePreview() {
    const previewMessages = document.getElementById('previewMessages');
    if (!previewMessages) return;
    
    // 根据当前的模式生成预览
    if (typeof currentMainTab !== 'undefined' && currentMainTab !== 'preview' && currentMainTab !== 'overall' && currentMainTab !== 'export') {
        previewMessages.innerHTML = generatePreviewBySubTab(currentMainTab);
    } else {
        previewMessages.innerHTML = generateAllMessages();
    }
    
    // 如果存在工具栏渲染函数，连带刷新
    if (typeof renderPreviewToolbar === 'function') {
        renderPreviewToolbar();
    }
}

function generateMessageByType(msg, roundInfo) {
    const index = roundInfo ? roundInfo.index : 0;
    const total = roundInfo ? roundInfo.total : 1;
    
    switch (msg.type) {
        case 'text': return generateCustomTextWithIndex(msg.side, msg.side === 'sent' ? '你好！' : '你好呀！', index, total);
        case 'text2': return generateCustomTextWithIndex(msg.side, '这是主题编辑器测试', index, total);
        case 'text3': return generateCustomTextWithIndex(msg.side, '排版看这里哦', index, total);
        case 'text4': return generateCustomTextWithIndex(msg.side, '效果还不错吧？', index, total);
        case 'text5': return generateCustomTextWithIndex(msg.side, '确实很好看', index, total);
        case 'text6': return generateCustomTextWithIndex(msg.side, '定制能力很强', index, total);
        case 'text7': return generateCustomTextWithIndex(msg.side, '接下来看看其他组件', index, total);
        case 'image': return generateImagePreviewWithIndex(msg.side, msg.hasBubble, index, total);
        case 'dreamy': return generateDreamyPhotoPreviewWithIndex(msg.side, index, total);
        case 'emoji': return generateEmojiPreviewWithIndex(msg.side, msg.hasBubble, index, total);
        case 'reply': return generateReplyPreviewWithIndex(msg.side, index, total);
        case 'voice': return generateVoicePreviewWithIndex(msg.side, index, total);
        case 'transfer': return generateTransferPreviewWithIndex(msg.side, index, total);
        default: return generateTextPreviewWithIndex(msg.side, index, total);
    }
}

let getBubbleStyle = function() { return ""; }; // 为下方拦截占位
// ==========================================================

function initColorPicker(containerId, configKey, label, defaultConfig) {
    const cfg = defaultConfig || { type: 'solid', color: '#333333', opacity: 100, gradientColors: [{ color: '#333333', position: 0 }, { color: '#999999', position: 100 }], direction: 'to right' };
    colorPickerRegistry[configKey] = JSON.parse(JSON.stringify(cfg));
    renderColorPickerHtml(containerId, configKey, label);
}

function renderColorPickerHtml(containerId, key, label) {
    const c = colorPickerRegistry[key];
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
    <div class="color-picker-component">
        <span class="color-picker-label">${label}</span>
        <div class="editor-row">
            <span class="editor-label">类型</span>
            <select class="editor-select" id="cp-${key}-type" onchange="cpToggleType('${key}')">
                <option value="solid" ${c.type==='solid'?'selected':''}>纯色</option>
                <option value="gradient" ${c.type==='gradient'?'selected':''}>渐变</option>
            </select>
        </div>

        <div id="cp-${key}-solid" style="${c.type==='gradient'?'display:none':''}">
            <div class="editor-row">
                <span class="editor-label">颜色</span>
                <div class="editor-color-row">
                    <input type="color" class="editor-color-input" id="cp-${key}-color" value="${c.color}"
                           onchange="cpUpdateSolid('${key}')">
                    <input type="text" class="editor-color-text" id="cp-${key}-hex" value="${c.color}"
                           onchange="document.getElementById('cp-${key}-color').value=this.value; cpUpdateSolid('${key}')">
                </div>
            </div>
            <div class="editor-row">
                <span class="editor-label">透明度</span>
                <input type="range" class="editor-slider" id="cp-${key}-opacity" min="0" max="100" value="${c.opacity}"
                       oninput="cpUpdateSolid('${key}'); document.getElementById('cp-${key}-opval').textContent=this.value+'%'">
                <span id="cp-${key}-opval">${c.opacity}%</span>
            </div>
        </div>

        <div id="cp-${key}-gradient" style="${c.type==='solid'?'display:none':''}">
            <div class="editor-row">
                <span class="editor-label">方向</span>
                <select class="editor-select" id="cp-${key}-dir" onchange="cpUpdateGradient('${key}')">
                    <option value="to right" ${c.direction==='to right'?'selected':''}>→ 向右</option>
                    <option value="to left" ${c.direction==='to left'?'selected':''}>← 向左</option>
                    <option value="to bottom" ${c.direction==='to bottom'?'selected':''}>↓ 向下</option>
                    <option value="to top" ${c.direction==='to top'?'selected':''}>↑ 向上</option>
                    <option value="to bottom right" ${c.direction==='to bottom right'?'selected':''}>↘ 右下</option>
                    <option value="to bottom left" ${c.direction==='to bottom left'?'selected':''}>↙ 左下</option>
                    <option value="to top right" ${c.direction==='to top right'?'selected':''}>↗ 右上</option>
                    <option value="to top left" ${c.direction==='to top left'?'selected':''}>↖ 左上</option>
                    <option value="circle" ${c.direction==='circle'?'selected':''}>◎ 径向</option>
                </select>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span class="editor-label">颜色节点</span>
                <button class="editor-btn" onclick="cpAddColor('${key}')" style="padding:4px 8px;font-size:11px;">+ 添加</button>
            </div>
            <div id="cp-${key}-colors" class="gradient-color-list"></div>
            <div class="editor-row" style="margin-top:8px;">
                <span class="editor-label">预览</span>
                <div id="cp-${key}-preview" style="flex:1;height:24px;border-radius:4px;border:1px solid var(--border-color);"></div>
            </div>
        </div>
    </div>`;

    if (c.type === 'gradient') {
        cpRenderGradientColors(key);
        cpUpdateGradientPreview(key);
    }
}

function cpToggleType(key) {
    const type = document.getElementById(`cp-${key}-type`).value;
    colorPickerRegistry[key].type = type;
    document.getElementById(`cp-${key}-solid`).style.display = type === 'solid' ? '' : 'none';
    document.getElementById(`cp-${key}-gradient`).style.display = type === 'gradient' ? '' : 'none';
    if (type === 'gradient') {
        cpRenderGradientColors(key);
        cpUpdateGradientPreview(key);
    }
    updatePreview();
}

let _cpUpdateTimer = null;
function cpUpdateSolid(key) {
    var c = colorPickerRegistry[key];
    c.color = document.getElementById('cp-' + key + '-color').value;
    c.opacity = parseInt(document.getElementById('cp-' + key + '-opacity').value);
    document.getElementById('cp-' + key + '-hex').value = c.color;
    updatePreview();
}

function cpAddColor(key) {
    const colors = colorPickerRegistry[key].gradientColors;
    colors.push({ color: '#aaaaaa', position: 100 });
    cpRenderGradientColors(key);
    cpUpdateGradientPreview(key);
    updatePreview();
}

function cpRemoveColor(key, idx) {
    const colors = colorPickerRegistry[key].gradientColors;
    if (colors.length <= 2) {
        showCustomAlert('至少需要2个颜色', 'warning', '无法删除');
        return;
    }
    colors.splice(idx, 1);
    cpRenderGradientColors(key);
    cpUpdateGradientPreview(key);
    updatePreview();
}

function cpUpdateGradientColor(key, idx, color) {
    colorPickerRegistry[key].gradientColors[idx].color = color;
    cpRenderGradientColors(key);
    cpUpdateGradientPreview(key);
    updatePreview();
}

function cpUpdateGradientPos(key, idx, pos) {
    colorPickerRegistry[key].gradientColors[idx].position = parseInt(pos);
    cpUpdateGradientPreview(key);
    updatePreview();
}

function cpUpdateGradient(key) {
    colorPickerRegistry[key].direction = document.getElementById(`cp-${key}-dir`).value;
    cpUpdateGradientPreview(key);
    updatePreview();
}

function cpRenderGradientColors(key) {
    const container = document.getElementById(`cp-${key}-colors`);
    if (!container) return;
    const colors = colorPickerRegistry[key].gradientColors;
    container.innerHTML = colors.map((item, i) => `
        <div class="gradient-color-item">
            <input type="color" class="editor-color-input" value="${item.color}"
                   onchange="cpUpdateGradientColor('${key}', ${i}, this.value)">
            <input type="text" class="color-hex" value="${item.color}"
                   onchange="cpUpdateGradientColor('${key}', ${i}, this.value)">
            <input type="number" class="color-position" value="${item.position}" min="0" max="100"
                   onchange="cpUpdateGradientPos('${key}', ${i}, this.value)">
            <span style="font-size:11px;color:var(--text-muted);">%</span>
            <button class="delete-color-btn" onclick="cpRemoveColor('${key}', ${i})">×</button>
        </div>
    `).join('');
}

function cpUpdateGradientPreview(key) {
    const preview = document.getElementById(`cp-${key}-preview`);
    if (!preview) return;
    const c = colorPickerRegistry[key];
    const sorted = [...c.gradientColors].sort((a, b) => a.position - b.position);
    const stops = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
    if (c.direction === 'circle') {
        preview.style.background = `radial-gradient(circle, ${stops})`;
    } else {
        preview.style.background = `linear-gradient(${c.direction}, ${stops})`;
    }
}

function cpGetCssValue(key) {
    const c = colorPickerRegistry[key];
    if (!c) return '#333333';
    if (c.type === 'solid') {
        if (c.opacity < 100) {
            const r = parseInt(c.color.slice(1, 3), 16);
            const g = parseInt(c.color.slice(3, 5), 16);
            const b = parseInt(c.color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${c.opacity / 100})`;
        }
        return c.color;
    } else {
        const sorted = [...c.gradientColors].sort((a, b) => a.position - b.position);
        const stops = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
        if (c.direction === 'circle') {
            return `radial-gradient(circle, ${stops})`;
        }
        return `linear-gradient(${c.direction}, ${stops})`;
    }
}

function cpIsGradient(key) {
    return colorPickerRegistry[key]?.type === 'gradient';
}

const shadowPickerRegistry = {};

function initShadowPicker(containerId, configKey, label, defaultConfig) {
    const cfg = defaultConfig || {
        enabled: false, type: 'solid', color: '#000000', opacity: 15,
        x: 0, y: 2, blur: 6, spread: 0,
        inset: false,
        direction: 'to right',
        gradientColors: [{ color: '#000000', position: 0 }, { color: '#666666', position: 100 }]
    };
    shadowPickerRegistry[configKey] = JSON.parse(JSON.stringify(cfg));
    renderShadowPickerHtml(containerId, configKey, label);
}

function renderShadowPickerHtml(containerId, key, label) {
    const c = shadowPickerRegistry[key];
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
    <div style="border:1px solid var(--border-color);border-radius:8px;padding:12px;margin-bottom:12px;background:var(--bg-light);">
        <div class="editor-switch-row">
            <span class="editor-label">${label}</span>
            <label class="editor-switch">
                <input type="checkbox" id="sp-${key}-enable" ${c.enabled?'checked':''}
                       onchange="spToggle('${key}')">
                <span class="editor-switch-slider"></span>
            </label>
        </div>
        <div id="sp-${key}-body" style="${c.enabled?'':'display:none'}">
            <div class="editor-switch-row" style="margin-bottom:8px;">
                <span class="editor-label">内阴影 (inset)</span>
                <label class="editor-switch">
                    <input type="checkbox" id="sp-${key}-inset" ${c.inset?'checked':''}
                           onchange="spUpdateInset('${key}', this.checked)">
                    <span class="editor-switch-slider"></span>
                </label>
            </div>
            <div class="editor-row">
                <span class="editor-label">类型</span>
                <select class="editor-select" id="sp-${key}-type" onchange="spToggleType('${key}')">
                    <option value="solid" ${c.type==='solid'?'selected':''}>纯色</option>
                    <option value="gradient" ${c.type==='gradient'?'selected':''}>渐变</option>
                </select>
            </div>

            <div id="sp-${key}-solid" style="${c.type==='gradient'?'display:none':''}">
                <div class="editor-row">
                    <span class="editor-label">颜色</span>
                    <div class="editor-color-row">
                        <input type="color" class="editor-color-input" id="sp-${key}-color" value="${c.color}"
                               onchange="spUpdate('${key}')">
                        <input type="text" class="editor-color-text" id="sp-${key}-hex" value="${c.color}"
                               onchange="document.getElementById('sp-${key}-color').value=this.value;spUpdate('${key}')">
                    </div>
                </div>
                <div class="editor-row">
                    <span class="editor-label">透明度</span>
                    <input type="range" class="editor-slider" id="sp-${key}-opacity" min="0" max="100" value="${c.opacity}"
                           oninput="spUpdate('${key}');document.getElementById('sp-${key}-opval').textContent=this.value+'%'">
                    <span id="sp-${key}-opval">${c.opacity}%</span>
                </div>
            </div>

            <div id="sp-${key}-gradient" style="${c.type==='solid'?'display:none':''}">
                <div class="editor-row">
                    <span class="editor-label">方向</span>
                    <select class="editor-select" id="sp-${key}-dir" onchange="spUpdate('${key}')">
                        <option value="to right" ${c.direction==='to right'?'selected':''}>→ 向右</option>
                        <option value="to left" ${c.direction==='to left'?'selected':''}>← 向左</option>
                        <option value="to bottom" ${c.direction==='to bottom'?'selected':''}>↓ 向下</option>
                        <option value="to top" ${c.direction==='to top'?'selected':''}>↑ 向上</option>
                        <option value="to bottom right" ${c.direction==='to bottom right'?'selected':''}>↘ 右下</option>
                        <option value="to bottom left" ${c.direction==='to bottom left'?'selected':''}>↙ 左下</option>
                        <option value="to top right" ${c.direction==='to top right'?'selected':''}>↗ 右上</option>
                        <option value="to top left" ${c.direction==='to top left'?'selected':''}>↖ 左上</option>
                        <option value="circle" ${c.direction==='circle'?'selected':''}>◎ 径向</option>
                    </select>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span class="editor-label">颜色</span>
                    <button class="editor-btn" onclick="spAddColor('${key}')" style="padding:3px 6px;font-size:11px;">+</button>
                </div>
                <div id="sp-${key}-colors" class="gradient-color-list"></div>
            </div>

            <div class="editor-row">
                <span class="editor-label">X偏移</span>
                <input type="range" class="editor-slider" id="sp-${key}-x" min="-50" max="50" value="${c.x}" oninput="spUpdate('${key}')">
<input type="number" class="editor-input" id="sp-${key}-xinput" value="${c.x}" style="width:50px;" oninput="document.getElementById('sp-${key}-x').value=this.value;spUpdate('${key}')">
                <span style="min-width:20px;">px</span>
            </div>
            <div class="editor-row">
                <span class="editor-label">Y偏移</span>
                <input type="range" class="editor-slider" id="sp-${key}-y" min="-50" max="50" value="${c.y}" oninput="spUpdate('${key}')">
<input type="number" class="editor-input" id="sp-${key}-yinput" value="${c.y}" style="width:50px;" oninput="document.getElementById('sp-${key}-y').value=this.value;spUpdate('${key}')">
                <span style="min-width:20px;">px</span>
            </div>
            <div class="editor-row">
                <span class="editor-label">模糊</span>
                <input type="range" class="editor-slider" id="sp-${key}-blur" min="0" max="50" value="${c.blur}" oninput="spUpdate('${key}')">
<input type="number" class="editor-input" id="sp-${key}-blurinput" value="${c.blur}" style="width:50px;" oninput="document.getElementById('sp-${key}-blur').value=this.value;spUpdate('${key}')">
                <span style="min-width:20px;">px</span>
            </div>
            <div class="editor-row">
                <span class="editor-label">扩展</span>
                <input type="range" class="editor-slider" id="sp-${key}-spread" min="-20" max="50" value="${c.spread}" oninput="spUpdate('${key}')">
<input type="number" class="editor-input" id="sp-${key}-spreadinput" value="${c.spread}" style="width:50px;" oninput="document.getElementById('sp-${key}-spread').value=this.value;spUpdate('${key}')">
                <span style="min-width:20px;">px</span>
            </div>
        </div>
    </div>`;

    if (c.type === 'gradient') spRenderColors(key);
}

function spToggle(key) {
    shadowPickerRegistry[key].enabled = document.getElementById(`sp-${key}-enable`).checked;
    document.getElementById(`sp-${key}-body`).style.display = shadowPickerRegistry[key].enabled ? '' : 'none';
    updatePreview();
}

function spToggleType(key) {
    const type = document.getElementById(`sp-${key}-type`).value;
    shadowPickerRegistry[key].type = type;
    document.getElementById(`sp-${key}-solid`).style.display = type === 'solid' ? '' : 'none';
    document.getElementById(`sp-${key}-gradient`).style.display = type === 'gradient' ? '' : 'none';
    if (type === 'gradient') spRenderColors(key);
    spUpdate(key);
}

function spUpdateInset(key, checked) {
    shadowPickerRegistry[key].inset = checked;
    updatePreview();
}

function spUpdate(key) {
    const c = shadowPickerRegistry[key];
    c.x = parseInt(document.getElementById(`sp-${key}-x`)?.value || 0);
    c.y = parseInt(document.getElementById(`sp-${key}-y`)?.value || 2);
    c.blur = parseInt(document.getElementById(`sp-${key}-blur`)?.value || 6);
    c.spread = parseInt(document.getElementById(`sp-${key}-spread`)?.value || 0);

    const xval = document.getElementById(`sp-${key}-xval`);
const yval = document.getElementById(`sp-${key}-yval`);
const blurval = document.getElementById(`sp-${key}-blurval`);
const spreadval = document.getElementById(`sp-${key}-spreadval`);
if (xval) xval.textContent = c.x + 'px';
if (yval) yval.textContent = c.y + 'px';
if (blurval) blurval.textContent = c.blur + 'px';
if (spreadval) spreadval.textContent = c.spread + 'px';

const xinput = document.getElementById(`sp-${key}-xinput`);
const yinput = document.getElementById(`sp-${key}-yinput`);
const blurinput = document.getElementById(`sp-${key}-blurinput`);
const spreadinput = document.getElementById(`sp-${key}-spreadinput`);
if (xinput) xinput.value = c.x;
if (yinput) yinput.value = c.y;
if (blurinput) blurinput.value = c.blur;
if (spreadinput) spreadinput.value = c.spread;
    if (c.type === 'solid') {
        c.color = document.getElementById(`sp-${key}-color`)?.value || '#000000';
        c.opacity = parseInt(document.getElementById(`sp-${key}-opacity`)?.value || 15);
        document.getElementById(`sp-${key}-hex`).value = c.color;
    } else {
        c.direction = document.getElementById(`sp-${key}-dir`)?.value || 'to right';
    }
    
updatePreview();
}

let _spUpdateTimer = null;

function spAddColor(key) {
    shadowPickerRegistry[key].gradientColors.push({ color: '#aaaaaa', position: 100 });
    spRenderColors(key);
    spUpdate(key);
}

function spRemoveColor(key, idx) {
    if (shadowPickerRegistry[key].gradientColors.length <= 2) {
        showCustomAlert('至少需要2个颜色', 'warning');
        return;
    }
    shadowPickerRegistry[key].gradientColors.splice(idx, 1);
    spRenderColors(key);
    spUpdate(key);
}

function spRenderColors(key) {
    const container = document.getElementById(`sp-${key}-colors`);
    if (!container) return;
    container.innerHTML = shadowPickerRegistry[key].gradientColors.map((item, i) => `
        <div class="gradient-color-item">
            <input type="color" class="editor-color-input" value="${item.color}"
                   onchange="shadowPickerRegistry['${key}'].gradientColors[${i}].color=this.value;this.nextElementSibling.value=this.value;spUpdate('${key}')">
            <input type="text" class="color-hex" value="${item.color}"
                   onchange="shadowPickerRegistry['${key}'].gradientColors[${i}].color=this.value;this.previousElementSibling.value=this.value;spUpdate('${key}')">
            <input type="number" class="color-position" value="${item.position}" min="0" max="100"
                   onchange="shadowPickerRegistry['${key}'].gradientColors[${i}].position=parseInt(this.value);spUpdate('${key}')">
            <span style="font-size:11px;">%</span>
            <button class="delete-color-btn" onclick="spRemoveColor('${key}',${i})">×</button>
        </div>
    `).join('');
}   

function spGetCssValue(key) {
    const c = shadowPickerRegistry[key];
    if (!c || !c.enabled) return 'none';
    const insetPrefix = c.inset ? 'inset ' : '';
    if (c.type === 'solid') {
        const r = parseInt(c.color.slice(1, 3), 16);
        const g = parseInt(c.color.slice(3, 5), 16);
        const b = parseInt(c.color.slice(5, 7), 16);
        return `${insetPrefix}${c.x}px ${c.y}px ${c.blur}px ${c.spread}px rgba(${r},${g},${b},${c.opacity/100})`;
    } else {
        return c.gradientColors.map((gc, i) => {
            const ratio = c.gradientColors.length > 1 ? (i / (c.gradientColors.length - 1)) * 2 - 1 : 0;
            return `${insetPrefix}${c.x + ratio * 3}px ${c.y + ratio * 3}px ${c.blur}px ${c.spread}px ${gc.color}`;
        }).join(', ');
    }
}

const bubbleConfig = {
transferTitleVisible: true,   
transferAmountVisible: true,  
transferNoteVisible: true,    
transferStatusVisible: true,  

transferTitleSent: '💕 你发起的转账',
transferTitleRecv: '💖 收到转账',
transferAmountSent: '¥ 70.00',
transferAmountRecv: '¥ 5.20',
transferNoteSent: '转账',
transferNoteRecv: '爱你么么哒',

transferStatusSent: '对方已收款', 
transferStatusRecv: '已收款',     

transferTitleX: 0,
transferTitleY: 0,
transferAmountX: 0,
transferAmountY: 0,
transferNoteX: 0,
transferNoteY: 0,
transferStatusX: 0,
transferStatusY: 0,

transferTitleLayer: 'after',
transferAmountLayer: 'after',
transferNoteLayer: 'after',
transferStatusLayer: 'after',

    
    transferWidth: 220,
    transferHeight: 110,
    transferRadius: 12,
    transferBorderWidth: 0,
    
    transferBgImageEnabled: false,
    transferBgUrl: '',
    
    transferDecorations: [], 
    
replyPrefixIconUrl: '', 
replyBgUrl: '', 
replyFontUrl: '', 
replyFontFamily: '', 
replyShowSender: true, 
replyShowTime: true,   
replyPrefixIconNav: 'ri-chat-quote-fill', 
replyJumpBtnText: '↑', 
    fontSize: 15, // 保持 overall 的兼容性
fontSizeSent: 15, // 新增：我方独立字体大小
fontSizeRecv: 15, // 新增：对方独立字体大小
    fontUrl: '',
    fontFamily: '',
    fontWeight: 'normal',
textBgEnabled: false,
textBgUrl: '',
textBgColor: '',
textBgRadius: { unified: true, all: 0, tl: 0, tr: 0, br: 0, bl: 0 },  

    borderRadius: { unified: true, all: 18, tl: 18, tr: 18, br: 18, bl: 18 },
    padding: { unified: true, all: 10, t: 8, r: 12, b: 8, l: 12 },
    margin: { unified: true, all: 0, t: 0, r: 0, b: 0, l: 0 },
bgImageEnabled: false,
    bgUrl: '',
    bgSize: 'cover',
    bgPosition: 'center center',

    borderWidth: { unified: true, all: 0, t: 0, r: 0, b: 0, l: 0 },
    borderStyle: 'solid',

    bubbleDecorations: [],
    
bubblePrefix: {
    enabled: false,
    text: '「',
    position: 'inside', 
    x: 0,
    y: 0,
    fontSize: 14,
    color: '#999999',
    fontWeight: 'normal'
},
bubbleSuffix: {
    enabled: false,
    text: '」',
    position: 'inside', 
    x: 0,
    y: 0,
    fontSize: 14,
    color: '#999999',
    fontWeight: 'normal'
},


    
    voiceWaveStyle: 'bars',
    voiceWaveCount: 4,
    voiceTextPosition: 'bottom',
    voiceTextFontSize: 14,
    voiceTextRadius: 12,
    voiceTextBorderWidth: 0,
    voiceTextBgUrl: '',
    
voiceWaveSource: 'builtin', 
voiceCustomIcon: {
    url: '',
    width: 50,
    height: 16,
    renderMode: 'mask' 
},

    
    emojiShowBubble: true,
    emojiMaxSize: 100,
    emojiRadius: 8,

    
    imageShowBubble: true,
    imageMaxWidth: 150,
    imageMaxHeight: 150,
    imageRadius: 10,
    placeholderType: 'url',
    placeholderUrl: '',
    placeholderSvg: '',
    placeholderEmoji: 'emoji',
    placeholderText: '',

    
    descRadius: 10,
    descBorderWidth: 0,
    
    

replyPreset: 'default', 
replyPosition: 'inside', 
replyBarStyle: 'none', 
replyBarWidth: 3,
replyBarColor: '#007AFF',
replyBgColor: '#F3F3F3',
replyBgRadius: 6,
replyPadding: 6,
replyFontSize: 12,
replySenderColor: '#333',
replyTimeColor: '#999',
replyMsgColor: '#666',

replyJumpBtnType: 'icon', 
replyJumpBtnIcon: 'mdi:arrow-collapse-up',
replyJumpBtnUrl: '',
replyJumpBtnSize: 16,
replyJumpBtnWidth: 24, 
replyJumpBtnHeight: 24, 
replyJumpBtnColor: '#BCBCBC',
replyJumpBtnBg: 'transparent',
replyJumpBtnRadius: 0,

replyBarPlacement: 'inside',  
replyBarOffsetX: 0,
replyBarOffsetY: 0,

replyJumpBtnPlacement: 'inside',  
replyJumpBtnOffsetX: 0,
replyJumpBtnOffsetY: 0,
replyBorderWidth: 0,
replyBorderColor: '#E6E6E6',

replyTimeHideMethod: 'display-none', 


replyJumpBtnExternal: false,
replyJumpBtnExternalText: '跳转',
replyJumpBtnExternalPos: 'right', 
replyJumpBtnExternalGap: 6,
replyJumpBtnExternalFontSize: 11,
replyJumpBtnExternalRadius: 4,
replyJumpBtnExternalPadX: 10,
replyJumpBtnExternalPadY: 3,
};

// ==================== 核心：数据隔离代理池 ====================
// 在此处开辟两方专属缓存区，隔离全局数据
const sideOverrides = { sent: {}, received: {} };

// 获取写入时的目标对象（谁切面就归谁）
function getActiveObj(prop) {
    if (currentMainTab === 'sent' || currentMainTab === 'received') {
        const side = currentMainTab;
        if (!sideOverrides[side][prop]) {
            // 深拷贝原配置作为该侧初始值，不污染全局
            sideOverrides[side][prop] = JSON.parse(JSON.stringify(bubbleConfig[prop]));
        }
        return sideOverrides[side][prop];
    }
    // 如果处在“整体视图”，则修改主干配置
    return bubbleConfig[prop];
}

// 渲染读取时，判断需要哪一方的数据
function getRenderObj(prop, isSent) {
    const side = isSent ? 'sent' : 'received';
    // 优先读取单侧经过滑块改动覆盖产生的数据，没有则回溯读取整体
    if (sideOverrides[side] && sideOverrides[side][prop]) {
        return sideOverrides[side][prop];
    }
    return bubbleConfig[prop];
}
// ==========================================================

function updateBubbleConfig(prop, value) {
    if (prop === 'borderWidth') return;

    if (typeof value === 'string' && !isNaN(value) && value !== '' && prop !== 'fontUrl' && prop !== 'bgUrl' && prop !== 'decoUrl' && prop !== 'placeholderUrl' && prop !== 'placeholderSvg' && prop !== 'placeholderEmoji' && prop !== 'placeholderText' && prop !== 'bgSize' && prop !== 'borderStyle' && prop !== 'voiceTextBgUrl') {
        bubbleConfig[prop] = parseInt(value);
    } else if (value === true || value === false) {
        bubbleConfig[prop] = value;
    } else {
        bubbleConfig[prop] = value;
    }

   
    const displayMap = {
        'emojiMaxSize': 'emoji-max-size-val',
        'imageMaxWidth': 'image-max-w-val',
        'imageMaxHeight': 'image-max-h-val',
        'imageRadius': 'image-radius-val',
        'descRadius': 'image-desc-radius-val',
        'descBorderWidth': 'image-desc-border-w-val',
        
    };
    if (displayMap[prop]) {
        const el = document.getElementById(displayMap[prop]);
        if (el) el.textContent = value + 'px';
    }

    styleConfig.text.fontSize = bubbleConfig.fontSize;
    styleConfig.text.bubbleRadius = bubbleConfig.borderRadius.unified ? bubbleConfig.borderRadius.all : 0;
    styleConfig.image.maxWidth = bubbleConfig.imageMaxWidth;
    styleConfig.image.maxHeight = bubbleConfig.imageMaxHeight;
    styleConfig.image.radius = bubbleConfig.imageRadius;
    styleConfig.emoji.maxSize = bubbleConfig.emojiMaxSize;
    styleConfig.emoji.showBubble = bubbleConfig.emojiShowBubble;

    updatePreview();
}

// ==================== 四边控制 ====================
function toggleFourSidesMode(prop, unified) {
    const targetObj = getActiveObj(prop);
    targetObj.unified = unified;
    const uniformDiv = document.getElementById(`${prop}-uniform`);
    const individualDiv = document.getElementById(`${prop}-individual`);
    
    if (unified) {
        uniformDiv.style.display = 'block';
        individualDiv.style.display = 'none';
    } else {
        uniformDiv.style.display = 'none';
        individualDiv.style.display = 'block';
    }
    updatePreview();
}

function updateFourSidesUniform(prop, value) {
    const v = parseInt(value);
    const targetObj = getActiveObj(prop); // <== 拦截分配
    targetObj.all = v;
    targetObj.tl = v; targetObj.tr = v; targetObj.br = v; targetObj.bl = v;
    targetObj.t = v; targetObj.r = v; targetObj.b = v; targetObj.l = v;
    
    const prefixMap = { 'borderRadius': 'br', 'padding': 'pad', 'margin': 'mar', 'borderWidth': 'bw' };
    const prefix = prefixMap[prop] || prop;
    const slider = document.getElementById(`${prefix}-all-slider`);
    const input = document.getElementById(`${prefix}-all-input`);
    if (slider) slider.value = v;
    if (input) input.value = v;
    updatePreview();
}

function updateFourSides(prop, side, value) {
    const v = parseInt(value);
    const targetObj = getActiveObj(prop); // <== 拦截分配
    targetObj[side] = v;
    const prefixMap = { 'borderRadius': 'br', 'padding': 'pad', 'margin': 'mar', 'borderWidth': 'bw' };
    const prefix = prefixMap[prop] || prop;
    const input = document.getElementById(`${prefix}-${side}`);
    if (input) input.value = v;
    updatePreview();
}

function getFourSidesCss(prop, isSent) {
    // 读取时根据气泡发送方身份自动判定读取池
    const c = getRenderObj(prop, isSent); 
    if (c.unified) {
        return `${c.all}px`;
    }
    if (prop === 'borderRadius') {
        return `${c.tl}px ${c.tr}px ${c.br}px ${c.bl}px`;
    }
    return `${c.t}px ${c.r}px ${c.b}px ${c.l}px`;
}

// ==================== 字体上传 ====================
function handleFontUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            bubbleConfig.fontUrl = dataUrl;
            document.getElementById('font-url').value = '(已上传本地字体)';

            let styleEl = document.getElementById('custom-font-style');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'custom-font-style';
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = `
                @font-face {
                    font-family: 'CustomBubbleFont';
                    src: url('${dataUrl}');
                    font-display: swap;
                }
            `;
            bubbleConfig.fontFamily = 'CustomBubbleFont';
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function applyCustomFont(url) {
    let styleEl = document.getElementById('custom-font-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-font-style';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
        @font-face {
            font-family: 'CustomBubbleFont';
            src: url('${url}');
        }
        .preview-message-text,
        .preview-bubble,
        .preview-voice-text-content,
        .preview-reply-reference-message {
            font-family: 'CustomBubbleFont', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
    `;
    bubbleConfig.fontFamily = 'CustomBubbleFont';
}

// ==================== 背景图上传 ====================
function handleBubbleBgUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('bubble-bg-url').value = e.target.result;
            bubbleConfig.bgUrl = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function setBubbleBgPos(pos) {
    bubbleConfig.bgPosition = pos;
    document.querySelectorAll('#bubble-bg-position-grid .pos-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.pos === pos);
    });
    updatePreview();
}

// ==================== 气泡前缀/后缀 ====================
function updatePrefixSuffix(which, prop, value) {
    const cfg = which === 'prefix' ? bubbleConfig.bubblePrefix : bubbleConfig.bubbleSuffix;
    if (['x','y','fontSize'].includes(prop)) {
        cfg[prop] = parseInt(value);
    } else if (prop === 'enabled') {
        cfg[prop] = value;
        document.getElementById(`${which}-settings`).style.display = value ? 'block' : 'none';
    } else {
        cfg[prop] = value;
    }
    updatePreview();
}

function getPrefixSuffixHtml(which, isSent) {
    const cfg = which === 'prefix' ? bubbleConfig.bubblePrefix : bubbleConfig.bubbleSuffix;
    if (!cfg.enabled || !cfg.text) return '';

    if (cfg.position === 'inside') {
        
        return `<span style="
            display:inline-block;
            font-size:${cfg.fontSize}px;
            color:${cfg.color};
            font-weight:${cfg.fontWeight};
            position:relative;
            left:${cfg.x}px;
            top:${cfg.y}px;
            pointer-events:none;
            vertical-align:middle;
            ${which === 'prefix' ? 'margin-right:2px;' : 'margin-left:2px;'}
        ">${cfg.text}</span>`;
    } else {
        
        let posStyle = 'position:absolute;';
        if (which === 'prefix') {
            posStyle += `left:${-20 + cfg.x}px; top:50%; transform:translateY(-50%) translateY(${cfg.y}px);`;
        } else {
            posStyle += `right:${-20 + (-cfg.x)}px; top:50%; transform:translateY(-50%) translateY(${cfg.y}px);`;
        }
        return `<span style="
            ${posStyle}
            font-size:${cfg.fontSize}px;
            color:${cfg.color};
            font-weight:${cfg.fontWeight};
            pointer-events:none;
            white-space:nowrap;
            z-index:5;
        ">${cfg.text}</span>`;
    }
}

function addBubbleDeco() {
    saveUndoState();
    bubbleConfig.bubbleDecorations.push({
        img: '',
        x: 0,
        y: -30,
        size: 40,
        flip: 0,
        anchor: 'top-left',
        pseudo: 'after'
    });
    renderBubbleDecoList();
    updatePreview();
}

function removeBubbleDeco(i) {
    saveUndoState();
    bubbleConfig.bubbleDecorations.splice(i, 1);
    renderBubbleDecoList();
    updatePreview();
}

function updateBubbleDeco(i, key, value) {
    if (key === 'x' || key === 'y' || key === 'size' || key === 'flip') {
        value = parseInt(value);
    }
    bubbleConfig.bubbleDecorations[i][key] = value;
    updatePreview();
}

function handleBubbleDecoUploadAt(input, index) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bubbleConfig.bubbleDecorations[index].img = e.target.result;
            renderBubbleDecoList();
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function renderBubbleDecoList() {
    const container = document.getElementById('bubbleDecoList');
    if (!container) return;

    const decos = bubbleConfig.bubbleDecorations;

    if (decos.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:12px;padding:16px 0;">暂无气泡装饰</p>';
        return;
    }

    container.innerHTML = decos.map((d, i) => `
        <div class="decoration-item">
            <div class="decoration-item-header">
                <span class="decoration-item-title"> 装饰 #${i + 1}</span>
                <div class="decoration-item-actions">
                    <button class="decoration-delete-btn" onclick="removeBubbleDeco(${i})" title="删除">×</button>
                </div>
            </div>

            <!-- 图片URL -->
            <div class="decoration-row">
                <span class="decoration-label">图片URL</span>
                <input type="text" class="decoration-input" value="${d.img}" placeholder="https://example.com/image.png"
                       onchange="updateBubbleDeco(${i}, 'img', this.value)">
            </div>

            <!-- 上传图片 -->
            <div class="decoration-row">
                <span class="decoration-label">上传</span>
                <input type="file" class="decoration-input" accept="image/*"
                       onchange="handleBubbleDecoUploadAt(this, ${i})">
            </div>

            <!-- 锚点 -->
            <div class="decoration-row">
                <span class="decoration-label">锚点</span>
                <select class="decoration-input" onchange="updateBubbleDeco(${i}, 'anchor', this.value)">
                    <option value="top-left" ${d.anchor === 'top-left' ? 'selected' : ''}>↖ 左上</option>
                    <option value="top-right" ${d.anchor === 'top-right' ? 'selected' : ''}>↗ 右上</option>
                    <option value="bottom-left" ${d.anchor === 'bottom-left' ? 'selected' : ''}>↙ 左下</option>
                    <option value="bottom-right" ${d.anchor === 'bottom-right' ? 'selected' : ''}>↘ 右下</option>
                </select>
            </div>

            <!-- 水平X -->
            <div class="decoration-row">
                <span class="decoration-label">水平 X</span>
                <input type="range" class="decoration-slider" min="-150" max="150" value="${d.x}"
                       oninput="updateBubbleDeco(${i}, 'x', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                <span class="decoration-value">${d.x}px</span>
            </div>

            <!-- 垂直Y -->
            <div class="decoration-row">
                <span class="decoration-label">垂直 Y</span>
                <input type="range" class="decoration-slider" min="-150" max="150" value="${d.y}"
                       oninput="updateBubbleDeco(${i}, 'y', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                <span class="decoration-value">${d.y}px</span>
            </div>

            <!-- 大小 -->
            <div class="decoration-row">
                <span class="decoration-label">大小</span>
                <input type="range" class="decoration-slider" min="10" max="200" value="${d.size}"
                       oninput="updateBubbleDeco(${i}, 'size', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                <span class="decoration-value">${d.size}px</span>
            </div>

            <!-- 图层位置 -->
            <div class="decoration-row">
                <span class="decoration-label">图层</span>
                <select class="decoration-input" onchange="updateBubbleDeco(${i}, 'pseudo', this.value)">
                    <option value="after" ${d.pseudo === 'after' ? 'selected' : ''}>外层 ::after (顶层)</option>
                    <option value="before" ${d.pseudo === 'before' ? 'selected' : ''}>外层 ::before (底层)</option>
                    <option value="inner-after" ${d.pseudo === 'inner-after' ? 'selected' : ''}>内层 ::after (文字上)</option>
                    <option value="inner-before" ${d.pseudo === 'inner-before' ? 'selected' : ''}>内层 ::before (文字下)</option>
                </select>
            </div>

            <!-- 镜像翻转 -->
            <div class="decoration-row">
                <span class="decoration-label">镜像</span>
                <select class="decoration-input" onchange="updateBubbleDeco(${i}, 'flip', this.value)">
                    <option value="0" ${d.flip === 0 ? 'selected' : ''}>无</option>
                    <option value="1" ${d.flip === 1 ? 'selected' : ''}>水平翻转</option>
                    <option value="2" ${d.flip === 2 ? 'selected' : ''}>垂直翻转</option>
                    <option value="3" ${d.flip === 3 ? 'selected' : ''}>180°旋转</option>
                </select>
            </div>
        </div>
    `).join('');
}

// ================================================================
// ==================== 气泡小尾巴 ====================
// ================================================================
const tailConfig = {
    enabled: false,
    preset: 'triangle',
    imgUrl: '',
    anchor: 'bottom-right',
    pseudo: 'after', 
    autoMirror: true,
    width: 12,
    height: 16,
    offsetX: 0,
    offsetY: 0,
    flip: 0,
    customCss: ''
};

function getTailHtml(isSent) {
    if (!tailConfig.enabled) return '';

    const tc = tailConfig;
    const transforms = ['none', 'scaleX(-1)', 'scaleY(-1)', 'scale(-1)'];

    // ========== 颜色处理（支持渐变）==========
    let fillValue;      
    let gradientDefs = ''; 
    
    
    let defaultColor;
    if (isSent) {
        defaultColor = colorPickerRegistry['bubbleSentBg']?.gradientColors?.[0]?.color 
| colorPickerRegistry['bubbleSentBg']?.color 
| '#007AFF';
    } else {
        defaultColor = colorPickerRegistry['bubbleRecvBg']?.gradientColors?.[0]?.color 
| colorPickerRegistry['bubbleRecvBg']?.color 
| '#F0F0F0';
    }
    fillValue = defaultColor;
    
    
    const bubbleKey = isSent ? 'bubbleSentBg' : 'bubbleRecvBg';
    if (colorPickerRegistry[bubbleKey] && cpIsGradient(bubbleKey)) {
        gradientDefs = buildSvgGradientDefs('tailGrad', colorPickerRegistry[bubbleKey]);
        fillValue = 'url(#tailGrad)';
    }
    
    
    if (colorPickerRegistry['tailColor']) {
        const tailColorCfg = colorPickerRegistry['tailColor'];
        if (tailColorCfg.type === 'gradient') {
            
            gradientDefs = buildSvgGradientDefs('tailGrad', tailColorCfg);
            fillValue = 'url(#tailGrad)';
        } else {
            
            const solidVal = cpGetCssValue('tailColor');
            fillValue = solidVal;
            gradientDefs = ''; 
        }
    }

    // ========== 图片源 ==========
    let imgSrc;
    if (tc.preset === 'custom') {
        imgSrc = tc.imgUrl;
    } else {
        const presetFn = tailPresets[tc.preset];
        imgSrc = presetFn ? presetFn(fillValue, gradientDefs) : tailPresets.triangle(fillValue, gradientDefs);
    }

    if (!imgSrc) return '';

    // ========== 定位（以下逻辑保持不变）==========
    let posStyle = 'position:absolute;';
    const anchor = tc.anchor;
    if (anchor.includes('bottom'))       posStyle += `bottom:${-tc.height + tc.offsetY}px;`;
    else if (anchor.includes('top'))     posStyle += `top:${-tc.height + tc.offsetY}px;`;
    else if (anchor.includes('center'))  posStyle += `top:calc(50% + ${tc.offsetY}px);transform:translateY(-50%);`;

    const shouldMirror = !isSent && tc.autoMirror;
    let horzSide = '';
    if (anchor.includes('left')) horzSide = 'left';
    else if (anchor.includes('right')) horzSide = 'right';

    if (shouldMirror) {
        if (horzSide === 'left') horzSide = 'right';
        else if (horzSide === 'right') horzSide = 'left';
    }

    if (horzSide === 'left') {
        posStyle += `left:${-tc.width + tc.offsetX}px; right: auto;`;
    } else if (horzSide === 'right') {
        posStyle += `right:${-tc.width + tc.offsetX}px; left: auto;`;
    }

    
    let flipTransform = transforms[tc.flip] || 'none';
    if (!isSent && tc.autoMirror) {
        if (flipTransform === 'none') flipTransform = 'scaleX(-1)';
        else if (flipTransform === 'scaleX(-1)') flipTransform = 'none';
    }
    if (flipTransform !== 'none' && !anchor.includes('center')) {
        posStyle += `transform:${flipTransform};`;
    } else if (anchor.includes('center') && flipTransform !== 'none') {
        posStyle += `transform:translateY(-50%) ${flipTransform};`;
    }

    
    let extraCss = '';
    if (tc.customCss) {
        extraCss = tc.customCss.replace(/\n/g, '').replace(/\/\*.*?\*\//g, '');
    }

    const zIndex = tc.pseudo === 'before' ? 0 : 10;

    return `<img src="${imgSrc}" style="
        ${posStyle}
        width:${tc.width}px;
        height:${tc.height}px;
        pointer-events:none;
        z-index:${zIndex};
        ${extraCss}
    " class="bubble-tail-img">`;
}

function updateTailConfig(prop, value) {
    const numProps = ['width', 'height', 'offsetX', 'offsetY', 'flip'];
    if (numProps.includes(prop)) {
        tailConfig[prop] = parseInt(value);
    } else if (value === true || value === false) {
        tailConfig[prop] = value;
    } else {
        tailConfig[prop] = value;
    }

    
    if (prop === 'enabled') {
        document.getElementById('tail-settings').style.display = value ? 'block' : 'none';
    }

    updatePreview();
}

function setTailPreset(preset) {
    tailConfig.preset = preset;
    document.querySelectorAll('#tail-preset-grid .wave-style-option').forEach(el => {
        el.classList.toggle('active', el.dataset.style === preset);
    });
    document.getElementById('tail-custom-section').style.display = preset === 'custom' ? 'block' : 'none';
    updatePreview();
}

function handleTailUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            tailConfig.imgUrl = e.target.result;
            document.getElementById('tail-img-url').value = '(已上传)';
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function insertTailCSSExample() {
    const example = `/* 示例：小尾巴阴影+旋转 */
filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.15));
/* 可以加 transform、opacity 等 */`;
    document.getElementById('tail-custom-css').value = example;
    tailConfig.customCss = example;
    updatePreview();
}

function copyTailCSS() {
    const ta = document.getElementById('tail-custom-css');
    ta.select();
    document.execCommand('copy');
    showCustomAlert('已复制', 'success', '复制成功');
}

// ==================== 内置SVG小尾巴（支持渐变）====================
function buildSvgGradientDefs(gradientId, colorConfig) {
    if (!colorConfig || colorConfig.type !== 'gradient') return '';
    
    const colors = colorConfig.gradientColors || [];
    if (colors.length < 2) return '';
    
    const dir = colorConfig.direction || 'to right';
    
    
    if (dir === 'circle') {
        const stops = colors
            .sort((a, b) => a.position - b.position)
            .map(c => `<stop offset="${c.position}%" stop-color="${c.color}"/>`)
            .join('');
        return `<defs><radialGradient id="${gradientId}" cx="50%" cy="50%" r="50%">${stops}</radialGradient></defs>`;
    }
    
    
    const dirMap = {
        'to right':        { x1: '0%', y1: '50%', x2: '100%', y2: '50%' },
        'to left':         { x1: '100%', y1: '50%', x2: '0%', y2: '50%' },
        'to bottom':       { x1: '50%', y1: '0%', x2: '50%', y2: '100%' },
        'to top':          { x1: '50%', y1: '100%', x2: '50%', y2: '0%' },
        'to bottom right': { x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
        'to bottom left':  { x1: '100%', y1: '0%', x2: '0%', y2: '100%' },
        'to top right':    { x1: '0%', y1: '100%', x2: '100%', y2: '0%' },
        'to top left':     { x1: '100%', y1: '100%', x2: '0%', y2: '0%' },
    };
    const d = dirMap[dir] || dirMap['to right'];
    
    const stops = colors
        .sort((a, b) => a.position - b.position)
        .map(c => `<stop offset="${c.position}%" stop-color="${c.color}"/>`)
        .join('');
    
    return `<defs><linearGradient id="${gradientId}" x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}">${stops}</linearGradient></defs>`;
}


const tailPresets = {
    triangle: (fill, gradientDefs) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 24">${gradientDefs}<polygon points="0,0 20,0 0,24" fill="${fill}"/></svg>`)}`,
    round:    (fill, gradientDefs) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 24">${gradientDefs}<path d="M20,0 Q20,24 0,24 L20,24 Z" fill="${fill}"/></svg>`)}`,
    bubble:   (fill, gradientDefs) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 24">${gradientDefs}<path d="M0,0 C0,0 4,0 10,12 C16,24 20,24 20,24 L20,0 Z" fill="${fill}"/></svg>`)}`,
    sharp:    (fill, gradientDefs) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 24">${gradientDefs}<polygon points="16,0 0,20 16,24" fill="${fill}"/></svg>`)}`,
};

// ==================== 语音配置 ====================
function updateVoiceConfig(prop, value) {
    const numProps = ['waveCount', 'textFontSize', 'textRadius', 'textBorderWidth'];
    
    
    const fullKey = 'voice' + prop.charAt(0).toUpperCase() + prop.slice(1);
    if (numProps.includes(prop)) {
        bubbleConfig[fullKey] = parseInt(value);
    } else {
        bubbleConfig[fullKey] = value;
    }

    
    if (prop === 'waveCount') {
        styleConfig.voice.waveCount = parseInt(value);
    }

    const displayMap = {
        'waveCount': 'voice-wave-count-val',
        'textFontSize': 'voice-text-fontsize-val',
        'textRadius': 'voice-text-radius-val',
        'textBorderWidth': 'voice-text-border-w-val',
    };
    if (displayMap[prop]) {
        const el = document.getElementById(displayMap[prop]);
        if (el) el.textContent = prop === 'waveCount' ? value : value + 'px';
    }

    updatePreview();
}

// ==================== 语音波形来源切换 ====================
function setVoiceWaveSource(source) {
    bubbleConfig.voiceWaveSource = source;
    
    
    const builtinSection = document.getElementById('wave-style-grid');
    const customSection = document.getElementById('voice-custom-icon-section');
    const waveCountRow = document.getElementById('voice-wave-count')?.closest('.editor-row');
    
    if (source === 'custom') {
        if (builtinSection) builtinSection.style.display = 'none';
        if (customSection) customSection.style.display = 'block';
        if (waveCountRow) waveCountRow.style.display = 'none';
    } else {
        if (builtinSection) builtinSection.style.display = 'flex';
        if (customSection) customSection.style.display = 'none';
        if (waveCountRow) waveCountRow.style.display = 'flex';
    }
    updatePreview();
}

function updateVoiceCustomIcon(prop, value) {
    if (prop === 'width' || prop === 'height') {
        bubbleConfig.voiceCustomIcon[prop] = parseInt(value);
    } else {
        bubbleConfig.voiceCustomIcon[prop] = value;
    }
    updatePreview();
}

function handleVoiceIconUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bubbleConfig.voiceCustomIcon.url = e.target.result;
            document.getElementById('voice-custom-icon-url').value = '(已上传)';
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function setVoiceWaveStyle(style) {
    bubbleConfig.voiceWaveStyle = style;
    document.querySelectorAll('#wave-style-grid .wave-style-option').forEach(el => {
        el.classList.toggle('active', el.dataset.style === style);
    });
    updatePreview();
}

// ==================== 图片占位类型 ====================
function setPlaceholderType(type) {
    bubbleConfig.placeholderType = type;
    document.querySelectorAll('.placeholder-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    document.querySelectorAll('.placeholder-config-section').forEach(sec => {
        sec.classList.remove('show');
    });
    const target = document.getElementById(`placeholder-${type}-config`);
    if (target) target.classList.add('show');
    updatePreview();
}

function handlePlaceholderUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bubbleConfig.placeholderUrl = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}


// ================================================================
// ==================== 更新后的 getBubbleStyle ====================
// ================================================================
const _originalGetBubbleStyle = typeof getBubbleStyle === 'function' ? getBubbleStyle : null;

getBubbleStyle = function(isSent) {
    const bc = bubbleConfig;

    
    let fontStyle = '';
    if (bc.fontFamily) {
        fontStyle = `font-family: '${bc.fontFamily}', -apple-system, sans-serif;`;
    }
    if (bc.fontWeight && bc.fontWeight !== 'normal') {
        fontStyle += `font-weight: ${bc.fontWeight};`;
    }

    const borderRadiusCss = `border-radius: ${getFourSidesCss('borderRadius', isSent)};`;
const paddingCss = `padding: ${getFourSidesCss('padding', isSent)};`;
const marginCss = `margin: ${getFourSidesCss('margin', isSent)};`;

    // ========== 气泡背景（核心改动）==========
    let bgCss = '';

    
    let baseBg = '';
    if (!bc.bgImageEnabled) {
        const bgKey = isSent ? 'bubbleSentBg' : 'bubbleRecvBg';
        if (colorPickerRegistry[bgKey]) {
            baseBg = cpGetCssValue(bgKey);
        } else {
            baseBg = isSent ? styleConfig.text.sentBgColor : styleConfig.text.receivedBgColor;
        }
    }

    

if (bc.textBgEnabled && !bc.bgImageEnabled) {
    let textBgLayer = '';
    if (bc.textBgUrl) {
        textBgLayer = `url('${bc.textBgUrl}')`;
    } else if (colorPickerRegistry['textBgColor']) {
        textBgLayer = cpGetCssValue('textBgColor');
    }

    if (textBgLayer) {
        
        const w = bc.textBgWidth > 0 ? bc.textBgWidth + 'px' : '100%';
        const h = bc.textBgHeight > 0 ? bc.textBgHeight + 'px' : '100%';

        
        
        const ox = bc.textBgOffsetX || 0;
        const oy = bc.textBgOffsetY || 0;
        const posX = ox === 0 ? 'center' : `calc(50% + ${ox}px)`;
        const posY = oy === 0 ? 'center' : `calc(50% + ${oy}px)`;

        bgCss = `
            background: ${textBgLayer}, ${baseBg};
            background-size: ${w} ${h}, 100% 100%;
            background-position: ${posX} ${posY}, center;
            background-repeat: no-repeat, no-repeat;
        `;
    } else {
        bgCss = `background: ${baseBg};`;
    }
} else if (bc.bgImageEnabled && bc.bgUrl) {
        bgCss = `
            background-image: url('${bc.bgUrl}') !important;
            background-size: ${bc.bgSize} !important;
            background-position: ${bc.bgPosition} !important;
            background-repeat: no-repeat !important;
        `;
    } else {
        const bgKey = isSent ? 'bubbleSentBg' : 'bubbleRecvBg';
        if (colorPickerRegistry[bgKey]) {
            const val = cpGetCssValue(bgKey);
            bgCss = cpIsGradient(bgKey) ? `background: ${val};` : `background-color: ${val};`;
        } else {
            bgCss = `background-color: ${baseBg};`;
        }
    }

    
    let bgImageCss = '';

    
let borderCss = '';
const bw = bc.borderWidth;
if (bw.unified ? bw.all > 0 : (bw.t > 0 || bw.r > 0 || bw.b > 0 || bw.l > 0)) {
    const borderColorKey = 'bubbleBorderColor';
    const borderColor = colorPickerRegistry[borderColorKey] ? cpGetCssValue(borderColorKey) : '#cccccc';
    const isGradientBorder = colorPickerRegistry[borderColorKey] && cpIsGradient(borderColorKey);
    const widthVal = bw.unified ? bw.all + 'px' : `${bw.t}px ${bw.r}px ${bw.b}px ${bw.l}px`;

    if (isGradientBorder) {
        
        borderCss = `
            border-style: solid;
            border-width: ${widthVal};
            border-color: transparent;
            border-image: ${borderColor} 1;
        `;
    } else {
        
        borderCss = `
            border-style: ${bc.borderStyle};
            border-color: ${borderColor};
            border-width: ${widthVal};
        `;
    }
}

    
    const shadowVal = spGetCssValue('bubbleShadow');
    const shadowCss = shadowVal !== 'none' ? `box-shadow: ${shadowVal};` : '';

    return `${fontStyle} ${borderRadiusCss} ${paddingCss} ${marginCss} ${bgCss} ${bgImageCss} ${borderCss} ${shadowCss}`;
};

    // ==================== 自定义弹窗函数 ====================
function showCustomAlert(message, type = 'info', title = '提示') {
    const overlay = document.getElementById('customAlertOverlay');
    const iconEl = document.getElementById('customAlertIcon');
    const titleEl = document.getElementById('customAlertTitle');
    const messageEl = document.getElementById('customAlertMessage');
    
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    iconEl.textContent = icons[type] || icons.info;
    iconEl.className = 'custom-alert-icon ' + type;
    
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    
    overlay.classList.add('show');
}

function closeCustomAlert(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('customAlertOverlay').classList.remove('show');
}

// ==================== 头像装饰数据 ====================
let decorationItems = [];
let decorationIdCounter = 0;
// ==================== 头像装饰函数 ====================


function openAddDecorationModal() {
    document.getElementById('positionSelectModal').classList.add('show');
}


function closePositionModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('positionSelectModal').classList.remove('show');
}


function confirmAddDecoration(position) {
    const id = ++decorationIdCounter;
    decorationItems.push({
        id: id,
        position: position,
        text: '装饰文字',
        offsetX: 0,
        offsetY: -25,
        fontSize: 12,
        color: '#ff6600',
        fontWeight: 'normal',
        
        bgEnabled: false,
        bgColor: '#ffffff',
        bgOpacity: 80,
        bgPadding: 4,
        bgRadius: 4
    });
    renderDecorationList();
    closePositionModal();
    updatePreview();
    showCustomAlert('已添加文字装饰', 'success', '添加成功');
}


function removeDecoration(id) {
    decorationItems = decorationItems.filter(item => item.id !== id);
    renderDecorationList();
    updatePreview();
}


function updateDecorationProp(id, prop, value) {
    const item = decorationItems.find(item => item.id === id);
    if (item) {
        if (prop === 'offsetX' || prop === 'offsetY' || prop === 'fontSize' || prop === 'bgOpacity' || prop === 'bgPadding' || prop === 'bgRadius') {
            item[prop] = parseInt(value);
        } else if (prop === 'bgEnabled') {
            item[prop] = value;
            
            const bgSettings = document.getElementById(`bg-settings-${id}`);
            if (bgSettings) {
                bgSettings.style.display = value ? 'block' : 'none';
            }
        } else {
            item[prop] = value;
        }
        updatePreview();
    }
}


function renderDecorationList() {
    const container = document.getElementById('decorationList');
    if (!container) return;
    
    if (decorationItems.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 16px 0;">暂无文字装饰</p>';
        return;
    }
    
    container.innerHTML = decorationItems.map((item, index) => `
        <div class="decoration-item" data-id="${item.id}">
            <div class="decoration-item-header">
                <span class="decoration-item-title">文字装饰 #${index + 1}（::${item.position}）</span>
                <div class="decoration-item-actions">
                    <button class="decoration-delete-btn" onclick="removeDecoration(${item.id})" title="删除">×</button>
                </div>
            </div>
            
            <div class="decoration-row">
                <span class="decoration-label">文字</span>
                <input type="text" class="decoration-input" value="${item.text}" 
                       onchange="updateDecorationProp(${item.id}, 'text', this.value)"
                       oninput="updateDecorationProp(${item.id}, 'text', this.value)"
                       placeholder="输入装饰文字">
            </div>
            
            <div class="decoration-row">
                <span class="decoration-label">X偏移</span>
                <input type="range" class="decoration-slider" min="-50" max="50" value="${item.offsetX}"
                       oninput="updateDecorationProp(${item.id}, 'offsetX', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                <span class="decoration-value">${item.offsetX}px</span>
            </div>
            
            <div class="decoration-row">
                <span class="decoration-label">Y偏移</span>
                <input type="range" class="decoration-slider" min="-50" max="50" value="${item.offsetY}"
                       oninput="updateDecorationProp(${item.id}, 'offsetY', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                <span class="decoration-value">${item.offsetY}px</span>
            </div>
            
            <div class="decoration-row">
                <span class="decoration-label">大小</span>
                <input type="range" class="decoration-slider" min="8" max="24" value="${item.fontSize}"
                       oninput="updateDecorationProp(${item.id}, 'fontSize', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                <span class="decoration-value">${item.fontSize}px</span>
            </div>
            
            <div class="decoration-row">
                <span class="decoration-label">颜色</span>
                <input type="color" class="decoration-color-input" value="${item.color}"
                       onchange="updateDecorationProp(${item.id}, 'color', this.value)">
                <select class="decoration-input" style="width: auto;" onchange="updateDecorationProp(${item.id}, 'fontWeight', this.value)">
                    <option value="normal" ${item.fontWeight === 'normal' ? 'selected' : ''}>正常</option>
                    <option value="bold" ${item.fontWeight === 'bold' ? 'selected' : ''}>加粗</option>
                </select>
            </div>
            
            <!-- 背景设置 -->
            <div style="border-top: 1px dashed var(--border-color); margin-top: 10px; padding-top: 10px;">
                <div class="decoration-row">
                    <span class="decoration-label">背景</span>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <input type="checkbox" ${item.bgEnabled ? 'checked' : ''} 
                               onchange="updateDecorationProp(${item.id}, 'bgEnabled', this.checked)">
                        <span style="font-size: 12px;">启用背景</span>
                    </label>
                </div>
                
                <div id="bg-settings-${item.id}" style="display: ${item.bgEnabled ? 'block' : 'none'};">
                    <div class="decoration-row">
                        <span class="decoration-label">背景色</span>
                        <input type="color" class="decoration-color-input" value="${item.bgColor || '#ffffff'}"
                               onchange="updateDecorationProp(${item.id}, 'bgColor', this.value)">
                        <span style="font-size: 11px; color: var(--text-muted);">透明度</span>
                        <input type="range" class="decoration-slider" style="width: 60px;" min="0" max="100" value="${item.bgOpacity || 80}"
                               oninput="updateDecorationProp(${item.id}, 'bgOpacity', this.value)">
                        <span class="decoration-value">${item.bgOpacity || 80}%</span>
                    </div>
                    
                    <div class="decoration-row">
                        <span class="decoration-label">内边距</span>
                        <input type="range" class="decoration-slider" min="0" max="12" value="${item.bgPadding || 4}"
                               oninput="updateDecorationProp(${item.id}, 'bgPadding', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                        <span class="decoration-value">${item.bgPadding || 4}px</span>
                    </div>
                    
                    <div class="decoration-row">
                        <span class="decoration-label">圆角</span>
                        <input type="range" class="decoration-slider" min="0" max="20" value="${item.bgRadius || 4}"
                               oninput="updateDecorationProp(${item.id}, 'bgRadius', this.value); this.nextElementSibling.textContent = this.value + 'px'">
                        <span class="decoration-value">${item.bgRadius || 4}px</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}


function getDecorationHtml(isSent) {
    if (decorationItems.length === 0) return '';
    
    return decorationItems.map(item => {
        
        let bgStyle = '';
        if (item.bgEnabled) {
            const hex = item.bgColor || '#ffffff';
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const opacity = (item.bgOpacity || 80) / 100;
            bgStyle = `
                background: rgba(${r}, ${g}, ${b}, ${opacity});
                padding: ${item.bgPadding || 4}px ${(item.bgPadding || 4) + 4}px;
                border-radius: ${item.bgRadius || 4}px;
            `;
        }
        
        const style = `
            position: absolute;
            ${item.position === 'before' ? 'z-index: 0;' : 'z-index: 2;'}
            left: 50%;
            top: 50%;
            transform: translate(calc(-50% + ${item.offsetX}px), calc(-50% + ${item.offsetY}px));
            font-size: ${item.fontSize}px;
            color: ${item.color};
            font-weight: ${item.fontWeight};
            white-space: nowrap;
            pointer-events: none;
            ${bgStyle}
        `;
        return `<span class="preview-avatar-decoration" style="${style}">${item.text}</span>`;
    }).join('');
}

    
const styleConfig = {
    
    avatar: {
    autoFetch: false,
    url: '',
    frameUrl: '',
    framePosition: 'after', 
    size: 40,
    radius: 50,
    
    displayMode: 'all', 
    position: {
        x: 0,
        y: 0
    },
    shadow: {
            enabled: true,
            type: 'solid',
            color: '#000000',
            opacity: 20,
            x: 0,
            y: 2,
            blur: 4,
            spread: 0,
            direction: 'to right',
            gradientColors: [
                { color: '#000000', position: 0 },
                { color: '#666666', position: 100 }
            ]
        }
    },
    
    text: {
        fontSize: 15,
        sentBgColor: '#007AFF',
        sentTextColor: '#ffffff',
        receivedBgColor: '#F0F0F0',
        receivedTextColor: '#333333',
        bubbleRadius: 18
    },
    
    reply: {
        bgColor: '#F3F3F3',
        senderColor: '#333333',
        timeColor: '#999999',
        messageColor: '#666666'
    },
    
    voice: {
        waveCount: 4,
        showText: true
    },
    
    image: {
        showBubble: true,
        maxWidth: 150,
        maxHeight: 150,
        radius: 10
    },
    
    emoji: {
        showBubble: true,
        maxSize: 100
    },
    
    transfer: {
        width: 200,
        height: 110
    },
    
    
system: {
    fontSize: 12,
    color: '#999999',
    fontWeight: 'normal',
    fontFamily: '',
    bgUrl: '',
    bgSize: 'cover',
    radius: 0,
    padX: 0,
    padY: 0,
    borderWidth: 0,
    useColorBg: true,  
},

chatArea: {
    padding: { t: 20, b: 20, l: 20, r: 20 }, 
    margin: { t: 0, b: 0, l: 0, r: 0 },
    scale: 100       
},
    topBar: {
    container: { height: 60, border: '1px solid #e0e0e0' }, 
    backBtn: { x: 0, y: 0, size: 28, color: '#333333', url: '' }, 
    title: { x: 0, y: 0, size: 18, color: '#333333' }, 
    offlineBtn: { x: 0, y: 0, size: 22, color: '#333333', url: '' }, 
    moreBtn: { x: 0, y: 0, size: 22, color: '#333333', url: '' } 
},
        bottomBar: {
    container: { height: 50, border: '1px solid #E0E0E0' }, 
    
    toolBtn: { x: 0, y: 0, color: '#666666', url: '', width: 28, height: 28, radius: 50, size: 28 }, 
    input: { 
        radius: 8, height: 36, color: '#333', bg: '#ffffff', 
        placeholder: '输入消息...', placeholderColor: '#B0B0B0',
        borderColor: 'transparent', borderWidth: 0 
    },
    
    resumeBtn: { x: 0, y: 0, color: '#555555', url: '', width: 36, height: 36, radius: 50, size: 18 }, 
    
    sendBtn: { x: 0, y: 0, color: '#ffffff', bg: '#5B9BD5', url: '', width: 50, height: 30, radius: 25, text: '发送', size: 14 } 
}
    
};


function getAvatarStyle() {
    const cfg = styleConfig.avatar;
    let shadow = 'none';
    
    if (cfg.shadow.enabled) {
        if (cfg.shadow.type === 'solid') {
            const r = parseInt(cfg.shadow.color.slice(1, 3), 16);
            const g = parseInt(cfg.shadow.color.slice(3, 5), 16);
            const b = parseInt(cfg.shadow.color.slice(5, 7), 16);
            const rgba = `rgba(${r}, ${g}, ${b}, ${cfg.shadow.opacity / 100})`;
            shadow = `${cfg.shadow.x}px ${cfg.shadow.y}px ${cfg.shadow.blur}px ${cfg.shadow.spread}px ${rgba}`;
        } else {
            
            const colors = cfg.shadow.gradientColors;
            const direction = cfg.shadow.direction;
            
            
            let dirX = 0, dirY = 0;
            switch(direction) {
                case 'to right': dirX = 1; dirY = 0; break;
                case 'to left': dirX = -1; dirY = 0; break;
                case 'to bottom': dirX = 0; dirY = 1; break;
                case 'to top': dirX = 0; dirY = -1; break;
                case 'to bottom right': dirX = 1; dirY = 1; break;
                case 'to bottom left': dirX = -1; dirY = 1; break;
                case 'to top right': dirX = 1; dirY = -1; break;
                case 'to top left': dirX = -1; dirY = -1; break;
                case 'circle': dirX = 0; dirY = 0; break; 
            }
            
            const shadows = colors.map((c, i) => {
                const ratio = colors.length > 1 ? (i / (colors.length - 1)) * 2 - 1 : 0; 
                let offsetX, offsetY;
                
                if (direction === 'circle') {
                    
                    const angle = (i / colors.length) * Math.PI * 2;
                    offsetX = cfg.shadow.x + Math.cos(angle) * 3;
                    offsetY = cfg.shadow.y + Math.sin(angle) * 3;
                } else {
                    
                    offsetX = cfg.shadow.x + ratio * dirX * 4;
                    offsetY = cfg.shadow.y + ratio * dirY * 4;
                }
                
                return `${offsetX}px ${offsetY}px ${cfg.shadow.blur}px ${cfg.shadow.spread}px ${c.color}`;
            });
            shadow = shadows.join(', ');
        }
    }
    
    const posX = cfg.position?.x || 0;
const posY = cfg.position?.y || 0;
let positionStyle = '';
if (posX !== 0 || posY !== 0) {
    positionStyle = `position: relative; left: ${posX}px; top: ${posY}px;`;
}

return `width: ${cfg.size}px; height: ${cfg.size}px; border-radius: ${cfg.radius}%; box-shadow: ${shadow}; ${positionStyle}`;
}

function getAvatarHtml(isSent, messageIndex = 0, totalMessages = 1) {
    const mode = styleConfig.avatar.displayMode || 'all';
    let shouldShow = true;
    
    switch(mode) {
        case 'none':
            shouldShow = false;
            break;
        case 'first':
            shouldShow = (messageIndex === 0);
            break;
        case 'last':
            shouldShow = (messageIndex === totalMessages - 1);
            break;
        case 'all':
        default:
            shouldShow = true;
    }
    
    const cfg = styleConfig.avatar;
    
    if (!shouldShow) {
        return `<div class="preview-avatar ${isSent ? 'sent' : 'received'}" style="width: ${cfg.size}px; height: ${cfg.size}px; visibility: hidden;"></div>`;
    }
    
    const decorationHtml = getDecorationHtml(isSent);
    const frameUrl = document.getElementById('avatar-frame-url')?.value || '';
    const framePosition = cfg.framePosition || 'after';
    
    
    let frameHtml = '';
    if (frameUrl) {
        const frameStyle = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${cfg.size + 16}px;
            height: ${cfg.size + 16}px;
            pointer-events: none;
            ${framePosition === 'before' ? 'z-index: -1;' : 'z-index: 3;'}
        `;
        frameHtml = `<img src="${frameUrl}" style="${frameStyle}" class="preview-avatar-frame">`;
    }
    
    
    if (decorationHtml || frameHtml) {
        return `
            <div class="preview-avatar-wrapper ${isSent ? 'sent' : 'received'}">
                ${framePosition === 'before' ? frameHtml : ''}
                <img class="preview-avatar ${isSent ? 'sent' : 'received'}" src="${getAvatarSvg(isSent)}" style="${getAvatarStyle()}">
                ${decorationHtml}
                ${framePosition === 'after' ? frameHtml : ''}
            </div>
        `;
    } else {
        return `<img class="preview-avatar ${isSent ? 'sent' : 'received'}" src="${getAvatarSvg(isSent)}" style="${getAvatarStyle()}">`;
    }
}


function generateMessage(side, contentHtml, options = {}) {
    const isSent = side === 'sent';
    const noBubble = options.noBubble || false;
    const customClass = options.customClass || '';
    const msgType = options.msgType || '';

    return `
        <div class="preview-message-row ${isSent ? 'sent' : ''}" ${msgType ? `data-msg-type="${msgType}"` : ''}>
            ${getAvatarHtml(isSent)}
            <div class="preview-message-container ${isSent ? 'sent' : 'received'} ${noBubble ? 'no-bubble' : ''} ${customClass}">
                ${contentHtml}
                ${getBubbleDecoHtml(isSent)}
            </div>
        </div>
    `;
}
        let currentMainTab = 'preview';
let currentSubTab = 'avatar';
let isFullscreen = false;

// ======================= 核心：多重平行分支缓存引擎 =======================
const branchDB = { overall: null, sent: null, received: null };
let activeBranch = 'overall';

function snapshotCore() {
    return {
        bc: JSON.parse(JSON.stringify(bubbleConfig)),
        sc: JSON.parse(JSON.stringify(styleConfig)),
        cp: JSON.parse(JSON.stringify(colorPickerRegistry)),
        sp: JSON.parse(JSON.stringify(shadowPickerRegistry))
    };
}

function initBranchDB() {
    branchDB.overall = snapshotCore();
    branchDB.sent = snapshotCore();
    branchDB.received = snapshotCore();
}

// 指针级嫁接：直接替换第一层引用，实现实时更新直接进入对应内存库
function applyBranch(branch) {
    if (!branch) return;
    Object.assign(bubbleConfig, branch.bc);
    Object.assign(styleConfig, branch.sc);
    Object.assign(colorPickerRegistry, branch.cp);
    Object.assign(shadowPickerRegistry, branch.sp);
}
setTimeout(initBranchDB, 50); // 确保其它数据都加载完毕后初始化库

// 跨视图强制同步所有颜色选择器UI
function forceSyncColorPickers() {
    for (let key in colorPickerRegistry) {
        const c = colorPickerRegistry[key];
        const typeEl = document.getElementById(`cp-${key}-type`);
        if (typeEl) {
            typeEl.value = c.type;
            const sEl = document.getElementById(`cp-${key}-solid`), gEl = document.getElementById(`cp-${key}-gradient`);
            if(sEl) sEl.style.display = c.type === 'solid' ? '' : 'none';
            if(gEl) gEl.style.display = c.type === 'gradient' ? '' : 'none';
            const cEl = document.getElementById(`cp-${key}-color`), hEl = document.getElementById(`cp-${key}-hex`), oEl = document.getElementById(`cp-${key}-opacity`);
            if (cEl) cEl.value = c.color; if (hEl) hEl.value = c.color; if (oEl) oEl.value = c.opacity;
            if(typeof cpRenderGradientColors === 'function') cpRenderGradientColors(key);
            if(typeof cpUpdateGradientPreview === 'function') cpUpdateGradientPreview(key);
        }
    }
}
// =====================================================================

        const mainTabs = document.querySelectorAll('.main-tab');
        const subTabsContainer = document.getElementById('subTabs');
        const subTabs = document.querySelectorAll('.sub-tab');
        const previewMessages = document.getElementById('previewMessages');
        const previewSection = document.getElementById('previewSection');
        const editorHeader = document.getElementById('editorHeader');
        const mainTabsContainer = document.getElementById('mainTabs');
        const editorSection = document.getElementById('editorSection');

        
        const spongebobEmoji = 'https://media.giphy.com/media/nDSlfqf0gn5g4/giphy.gif';
        
function getAvatarSvg(isSent) {
    if (isSent) {
        
        return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#D8D8D8" stroke="#ccc" stroke-width="2"/><circle cx="50" cy="38" r="16" fill="#999"/><ellipse cx="50" cy="80" rx="28" ry="22" fill="#999"/></svg>');
    } else {
        
        return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#e0e0e0" stroke-width="2"/><circle cx="50" cy="38" r="16" fill="#aaa"/><ellipse cx="50" cy="80" rx="28" ry="22" fill="#aaa"/></svg>');
    }
}

        function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
        previewSection.classList.add('fullscreen');
        editorHeader.classList.add('hidden');
        mainTabsContainer.classList.add('hidden');
        subTabsContainer.classList.add('hidden');
        editorSection.classList.add('hidden');
    } else {
        previewSection.classList.remove('fullscreen');
        editorHeader.classList.remove('hidden');
        mainTabsContainer.classList.remove('hidden');
        editorSection.classList.remove('hidden');
        if (currentMainTab !== 'preview') subTabsContainer.classList.remove('hidden');
    }
}

function openHelpModal() { document.getElementById('helpModal').classList.add('show'); }
function closeHelpModal() { document.getElementById('helpModal').classList.remove('show'); }

// 记录“不再提示”并关闭弹窗
function dismissHelpModalForever() {
    try { localStorage.setItem('eve_help_dismissed', 'true'); } catch(e) {}
    closeHelpModal();
}

document.getElementById('helpModal').addEventListener('click', function(e) {
    if (e.target === this) closeHelpModal();
});

// 页面自启动时进行判定是否自动弹出
window.addEventListener('DOMContentLoaded', function() {
    try {
        if (localStorage.getItem('eve_help_dismissed') !== 'true') {
            openHelpModal();
        }
    } catch(e) { // 防止浏览器的隐私模式禁用了localStorage导致报错中断
        openHelpModal();
    }
});

        function openImagePreview(src) {
            document.getElementById('previewImage').src = src;
            document.getElementById('imagePreviewModal').classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeImagePreview() {
            document.getElementById('imagePreviewModal').classList.remove('show');
            document.body.style.overflow = '';
        }

        function toggleVoiceText(element) {
            const container = element.closest('.preview-voice-message-container');
            container.querySelector('.preview-voice-text-content').classList.toggle('visible');
        }

        function togglePhotoDescription(element) {
            element.querySelector('.preview-photo-text-overlay').classList.toggle('visible');
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (document.getElementById('helpModal').classList.contains('show')) closeHelpModal();
                else if (document.getElementById('imagePreviewModal').classList.contains('show')) closeImagePreview();
                else if (isFullscreen) toggleFullscreen();
            }
        });

        

        mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        mainTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentMainTab = tab.dataset.tab;
        
        subTabsContainer.classList.add('hidden');
        document.getElementById('exportSubTabs').classList.add('hidden');
        
        // 动态隐藏特定的子 Tab
        const hideTabs = ['toolbar', 'chatarea', 'topbar', 'bottombar', 'system'];
        document.querySelectorAll('#subTabs .sub-tab').forEach(sub => {
            const subName = sub.dataset.subtab;
            sub.style.display = ((currentMainTab === 'sent' || currentMainTab === 'received') && hideTabs.includes(subName)) ? 'none' : 'flex';
        });

        // 避免留在隐藏的Tab里
        if ((currentMainTab === 'sent' || currentMainTab === 'received') && hideTabs.includes(currentSubTab)) {
            document.querySelectorAll('#subTabs .sub-tab').forEach(t => t.classList.remove('active'));
            const avatarTab = document.querySelector('#subTabs .sub-tab[data-subtab="avatar"]');
            if(avatarTab) avatarTab.classList.add('active');
            currentSubTab = 'avatar';
        }

        if (currentMainTab === 'export') {
            document.getElementById('exportSubTabs').classList.remove('hidden');
            currentSubTab = 'export';
        } else if (currentMainTab !== 'preview') {
            subTabsContainer.classList.remove('hidden');
        }

        // ====== 分支切换机制 (动态记忆换绑) ======
        let targetBranch = 'overall';
        if (currentMainTab === 'sent') targetBranch = 'sent';
        if (currentMainTab === 'received') targetBranch = 'received';
        
        if (activeBranch !== targetBranch && branchDB[targetBranch]) {
            applyBranch(branchDB[targetBranch]);
            activeBranch = targetBranch;
            syncAllUIControls(); // 将分支数据回写到各大滑块
            forceSyncColorPickers(); // 强刷颜色选择器DOM
        }
        
        updateContent();
        updatePreview();
    });
});


document.querySelectorAll('#exportSubTabs .sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('#exportSubTabs .sub-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentSubTab = tab.dataset.subtab;
        
        
        if (currentSubTab === 'encrypt') {
            const exportCode = document.getElementById('exportCodeArea').value;
            document.getElementById('encryptCodeArea').value = exportCode;
        }
        
        updateContent();
    });
});

        subTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                subTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentSubTab = tab.dataset.subtab;
                updateContent();
                updatePreview();
            });
        });

// ==================== 转账卡片逻辑 ====================

function updateTransferConfig(prop, value) {
    const numProps = ['transferWidth', 'transferHeight', 'transferRadius', 'transferBorderWidth',
    'transferTitleX','transferTitleY','transferAmountX','transferAmountY',
    'transferNoteX','transferNoteY','transferStatusX','transferStatusY'];
    
    if (numProps.includes(prop)) {
        bubbleConfig[prop] = parseInt(value);
    } else if (value === true || value === false) {
        bubbleConfig[prop] = value;
    } else {
        bubbleConfig[prop] = value;
    }

    
    const visMap = {
        'transferTitleVisible': 'trans-title-detail',
        'transferAmountVisible': 'trans-amount-detail',
        'transferNoteVisible': 'trans-note-detail',
        'transferStatusVisible': 'trans-status-detail',
    };
    if (visMap[prop]) {
        const el = document.getElementById(visMap[prop]);
        if (el) el.style.display = value ? 'block' : 'none';
    }

    updatePreview();
}

function toggleTransferBgImage(enabled) {
    bubbleConfig.transferBgImageEnabled = enabled;
    document.getElementById('trans-bg-url-section').style.display = enabled ? 'block' : 'none';
    document.getElementById('trans-bg-color-section').style.display = enabled ? 'none' : 'block';
    updatePreview();
}

function updateTransferBgUrl(value) {
    bubbleConfig.transferBgUrl = value;
    updatePreview();
}

function handleTransferBgUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bubbleConfig.transferBgUrl = e.target.result;
            document.getElementById('trans-bg-url').value = '(已上传)';
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- 转账装饰逻辑 ---

function addTransferDeco() {
    saveUndoState();
    if (!bubbleConfig.transferDecorations) bubbleConfig.transferDecorations = [];
    
    bubbleConfig.transferDecorations.push({
        img: '', 
        x: 0,
        y: 0,
        size: 40,
        flip: 0,
        anchor: 'top-right', 
        pseudo: 'after'
    });
    renderTransferDecoList();
    updatePreview();
}

function removeTransferDeco(i) {
    saveUndoState();
    bubbleConfig.transferDecorations.splice(i, 1);
    renderTransferDecoList();
    updatePreview();
}

function updateTransferDeco(i, key, value) {
    if (['x', 'y', 'size', 'flip'].includes(key)) value = parseInt(value);
    bubbleConfig.transferDecorations[i][key] = value;
    updatePreview();
}

function handleTransferDecoUpload(input, index) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bubbleConfig.transferDecorations[index].img = e.target.result;
            renderTransferDecoList();
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}


function renderTransferDecoList() {
    const container = document.getElementById('transferDecoList');
    if (!container) return;
    
    const decos = bubbleConfig.transferDecorations || [];
    if (decos.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:12px;padding:10px;">暂无装饰</p>';
        return;
    }
    
    container.innerHTML = decos.map((d, i) => `
        <div class="decoration-item">
            <div class="decoration-item-header">
                <span class="decoration-item-title">装饰 #${i + 1}</span>
                <button class="decoration-delete-btn" onclick="removeTransferDeco(${i})">×</button>
            </div>
            <div class="decoration-row">
                <span class="decoration-label">图片URL</span>
                <input type="text" class="decoration-input" value="${d.img}" placeholder="图片链接"
                       onchange="updateTransferDeco(${i}, 'img', this.value)">
            </div>
            <div class="decoration-row">
                <span class="decoration-label">上传</span>
                <input type="file" class="decoration-input" accept="image/*"
                       onchange="handleTransferDecoUpload(this, ${i})">
            </div>
            
            
            <div class="decoration-row">
                <span class="decoration-label">图层</span>
                <select class="decoration-input" onchange="updateTransferDeco(${i}, 'pseudo', this.value)">
                    <option value="after" ${d.pseudo==='after'?'selected':''}>顶层 (::after)</option>
                    <option value="before" ${d.pseudo==='before'?'selected':''}>底层 (::before)</option>
                </select>
            </div>

            <div class="decoration-row">
                <span class="decoration-label">锚点</span>
                <select class="decoration-input" onchange="updateTransferDeco(${i}, 'anchor', this.value)">
                    <option value="top-left" ${d.anchor==='top-left'?'selected':''}>↖ 左上</option>
                    <option value="top-right" ${d.anchor==='top-right'?'selected':''}>↗ 右上</option>
                    <option value="bottom-left" ${d.anchor==='bottom-left'?'selected':''}>↙ 左下</option>
                    <option value="bottom-right" ${d.anchor==='bottom-right'?'selected':''}>↘ 右下</option>
                    <option value="center" ${d.anchor==='center'?'selected':''}>● 中心</option>
                </select>
            </div>

            
            <div class="decoration-row">
                <span class="decoration-label">X偏移</span>
                <input type="range" class="decoration-slider" min="-100" max="100" value="${d.x}"
                       oninput="updateTransferDeco(${i}, 'x', this.value); this.nextElementSibling.value=this.value">
                <input type="number" class="editor-input" value="${d.x}" style="width:50px;"
                       oninput="updateTransferDeco(${i}, 'x', this.value); this.previousElementSibling.value=this.value"> px
            </div>

            
            <div class="decoration-row">
                <span class="decoration-label">Y偏移</span>
                <input type="range" class="decoration-slider" min="-100" max="100" value="${d.y}"
                       oninput="updateTransferDeco(${i}, 'y', this.value); this.nextElementSibling.value=this.value">
                <input type="number" class="editor-input" value="${d.y}" style="width:50px;"
                       oninput="updateTransferDeco(${i}, 'y', this.value); this.previousElementSibling.value=this.value"> px
            </div>

            <div class="decoration-row">
                <span class="decoration-label">大小</span>
                <input type="range" class="decoration-slider" min="10" max="200" value="${d.size}"
                       oninput="updateTransferDeco(${i}, 'size', this.value); this.nextElementSibling.value=this.value">
                <input type="number" class="editor-input" value="${d.size}" style="width:50px;"
                       oninput="updateTransferDeco(${i}, 'size', this.value); this.previousElementSibling.value=this.value"> px
            </div>
        </div>
    `).join('');
}


function getTransferDecoHtml() {
    const decos = bubbleConfig.transferDecorations || [];
    if (decos.length === 0) return '';
    
    const transforms = ['', 'scaleX(-1)', 'scaleY(-1)', 'scale(-1)'];
    
    return decos.map(d => {
        if (!d.img) return '';
        
        const zIndex = d.pseudo === 'before' ? 0 : 20; 
        
        let pos = 'position: absolute; ';
        
        
        if (d.anchor.includes('top')) pos += `top:${d.y}px; `;
        else if (d.anchor.includes('bottom')) pos += `bottom:${-d.y}px; `;
        else pos += `top:calc(50% + ${d.y}px); `;
        
        
        if (d.anchor.includes('left')) pos += `left:${d.x}px; `;
        else if (d.anchor.includes('right')) pos += `right:${-d.x}px; `;
        else pos += `left:calc(50% + ${d.x}px); `;
        
        
        let transformStr = transforms[d.flip] || '';
        
        
        let translateParts = [];
        if (d.anchor === 'center') {
            translateParts.push('-50%', '-50%');
        }
        
        let finalTransform = '';
        if (translateParts.length > 0 || transformStr) {
            let t = translateParts.length > 0 ? `translate(${translateParts[0] || '0'}, ${translateParts[1] || '0'})` : '';
            finalTransform = `transform: ${t} ${transformStr};`.trim();
        }
        
        return `<img src="${d.img}" style="
            ${pos}
            width: ${d.size}px;
            height: ${d.size}px;
            ${finalTransform}
            pointer-events: none;
            z-index: ${zIndex}; 
            object-fit: contain;
        ">`;
    }).join('');
}

function updateContent() {
    document.querySelectorAll('.editor-content').forEach(c => c.classList.add('hidden'));
    
    let contentId = `content-overall-${currentSubTab}`;
    if (currentMainTab === 'preview') contentId = 'content-preview';
    if (currentMainTab === 'export') contentId = `content-export-${currentSubTab}`;
    
    const target = document.getElementById(contentId);
    if (target) target.classList.remove('hidden');

    // 专属颜色控制块隐藏处理
    const sentFont = document.getElementById('font-color-sent-picker');
    const recvFont = document.getElementById('font-color-picker');
    const sentBubble = document.getElementById('bubble-sent-color-picker');
    const recvBubble = document.getElementById('bubble-received-color-picker');
    if (sentFont) sentFont.style.display = (currentMainTab === 'received') ? 'none' : 'block';
    if (sentBubble) sentBubble.style.display = (currentMainTab === 'received') ? 'none' : 'block';
    if (recvFont) recvFont.style.display = (currentMainTab === 'sent') ? 'none' : 'block';
    if (recvBubble) recvBubble.style.display = (currentMainTab === 'sent') ? 'none' : 'block';

    // 智能放开所有的行操控权 (仅屏蔽UI标注了另一方独占的内容)
    if(target) {
        target.querySelectorAll('.editor-row, .editor-switch-row, .collapse-section').forEach(row => {
            const text = row.textContent || '';
            if(currentMainTab === 'received') {
                row.style.display = text.includes('(我方)') ? 'none' : '';
            } else if(currentMainTab === 'sent') {
                row.style.display = text.includes('(对方)') ? 'none' : '';
            } else {
                row.style.display = ''; // 整体布局全部解开
            }
        });
    }
}

       let _previewTimer = null;
let _undoFromPreviewTimer = null;

const _origUpdatePreview = updatePreview;
updatePreview = function() {
    if (_initPhase || !branchDB.overall) return _origUpdatePreview();
    
    // 拍下当前的瞬间快照
    const snap = snapshotCore();
    
    // [终极修复] 核心检测：判断用户是否真的在操作 UI
    // 将界面当前数据和当前所在分支的旧记忆进行比对。如果不一样，说明发生了真实的滑块拖拽/点击行为
    const isActuallyModified = JSON.stringify(snap) !== JSON.stringify(branchDB[activeBranch]);

    // 无论如何，保存当前所处分支的最新状态
    branchDB[activeBranch] = JSON.parse(JSON.stringify(snap));
    
    // === 防擦除修正 ===
    // 只有被认定为“在整体界面下真实操作了面板（发生更改）”时，才将整体的数据向下覆盖。
    // 如果只是切换顶部 Tab 触发的界面刷新，isActuallyModified 会是 false，从而拦截“误杀”底下两方的独立数据。
    if (activeBranch === 'overall' && isActuallyModified) {
        branchDB.sent = JSON.parse(JSON.stringify(snap));
        branchDB.received = JSON.parse(JSON.stringify(snap));
    }
    
    _origUpdatePreview();
};

const _origGenerateMessageByType = generateMessageByType;
generateMessageByType = function(msg, roundInfo) {
    if (!branchDB.overall) return _origGenerateMessageByType(msg, roundInfo);
    
    // 记住此时处在什么布局的界面UI
    const originalBranch = activeBranch;
    // 核心切换：如果是准备渲染对方消息，直接切换指针提取对面记忆的样式
    const targetBranch = (msg.side === 'sent' || msg.side === 'received') ? msg.side : 'overall';
    
    // 挂载独立内存！让接下来的所有DOM拿到的都是这属于该边的数据参数！
    applyBranch(branchDB[targetBranch]);
    
    // 拦截进行真正的渲染
    const html = _origGenerateMessageByType(msg, roundInfo);
    
    // 渲染完成后切回之前的环境防止UI出现滑块数值错乱
    applyBranch(branchDB[originalBranch]);
    
    return html;
};




        function generateAllMessages() {
    const messageSequence = [
        { side: 'sent', type: 'text' },
        { side: 'received', type: 'text' },
        { side: 'received', type: 'text2' },
        { side: 'received', type: 'text3' },
        { side: 'received', type: 'text4' },
        { side: 'sent', type: 'text5' },
        { side: 'sent', type: 'text6' },
        { side: 'sent', type: 'text7' },
        { side: 'sent', type: 'image', hasBubble: true },
        { side: 'received', type: 'image', hasBubble: true },
        { side: 'received', type: 'dreamy' },
        { side: 'sent', type: 'dreamy' },
        { side: 'sent', type: 'emoji', hasBubble: true },
        { side: 'received', type: 'emoji', hasBubble: true },
        { side: 'sent', type: 'reply' },
        { side: 'received', type: 'reply' },
        { side: 'sent', type: 'voice' },
        { side: 'received', type: 'voice' },
        { side: 'sent', type: 'transfer' },
        { side: 'system', type: 'system' },
        { side: 'received', type: 'transfer' },
        { side: 'system', type: 'recalled' },
    ];
    
    
    const rounds = calculateRounds(messageSequence);
    
    let html = '';
    for (let i = 0; i < messageSequence.length; i++) {
        const msg = messageSequence[i];
        const roundInfo = rounds[i];
        
        if (msg.type === 'system') {
            html += generateSystemPreview();
        } else if (msg.type === 'recalled') {
            html += generateRecalledPreview();
        } else {
            html += generateMessageByType(msg, roundInfo);
        }
    }
    return html;
}

function generateAllMessagesForSide(side) {
    const fullSequence = [
    { side: 'sent', type: 'text' },
    { side: 'received', type: 'text' },
    { side: 'received', type: 'text2' },
    { side: 'received', type: 'text3' },
    { side: 'received', type: 'text4' },
    { side: 'sent', type: 'text5' },
    { side: 'sent', type: 'text6' },
    { side: 'sent', type: 'text7' },
    { side: 'sent', type: 'image', hasBubble: true },
    { side: 'received', type: 'image', hasBubble: true },
    { side: 'received', type: 'dreamy' },
    { side: 'sent', type: 'dreamy' },
    { side: 'sent', type: 'emoji', hasBubble: true },
    { side: 'received', type: 'emoji', hasBubble: true },
    { side: 'sent', type: 'reply' },
    { side: 'received', type: 'reply' },
    { side: 'sent', type: 'voice' },
    { side: 'received', type: 'voice' },
    { side: 'sent', type: 'transfer' },
    { side: 'received', type: 'transfer' },
];
    
    
    
    const filtered = fullSequence.filter(msg => msg.side === side);
    
    
    const rounds = [];
    let i = 0;
    while (i < filtered.length) {
        let roundStart = i;
        let roundLength = 1;
        
        
        i++;
    }
    
    
    const sideRounds = calculateSideRounds(fullSequence, side);
    
    let html = '';
    for (let j = 0; j < filtered.length; j++) {
        const msg = filtered[j];
        const roundInfo = sideRounds[j];
        html += generateMessageByType(msg, roundInfo);
    }
    return html;
}


function calculateSideRounds(fullSequence, targetSide) {
    const rounds = [];
    let currentRoundMsgs = [];
    
    for (let i = 0; i < fullSequence.length; i++) {
        const msg = fullSequence[i];
        if (msg.side === 'system') continue;
        
        if (msg.side === targetSide) {
            currentRoundMsgs.push(i);
        } else {
            
            if (currentRoundMsgs.length > 0) {
                const total = currentRoundMsgs.length;
                currentRoundMsgs.forEach((idx, j) => {
                    rounds.push({ index: j, total: total });
                });
                currentRoundMsgs = [];
            }
        }
    }
    
    if (currentRoundMsgs.length > 0) {
        const total = currentRoundMsgs.length;
        currentRoundMsgs.forEach((idx, j) => {
            rounds.push({ index: j, total: total });
        });
    }
    
    return rounds;
}

function calculateRounds(sequence) {
    const rounds = [];
    let i = 0;
    
    while (i < sequence.length) {
        const currentSide = sequence[i].side;
        
        
        if (currentSide === 'system') {
            rounds.push({ index: 0, total: 1 });
            i++;
            continue;
        }
        
        
        let roundStart = i;
        let roundLength = 0;
        while (i < sequence.length && sequence[i].side === currentSide) {
            roundLength++;
            i++;
        }
        
        
        for (let j = 0; j < roundLength; j++) {
            rounds[roundStart + j] = {
                index: j,
                total: roundLength
            };
        }
    }
    
    return rounds;
}



function generateCustomTextWithIndex(side, text, index, total) {
    var isSent = side === 'sent';
    var textStyle = getTextStyle(isSent);

    var prefixInside = bubbleConfig.bubblePrefix.enabled && bubbleConfig.bubblePrefix.position === 'inside' ? getPrefixSuffixHtml('prefix', isSent) : '';
    var suffixInside = bubbleConfig.bubbleSuffix.enabled && bubbleConfig.bubbleSuffix.position === 'inside' ? getPrefixSuffixHtml('suffix', isSent) : '';
    var prefixOutside = bubbleConfig.bubblePrefix.enabled && bubbleConfig.bubblePrefix.position === 'outside' ? getPrefixSuffixHtml('prefix', isSent) : '';
    var suffixOutside = bubbleConfig.bubbleSuffix.enabled && bubbleConfig.bubbleSuffix.position === 'outside' ? getPrefixSuffixHtml('suffix', isSent) : '';

    var textBgLayer = getTextBgLayerHtml();
    var needWrapper = textBgLayer !== '';

    var textHtml;
    if (needWrapper) {
        textHtml = '<span style="position:relative; display:inline-block;">'
            + textBgLayer
            + '<span class="preview-message-text" style="position:relative; z-index:1;' + textStyle + '">'
            + prefixInside + text + suffixInside
            + '</span></span>';
    } else {
        textHtml = prefixInside
            + '<span class="preview-message-text" style="' + textStyle + '">' + text + '</span>'
            + suffixInside;
    }

    var content = prefixOutside
        + '<div class="preview-bubble" style="' + getBubbleStyle(isSent) + '">'
        + textHtml
        + '</div>'
        + suffixOutside;

    return generateMessageWithIndex(side, content, index, total);
}


function generateMessageWithIndex(side, contentHtml, messageIndex, totalMessages, options = {}) {
    const isSent = side === 'sent';
    const noBubble = options.noBubble || false;
    const customClass = options.customClass || '';
    const msgType = options.msgType || '';

    return `
        <div class="preview-message-row ${isSent ? 'sent' : ''}" ${msgType ? `data-msg-type="${msgType}"` : ''}>
            ${getAvatarHtml(isSent, messageIndex, totalMessages)}
            <div class="preview-message-container ${isSent ? 'sent' : 'received'} ${noBubble ? 'no-bubble' : ''} ${customClass}">
                ${contentHtml}
                ${getBubbleDecoHtml(isSent)}
            </div>
        </div>
    `;
}

// === 带索引的消息生成函数 ===

function generateTextPreviewWithIndex(side, index, total) {
    var isSent = side === 'sent';
    var textStyle = getTextStyle(isSent);
    var msgText = isSent ? '你好' : '你好呀';

    var prefixInside = bubbleConfig.bubblePrefix.enabled && bubbleConfig.bubblePrefix.position === 'inside' ? getPrefixSuffixHtml('prefix', isSent) : '';
    var suffixInside = bubbleConfig.bubbleSuffix.enabled && bubbleConfig.bubbleSuffix.position === 'inside' ? getPrefixSuffixHtml('suffix', isSent) : '';
    var prefixOutside = bubbleConfig.bubblePrefix.enabled && bubbleConfig.bubblePrefix.position === 'outside' ? getPrefixSuffixHtml('prefix', isSent) : '';
    var suffixOutside = bubbleConfig.bubbleSuffix.enabled && bubbleConfig.bubbleSuffix.position === 'outside' ? getPrefixSuffixHtml('suffix', isSent) : '';

    
    var textHtml = prefixInside
        + '<span class="preview-message-text" style="' + textStyle + '">' + msgText + '</span>'
        + suffixInside;

    var content = prefixOutside
        + '<div class="preview-bubble" style="' + getBubbleStyle(isSent) + '">'
        + textHtml
        + '</div>'
        + suffixOutside;

    return generateMessageWithIndex(side, content, index, total);
}

function generateCustomTextWithIndex(side, text, index, total) {
    var isSent = side === 'sent';
    var textStyle = getTextStyle(isSent);

    var prefixInside = bubbleConfig.bubblePrefix.enabled && bubbleConfig.bubblePrefix.position === 'inside' ? getPrefixSuffixHtml('prefix', isSent) : '';
    var suffixInside = bubbleConfig.bubbleSuffix.enabled && bubbleConfig.bubbleSuffix.position === 'inside' ? getPrefixSuffixHtml('suffix', isSent) : '';
    var prefixOutside = bubbleConfig.bubblePrefix.enabled && bubbleConfig.bubblePrefix.position === 'outside' ? getPrefixSuffixHtml('prefix', isSent) : '';
    var suffixOutside = bubbleConfig.bubbleSuffix.enabled && bubbleConfig.bubbleSuffix.position === 'outside' ? getPrefixSuffixHtml('suffix', isSent) : '';

    
    var textHtml = prefixInside
        + '<span class="preview-message-text" style="' + textStyle + '">' + text + '</span>'
        + suffixInside;

    var content = prefixOutside
        + '<div class="preview-bubble" style="' + getBubbleStyle(isSent) + '">'
        + textHtml
        + '</div>'
        + suffixOutside;

    return generateMessageWithIndex(side, content, index, total);
}

function generateImagePreviewWithIndex(side, hasBubble, index, total) {
    const fixedImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop';
    const cfg = styleConfig.image;
    const bc = bubbleConfig;
    const showBubble = bc.imageShowBubble;
    const isSent = side === 'sent';
    
    
    let imageSrc = defaultImage;
    if (bc.placeholderType === 'url' && bc.placeholderUrl) {
        imageSrc = bc.placeholderUrl;
    } else if (bc.placeholderType === 'upload' && bc.placeholderUrl) {
        imageSrc = bc.placeholderUrl;
    }
    
    
    const content = showBubble 
        ? `<div class="preview-bubble image-bubble" style="${getBubbleStyle(isSent)}"><img class="preview-message-image" src="${imageSrc}" style="max-width:${bc.imageMaxWidth}px;max-height:${bc.imageMaxHeight}px;border-radius:${bc.imageRadius}px;" onclick="openImagePreview(this.src)"></div>`
        : `<img class="preview-message-image" src="${imageSrc}" style="max-width:${bc.imageMaxWidth}px;max-height:${bc.imageMaxHeight}px;border-radius:${bc.imageRadius}px;" onclick="openImagePreview(this.src)">`;
    
    return generateMessageWithIndex(side, content, index, total, { noBubble: !showBubble, msgType: 'image' });
}

function generateEmojiPreviewWithIndex(side, hasBubble, index, total) {
    const cfg = styleConfig.emoji;
    const showBubble = bubbleConfig.emojiShowBubble;
    const isSent = side === 'sent';
const content = showBubble
    ? `<div class="preview-bubble emoji-bubble" style="${getBubbleStyle(isSent)}"><img class="preview-message-emoji" src="${spongebobEmoji}" style="max-width:${cfg.maxSize}px;max-height:${cfg.maxSize}px;border-radius:${bubbleConfig.emojiRadius || 8}px;" onclick="openImagePreview(this.src)"></div>`
    : `<img class="preview-message-emoji" src="${spongebobEmoji}" style="max-width:${cfg.maxSize}px;max-height:${cfg.maxSize}px;border-radius:${bubbleConfig.emojiRadius || 8}px;" onclick="openImagePreview(this.src)">`;
    
    return generateMessageWithIndex(side, content, index, total, { noBubble: !showBubble, msgType: 'emoji' });
}

function generateReplyPreviewWithIndex(side, index, total) {
    const isSent = side === 'sent';
    const textStyle = getTextStyle(isSent);
    const bubbleStyle = getBubbleStyle(isSent);
    const bc = bubbleConfig;
    const isWechat = bc.replyPreset === 'wechat';
    const position = bc.replyPosition || 'inside-top';

    const replyHtml = getReplyReferenceHtml(isSent);
    let finalContent = '';
    let isSeparated = false;

    if (isWechat || position === 'outside-bottom') {
        
        const absoluteReply = getAbsoluteReplyHtml(isSent, 'below');
        finalContent = `
            <div class="preview-bubble" style="${bubbleStyle} position:relative; overflow:visible;">
                <span class="preview-message-text" style="${textStyle}">${isSent ? '你好' : '你好呀'}</span>
                ${absoluteReply}
            </div>
        `;
        return `
            <div class="preview-message-row ${isSent ? 'sent' : ''}" style="margin-bottom: 42px;">
                ${getAvatarHtml(isSent, index, total)}
                <div class="preview-message-container ${isSent ? 'sent' : 'received'}" style="position: relative; overflow: visible;">
                    ${finalContent}
                    ${getBubbleDecoHtml(isSent)}
                </div>
            </div>
        `;

    } else if (position === 'outside-above') {
        
        const absoluteReply = getAbsoluteReplyHtml(isSent, 'above');
        finalContent = `
            <div class="preview-bubble" style="${bubbleStyle} position:relative; overflow:visible;">
                <span class="preview-message-text" style="${textStyle}">${isSent ? '你好' : '你好呀'}</span>
                ${absoluteReply}
            </div>
        `;
        return `
            <div class="preview-message-row ${isSent ? 'sent' : ''}" style="margin-top: 42px;">
                ${getAvatarHtml(isSent, index, total)}
                <div class="preview-message-container ${isSent ? 'sent' : 'received'}" style="position: relative; overflow: visible;">
                    ${finalContent}
                    ${getBubbleDecoHtml(isSent)}
                </div>
            </div>
        `;

    } else if (position.includes('inside')) {
        let innerContent = '';
        if (position === 'inside-bottom') {
            innerContent = `
                <span class="preview-message-text" style="${textStyle} display:block; margin-bottom:4px;">${isSent ? '你好' : '你好呀'}</span>
                ${replyHtml}
            `;
        } else {
            innerContent = `
                ${replyHtml}
                <span class="preview-message-text" style="${textStyle} display:block; margin-top:4px;">${isSent ? '你好' : '你好呀'}</span>
            `;
        }
        finalContent = `
            <div class="preview-bubble" style="${bubbleStyle} display:flex; flex-direction:column;">
                ${innerContent}
            </div>
        `;
    } else {
        isSeparated = true;
        const bubblePart = `
            <div style="${bubbleStyle}; display:inline-block; max-width:100%; position:relative; word-break:break-word; box-sizing:border-box;">
                <span class="preview-message-text" style="${textStyle}">${isSent ? '你好' : '你好呀'}</span>
            </div>
        `;
        const replyPart = `<div style="max-width:100%; margin:${position==='below'?'4px 0 0 0':'0 0 4px 0'}; clear:both;">${replyHtml}</div>`;

        if (position === 'below') {
            finalContent = `<div style="display:flex; flex-direction:column; align-items:${isSent ? 'flex-end' : 'flex-start'};">${bubblePart}${replyPart}</div>`;
        } else {
            finalContent = `<div style="display:flex; flex-direction:column; align-items:${isSent ? 'flex-end' : 'flex-start'};">${replyPart}${bubblePart}</div>`;
        }
    }

    return generateMessageWithIndex(side, finalContent, index, total, {
        noBubble: isSeparated
    });
}



function getReplyReferenceHtml(isSent) {
    const bc = bubbleConfig;
    const isTG = bc.replyPreset === 'telegram';
    const isCustom = bc.replyPreset === 'custom';

    // ================= 1. 跳转按钮逻辑 =================
    let jumpBtnHtml = '';

    if (isTG) {
        
        jumpBtnHtml = `<button style="
            position: absolute;
            left: 0; top: 0; right: 0; bottom: 0;
            width: 100%; height: 100%;
            border: none;
            background: transparent;
            border-radius: 0;
            cursor: pointer;
            display: block;
            z-index: 1;
            opacity: 0;
            font-size: 0;
            line-height: 0;
            overflow: hidden;
            padding: 0; margin: 0;
        "></button>`;
    } else if (bc.replyJumpBtnType !== 'none') {
    
    if (bc.replyJumpBtnExternal) {
        
        jumpBtnHtml = `<button style="
            position: absolute;
            left: 0; top: 0; right: 0; bottom: 0;
            width: 100%; height: 100%;
            border: none;
            background: transparent;
            cursor: pointer;
            z-index: 1;
            opacity: 0;
            font-size: 0;
            line-height: 0;
            overflow: hidden;
            padding: 0; margin: 0;
        "></button>`;
        
    } else {
        
        const jumpColor = colorPickerRegistry['replyJumpColor'] ? cpGetCssValue('replyJumpColor') : bc.replyJumpBtnColor;
        const jumpBg = colorPickerRegistry['replyJumpBg'] ? cpGetCssValue('replyJumpBg') : bc.replyJumpBtnBg;

        
        const isFgGradient = colorPickerRegistry['replyJumpColor'] && cpIsGradient('replyJumpColor');

        const fgStyle = isFgGradient
            ? `background-image: ${jumpColor}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; display: inline-block;`
            : `color: ${jumpColor};`;

        let btnContent = '';
        if (bc.replyJumpBtnType === 'icon') {
            const iconClass = bc.replyJumpBtnIcon || 'mdi:arrow-collapse-up';
            btnContent = `<span class="iconify" data-icon="${iconClass}" style="font-size:${bc.replyJumpBtnSize}px; ${fgStyle}"></span>`;
        } else if (bc.replyJumpBtnType === 'image') {
            const src = bc.replyJumpBtnUrl || 'https://api.iconify.design/mdi:arrow-up.svg';
            btnContent = `<img src="${src}" style="width:100%;height:100%;object-fit:contain;">`;
        } else if (bc.replyJumpBtnType === 'text') {
            btnContent = `<span style="font-size:${bc.replyJumpBtnSize}px; line-height:1; font-weight:bold; ${fgStyle}">${bc.replyJumpBtnText || '↑'}</span>`;
        }

        const jumpPlacement = bc.replyJumpBtnPlacement || 'inside';
        const jumpOffX = parseInt(bc.replyJumpBtnOffsetX) || 0;
        const jumpOffY = parseInt(bc.replyJumpBtnOffsetY) || 0;

        let jumpPosStyle = '';
        if (jumpPlacement === 'inside') {
            jumpPosStyle = `
                position: absolute;
                right: 8px;
                left: auto;
                top: 50%;
                transform: translate(${jumpOffX}px, calc(-50% + ${jumpOffY}px));
            `;
        } else {
            jumpPosStyle = `
                position: absolute;
                left: 100%;
                right: auto;
                top: 50%;
                transform: translate(${4 + jumpOffX}px, calc(-50% + ${jumpOffY}px));
            `;
        }

        jumpBtnHtml = `<button class="preview-reply-jump-btn" style="
            width:${bc.replyJumpBtnWidth || 24}px;
            height:${bc.replyJumpBtnHeight || 24}px;
            background:${jumpBg};
            border-radius:${bc.replyJumpBtnRadius}%;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            z-index: 10;
            ${jumpPosStyle}
        ">${btnContent}</button>`;
    }
    }

    // ================= 2. 背景样式 =================
    let bgStyle = '';
    if (bc.replyBgUrl) {
        bgStyle = `background: url('${bc.replyBgUrl}') center/cover no-repeat;`;
    } else {
        if (isTG) {
            bgStyle = 'background: transparent;';
        } else if (isSent && (bc.replyPosition === 'inside-top' || bc.replyPosition === 'inside-bottom' || bc.replyPosition === 'inside')) {
            bgStyle = 'background: rgba(255, 255, 255, 0.2);';
        } else {
            const bgColorVal = colorPickerRegistry['replyBgColor'] ? cpGetCssValue('replyBgColor') : bc.replyBgColor;
            bgStyle = `background: ${bgColorVal};`;
        }
    }

    const senderName = isSent ? 'EVEChat' : '用户';
    const fontFamStyle = bc.replyFontFamily ? `font-family: '${bc.replyFontFamily}', sans-serif;` : '';

    // ================= 3. TG专用渲染 =================
    if (isTG) {
        const tgBarColor = isSent ? 'rgba(255,255,255,0.5)' : '#3390ec';
        const tgSenderColor = isSent ? 'rgba(255,255,255,0.9)' : '#3390ec';
        const tgMsgColor = isSent ? 'rgba(255,255,255,0.65)' : '#8b8e91';
        const tgActiveBg = isSent ? 'rgba(255,255,255,0.25)' : 'rgba(51, 144, 236, 0.08)';
        const tgBg = isSent ? 'rgba(255,255,255,0.1)' : 'transparent';

        return `
            <div class="preview-reply-reference" style="
                margin-bottom: 4px;
                padding: 4px 8px;
                background: ${tgBg};
                border-radius: 4px;
                font-size: 13px;
                position: relative;
                border-left: 2px solid ${tgBarColor};
                cursor: pointer;
                overflow: hidden;
                text-align: left;
                ${fontFamStyle}
                transition: background 0.15s ease;
            " onpointerdown="this.style.background='${tgActiveBg}'" onpointerup="this.style.background='${tgBg}'" onpointerleave="this.style.background='${tgBg}'">
                <div style="
                    font-weight: 600;
                    color: ${tgSenderColor};
                    font-size: 12px;
                    line-height: 1.3;
                    word-spacing: -9999px;
                    overflow: hidden;
                    padding-right: 60px;
                    margin-right: -60px;
                ">${senderName}</div>
                <div style="
                    color: ${tgMsgColor};
                    line-height: 1.3;
                    font-size: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                ">${isSent ? '你好呀' : '你好'}</div>
                ${jumpBtnHtml}
            </div>
        `;
    }

    // ================= 4. 非TG：前缀样式 =================
    let prefixHtml = '';

    const barPlacement = bc.replyBarPlacement || 'inside';
    const barOffX = parseInt(bc.replyBarOffsetX) || 0;
    const barOffY = parseInt(bc.replyBarOffsetY) || 0;

    let barColor = colorPickerRegistry['replyBarColor'] ? cpGetCssValue('replyBarColor') : bc.replyBarColor;

    if (bc.replyBarStyle === 'line') {
        const lineContent = `<div style="
            width:${bc.replyBarWidth}px;
            background:${barColor};
            border-radius:${bc.replyBarWidth/2}px;
            height: 100%;
        "></div>`;

        if (barPlacement === 'inside') {
            prefixHtml = `<div style="
                margin-right: 8px;
                flex-shrink: 0;
                transform: translate(${barOffX}px, ${barOffY}px);
                display: flex;
                align-items: stretch;
            ">${lineContent}</div>`;
        } else {
            prefixHtml = `<div style="
                position: absolute;
                right: 100%;
                left: auto;
                top: 0;
                bottom: 0;
                margin-right: 6px;
                transform: translate(${-barOffX}px, ${barOffY}px);
                display: flex;
                align-items: stretch;
            ">${lineContent}</div>`;
        }

    } else if (bc.replyBarStyle === 'icon') {
        let iconContent = '';
        if (bc.replyPrefixIconUrl) {
            iconContent = `<img src="${bc.replyPrefixIconUrl}" style="width:14px;height:14px;object-fit:contain;">`;
        } else {
            const iconName = bc.replyPrefixIconNav || 'ri-chat-quote-fill';
            iconContent = `<span class="iconify" data-icon="${iconName}"></span>`;
        }

        const iconInner = `<span style="color:${barColor};display:flex;align-items:center;">${iconContent}</span>`;

        if (barPlacement === 'inside') {
            prefixHtml = `<div style="
                margin-right: 6px;
                display: flex;
                align-items: center;
                transform: translate(${barOffX}px, ${barOffY}px);
            ">${iconInner}</div>`;
        } else {
            prefixHtml = `<div style="
                position: absolute;
                right: 100%;
                left: auto;
                top: 50%;
                margin-right: 6px;
                transform: translate(${-barOffX}px, calc(-50% + ${barOffY}px));
                display: flex;
                align-items: center;
            ">${iconInner}</div>`;
        }
    }

    // ================= 5. 非TG：文字内容 =================
    const showSender = bc.replyShowSender !== false;
const showTime = bc.replyShowTime !== false;

    let senderStyleStr = getGradientTextStyleForReply('replySenderColor', bc.replySenderColor || '#999');
    let msgStyleStr = getGradientTextStyleForReply('replyMsgColor', bc.replyMsgColor || '#666');
    let timeStyleStr = getGradientTextStyleForReply('replyTimeColor', bc.replyTimeColor || '#999');

    let headerHtml = '';
if (showSender || showTime) {
    
    const useWordSpacingHide = !showTime && bc.replyTimeHideMethod === 'word-spacing';
    
    let timeHtml = '';
    if (showTime) {
        timeHtml = `<span class="preview-reply-reference-time" style="
            font-size:${Math.max(9, bc.replyFontSize - 2)}px;
            margin-left: auto;
            display: block;
            ${timeStyleStr}
        ">10:00</span>`;
    } else if (useWordSpacingHide) {
        
        timeHtml = `<span class="preview-reply-reference-time" style="
            font-size:0px;
            width:0px;
            height:0px;
            overflow:hidden;
            position:absolute;
            left:-9999px;
        ">10:00</span>`;
    }

    
    let senderExtraStyle = '';
    if (useWordSpacingHide) {
        senderExtraStyle = 'word-spacing:-9999px; overflow:hidden; padding-right:60px; margin-right:-60px;';
    }

    headerHtml = `
        <div class="preview-reply-reference-header" style="display: flex; align-items: center; line-height: 1; margin-bottom: 2px;">
            ${showSender ? `<span class="preview-reply-reference-sender" style="
                font-size:${bc.replyFontSize}px;
                font-weight: 600;
                margin-right: 8px;
                ${senderStyleStr}
                ${senderExtraStyle}
            ">${senderName}</span>` : ''}
            ${timeHtml}
        </div>
    `;
}

    // ================= 6. sender前缀模式 =================
    if (bc.replyBarStyle === 'sender') {
        return `
            <div class="preview-reply-reference" style="
                padding:${bc.replyPadding}px ${bc.replyPadding + 4}px;
                ${bgStyle}
                border-radius:${bc.replyBgRadius}px;
                font-size:${bc.replyFontSize}px;
                ${fontFamStyle}
                text-align: left;
                display: inline-block;
                width: 100%;
                box-sizing: border-box;
                line-height: 1.4;
            ">
                <span style="${senderStyleStr} font-weight: 600;">${senderName}：</span>
                <span style="${msgStyleStr}">${isSent ? '你好呀' : '你好'}</span>
            </div>
        `;
    }

   // ================= 7. 默认/自定义模式 =================


let externalDecoHtml = '';
if (bc.replyJumpBtnExternal && bc.replyJumpBtnType !== 'none') {
    const extBg = colorPickerRegistry['replyJumpExtBg'] ? cpGetCssValue('replyJumpExtBg') : 'linear-gradient(135deg, #7B68EE, #4A90D9)';
    const extTextColor = colorPickerRegistry['replyJumpExtText'] ? cpGetCssValue('replyJumpExtText') : '#FFFFFF';
    const isExtTextGrad = colorPickerRegistry['replyJumpExtText'] && cpIsGradient('replyJumpExtText');
    const extText = bc.replyJumpBtnExternalText || '跳转';
    const extPos = bc.replyJumpBtnExternalPos || 'right';
    const extGap = bc.replyJumpBtnExternalGap || 6;
    const extFS = bc.replyJumpBtnExternalFontSize || 11;
    const extR = bc.replyJumpBtnExternalRadius || 4;
    const extPX = bc.replyJumpBtnExternalPadX || 10;
    const extPY = bc.replyJumpBtnExternalPadY || 3;

    let posStyle = 'position:absolute;';
    if (extPos === 'right') {
        posStyle += `top:50%;left:100%;transform:translateY(-50%);margin-left:${extGap}px;`;
    } else if (extPos === 'left') {
        posStyle += `top:50%;right:100%;transform:translateY(-50%);margin-right:${extGap}px;`;
    } else if (extPos === 'top') {
        posStyle += `bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:${extGap}px;`;
    } else if (extPos === 'bottom') {
        posStyle += `top:100%;left:50%;transform:translateX(-50%);margin-top:${extGap}px;`;
    }

    let textStyle = '';
    if (isExtTextGrad) {
        textStyle = `color:transparent;background:${extTextColor};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;`;
    } else {
        textStyle = `color:${extTextColor};-webkit-text-fill-color:${extTextColor};`;
    }

    externalDecoHtml = `<span style="
        ${posStyle}
        padding:${extPY}px ${extPX}px;
        font-size:${extFS}px;
        font-weight:600;
        background:${extBg};
        -webkit-background-clip:padding-box;
        background-clip:padding-box;
        border-radius:${extR}px;
        white-space:nowrap;
        pointer-events:none;
        z-index:51;
        ${textStyle}
    ">${extText}</span>`;
}

return `
    <div class="preview-reply-reference" style="
        padding:${bc.replyPadding}px ${bc.replyPadding + 4}px;
        ${bgStyle}
        border-radius:${bc.replyBgRadius}px;
        font-size:${bc.replyFontSize}px;
        ${fontFamStyle}
        position:relative;
        min-height: 34px;
        text-align: left;
        display: flex;
        align-items: stretch;
        width: 100%;
        box-sizing: border-box;
        overflow: visible;
    ">
        ${prefixHtml}
        <div class="preview-reply-reference-content" style="
            flex:1;
            min-width:0;
            padding-right:${(bc.replyJumpBtnType !== 'none' && !bc.replyJumpBtnExternal && bc.replyJumpBtnPlacement === 'inside') ? '24px' : '0'};
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 2px;
        ">
            ${headerHtml}
            <div class="preview-reply-reference-message" style="
                line-height:1.3;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: ${bc.replyFontSize}px;
                ${msgStyleStr}
            ">${isSent ? '你好呀' : '你好'}</div>
        </div>
        ${jumpBtnHtml}
        ${externalDecoHtml}
    </div>
`;
}

function generateVoicePreviewWithIndex(side, index, total) {
    const isSent = side === 'sent';
    const bc = bubbleConfig;
    const waveCount = bc.voiceWaveCount || styleConfig.voice.waveCount || 4;
    const waveStyle = bc.voiceWaveStyle || 'bars';
    const textPos = bc.voiceTextPosition || 'bottom';

    let waveHtml = '';

    
    if (bc.voiceWaveSource === 'custom' && bc.voiceCustomIcon.url) {
        const icon = bc.voiceCustomIcon;
        if (icon.renderMode === 'mask') {
            waveHtml = `<div class="preview-voice-wave" style="
                width:${icon.width}px;
                height:${icon.height}px;
                background-color: currentColor;
                -webkit-mask-image: url('${icon.url}');
                -webkit-mask-size: contain;
                -webkit-mask-repeat: no-repeat;
                -webkit-mask-position: center;
                mask-image: url('${icon.url}');
                mask-size: contain;
                mask-repeat: no-repeat;
                mask-position: center;
                flex-shrink: 0;
            "></div>`;
        } else {
            waveHtml = `<div class="preview-voice-wave" style="flex-shrink:0;">
                <img src="${icon.url}" style="
                    width:${icon.width}px;
                    height:${icon.height}px;
                    object-fit:contain;
                    display:block;
                ">
            </div>`;
        }
    } else if (waveStyle === 'bars') {
        const barHeights = [8, 12, 6, 10, 14, 7, 11, 9, 13, 5, 8, 12];
        let barsHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const h = barHeights[i % barHeights.length];
            const delay = (i * 0.15).toFixed(2);
            barsHtml += `<span class="wave-bar" style="height:${h}px;animation-delay:${delay}s;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave">${barsHtml}</div>`;
    } else if (waveStyle === 'sine') {
        waveHtml = `<div class="preview-voice-wave" style="font-size: 16px;">${'〰️'.repeat(waveCount)}</div>`;
    } else if (waveStyle === 'dots') {
        let dotsHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const s = 4 + (i % 3) * 2;
            const delay = (i * 0.2).toFixed(2);
            dotsHtml += `<span style="width:${s}px;height:${s}px;border-radius:50%;background:currentColor;animation:bubble-pulse 1.5s ease-in-out ${delay}s infinite;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave" style="gap:4px;">${dotsHtml}</div>`;
    } else if (waveStyle === 'line') {
        let lineHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const w = 6 + (i % 2) * 4;
            const delay = (i * 0.15).toFixed(2);
            lineHtml += `<span style="width:${w}px;height:2px;background:currentColor;border-radius:1px;animation:wave-animate 1.2s ease-in-out ${delay}s infinite;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave" style="gap:2px;">${lineHtml}</div>`;
    } else if (waveStyle === 'pointed') {
        let pointedHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const size = 6 + (i % 3) * 2;
            const delay = (i * 0.18).toFixed(2);
            pointedHtml += `<span class="wave-pointed" style="border-left-width:${size/2}px;border-right-width:${size/2}px;border-bottom-width:${size}px;animation-delay:${delay}s;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave" style="gap:3px;align-items:flex-end;">${pointedHtml}</div>`;
    } else if (waveStyle === 'bubble') {
        let bubbleHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const s = 5 + (i % 4) * 2;
            const delay = (i * 0.25).toFixed(2);
            bubbleHtml += `<span class="wave-bubble" style="width:${s}px;height:${s}px;animation-delay:${delay}s;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave" style="gap:3px;">${bubbleHtml}</div>`;
    } else if (waveStyle === 'equalizer') {
        let eqHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const h = 8 + (i % 5) * 3;
            const delay = (i * 0.12).toFixed(2);
            eqHtml += `<span class="wave-equalizer" style="height:${h}px;animation-delay:${delay}s;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave" style="gap:2px;align-items:flex-end;">${eqHtml}</div>`;
    } else if (waveStyle === 'pulse') {
        const buildEcgSegment = (startX) => {
            const s = startX;
            return `L${s} 10 L${s+3} 10 Q${s+5} 7 ${s+7} 10 L${s+9} 10 L${s+10} 12 L${s+12} 2 L${s+14} 16 L${s+15} 10 L${s+18} 10 Q${s+21} 6 ${s+24} 10 L${s+27} 10`;
        };
        const cycles = Math.max(1, Math.floor(waveCount / 3));
        const segmentWidth = 27;
        const totalWidth = cycles * segmentWidth + 6;
        let pathD = `M0 10 `;
        for (let i = 0; i < cycles; i++) {
            pathD += buildEcgSegment(i * segmentWidth + 3);
        }
        pathD += ` L${totalWidth} 10`;
        waveHtml = `
            <div class="preview-voice-wave wave-ecg" style="width:${Math.min(totalWidth, 120)}px;">
                <svg viewBox="0 0 ${totalWidth} 20" preserveAspectRatio="none" style="width:100%;height:20px;">
                    <polyline class="ecg-line" points="" style="display:none;"/>
                    <path class="ecg-line" d="${pathD}" 
                          style="stroke-dasharray:${totalWidth * 2};stroke-dashoffset:${totalWidth * 2};
                                 animation:ecg-draw ${1.5 + cycles * 0.3}s linear infinite;"/>
                </svg>
            </div>`;
    } else if (waveStyle === 'diamond') {
        let diamondHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const s = 5 + (i % 3) * 2;
            const delay = (i * 0.22).toFixed(2);
            diamondHtml += `<span class="wave-diamond" style="width:${s}px;height:${s}px;animation-delay:${delay}s;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave" style="gap:4px;">${diamondHtml}</div>`;
    } else if (waveStyle === 'ribbon') {
        let ribbonHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const delay = (i * 0.3).toFixed(2);
            ribbonHtml += `<span class="wave-ribbon" style="animation-delay:${delay}s;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave" style="gap:3px;">${ribbonHtml}</div>`;
    } else if (waveStyle === 'blocks') {
        let blockHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const s = 5 + (i % 3) * 2;
            const delay = (i * 0.15).toFixed(2);
            blockHtml += `<span class="wave-block" style="width:${s}px;height:${s}px;animation-delay:${delay}s;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave" style="gap:3px;">${blockHtml}</div>`;
    } else if (waveStyle === 'spring') {
        let springHtml = '';
        for (let i = 0; i < waveCount; i++) {
            const delay = (i * 0.2).toFixed(2);
            springHtml += `<span class="wave-spring" style="animation-delay:${delay}s;"></span>`;
        }
        waveHtml = `<div class="preview-voice-wave" style="gap:2px;">${springHtml}</div>`;
    }

    
    const textColor = colorPickerRegistry['voiceTextColor'] ? cpGetCssValue('voiceTextColor') : '#333';
    const textBg = colorPickerRegistry['voiceTextBg'] ? cpGetCssValue('voiceTextBg') : '#FFFFFF';
    const textBgIsGradient = colorPickerRegistry['voiceTextBg'] && cpIsGradient('voiceTextBg');
    const textBorderColor = colorPickerRegistry['voiceTextBorderColor'] ? cpGetCssValue('voiceTextBorderColor') : '#ddd';
    const textShadow = spGetCssValue('voiceTextShadow');

    let textMargin = '';
    if (textPos === 'top') textMargin = 'margin-bottom: 6px;';
    else if (textPos === 'bottom') textMargin = 'margin-top: 6px;';
    else if (textPos === 'left') textMargin = 'margin-right: 6px;';
    else if (textPos === 'right') textMargin = 'margin-left: 6px;';

    let textBubbleStyle = `
        font-size: ${bc.voiceTextFontSize !== undefined ? bc.voiceTextFontSize : 14}px;
        border-radius: ${bc.voiceTextRadius !== undefined ? bc.voiceTextRadius : 12}px;
        color: ${textColor};
        ${textBgIsGradient ? 'background: ' + textBg : 'background-color: ' + textBg};
        ${(bc.voiceTextBorderWidth !== undefined ? bc.voiceTextBorderWidth : 0) > 0 ? 'border: ' + bc.voiceTextBorderWidth + 'px solid ' + textBorderColor + ';' : ''}
        ${textShadow !== 'none' ? 'box-shadow: ' + textShadow + ';' : ''}
        ${bc.voiceTextBgUrl ? 'background-image: url(' + bc.voiceTextBgUrl + '); background-size: cover;' : ''}
    `;

    let containerStyle = '';
    if (textPos === 'top') containerStyle = 'display:flex;flex-direction:column-reverse;';
    else if (textPos === 'left') containerStyle = 'display:flex;flex-direction:row-reverse;align-items:center;';
    else if (textPos === 'right') containerStyle = 'display:flex;flex-direction:row;align-items:center;';
    else containerStyle = 'display:flex;flex-direction:column;';

    const content = `
        <div class="preview-voice-message-container ${isSent ? 'sent' : 'received'}" style="${containerStyle}">
            <div class="preview-bubble preview-voice-message" style="${getBubbleStyle(isSent)}" onclick="toggleVoiceText(this)">
                ${isSent ? '<span class="preview-voice-duration">1"</span>' : ''}
                ${waveHtml}
                ${!isSent ? '<span class="preview-voice-duration">9"</span>' : ''}
            </div>
            <div class="preview-voice-text-content ${isSent ? 'visible' : ''}" style="${textBubbleStyle}">${isSent ? '发条语音' : '你好呀'}</div>
        </div>
    `;
    return generateMessageWithIndex(side, content, index, total, { msgType: 'voice' });
}
function generateTransferPreviewWithIndex(side, index, total) {
    const isSent = side === 'sent';
    const bc = bubbleConfig;
    
    // 背景处理
    let bgStyle = '';
    if (bc.transferBgImageEnabled && bc.transferBgUrl) {
        // ★ 核心修复：直接使用 background 确保彻底覆盖原生渐变、颜色设置
        bgStyle = `background: url('${bc.transferBgUrl}') center/cover no-repeat !important;`;
    } else {
        bgStyle = `background: ${cpGetCssValue('transferBg')} !important;`;
    }
    
    
    let borderStyle = '';
    if (bc.transferBorderWidth > 0) {
        const borderColor = cpGetCssValue('transferBorderColor');
        const isGradBorder = cpIsGradient('transferBorderColor');
        if (isGradBorder) {
            borderStyle = `border: ${bc.transferBorderWidth}px solid transparent; border-image: ${borderColor} 1;`;
        } else {
            borderStyle = `border: ${bc.transferBorderWidth}px solid ${borderColor};`;
        }
    }
    
    
    let amountStyle = '';
    const textCol = cpGetCssValue('transferTextColor');
    if (cpIsGradient('transferTextColor')) {
        amountStyle = `background-image: ${textCol}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;`;
    } else {
        amountStyle = `color: ${textCol};`;
    }

    
    const decoHtml = getTransferDecoHtml();

    
    const title = isSent ? (bc.transferTitleSent || '💕 你发起的转账') : (bc.transferTitleRecv || '💖 收到转账');
    const amount = isSent ? (bc.transferAmountSent || '¥ 70.00') : (bc.transferAmountRecv || '¥ 5.20');
    const note = isSent ? (bc.transferNoteSent || '转账') : (bc.transferNoteRecv || '爱你么么哒');
    
    
    const status = isSent ? (bc.transferStatusSent || '对方已收款') : (bc.transferStatusRecv || '已收款');

    
    const titleZ = (bc.transferTitleLayer === 'before') ? 'z-index:0;' : 'z-index:10;';
const amountZ = (bc.transferAmountLayer === 'before') ? 'z-index:0;' : 'z-index:10;';
const noteZ = (bc.transferNoteLayer === 'before') ? 'z-index:0;' : 'z-index:10;';
const statusZ = (bc.transferStatusLayer === 'before') ? 'z-index:0;' : 'z-index:10;';

const titleHtml = bc.transferTitleVisible ? `<div class="preview-transfer-title" style="position:relative;${titleZ} transform:translate(${bc.transferTitleX||0}px,${bc.transferTitleY||0}px);">${title}</div>` : '';
const amountHtml = bc.transferAmountVisible ? `<div class="preview-transfer-amount" style="position:relative;${amountZ} ${amountStyle} transform:translate(${bc.transferAmountX||0}px,${bc.transferAmountY||0}px);">${amount}</div>` : '';
const noteHtml = bc.transferNoteVisible ? `<div class="preview-transfer-note" style="position:relative;${noteZ} transform:translate(${bc.transferNoteX||0}px,${bc.transferNoteY||0}px);">${note}</div>` : '';
const statusHtml = bc.transferStatusVisible ? `<div class="preview-transfer-status" style="position:relative;${statusZ} transform:translate(${bc.transferStatusX||0}px,${bc.transferStatusY||0}px);">${status}</div>` : '';

    const content = `
        <div class="preview-transfer-card ${isSent ? 'accepted' : ''}" style="
            width:${bc.transferWidth}px;
            height:${bc.transferHeight}px;
            border-radius:${bc.transferRadius}px;
            ${bgStyle}
            ${borderStyle}
            box-shadow: ${spGetCssValue('transferShadow')};
            position: relative; 
            overflow: visible; 
        ">
            ${decoHtml}
            <div style="position:relative; z-index:10; display:flex; flex-direction:column; height:100%;">
                ${titleHtml}
                ${amountHtml}
                ${noteHtml}
                ${statusHtml}
            </div>
        </div>
    `;
    return generateMessageWithIndex(side, content, index, total);
}

function generateDreamyPhotoPreviewWithIndex(side, index, total) {
    const isSent = side === 'sent';
    const bc = bubbleConfig;
    
    
    const descBg = colorPickerRegistry['imageDescBg'] ? cpGetCssValue('imageDescBg') : 'rgba(255, 255, 255, 0.95)';
    const descBgIsGradient = colorPickerRegistry['imageDescBg'] && cpIsGradient('imageDescBg');
    const descBorderColor = colorPickerRegistry['imageDescBorderColor'] ? cpGetCssValue('imageDescBorderColor') : '#ddd';
    const descRadius = bc.descRadius || 10;
    const descBorderWidth = bc.descBorderWidth || 0;
    
    
    const descFontColor = colorPickerRegistry['imageDescFontColor'] ? cpGetCssValue('imageDescFontColor') : '#333';
    const descFontColorIsGradient = colorPickerRegistry['imageDescFontColor'] && cpIsGradient('imageDescFontColor');
    const descFontSize = bc.descFontSize || 14;
    const descFontFamily = bc.descFontFamily ? `font-family: '${bc.descFontFamily}', -apple-system, sans-serif;` : '';
    
    let descStyle = `
        border-radius: ${descRadius}px;
        ${descBgIsGradient ? 'background: ' + descBg : 'background-color: ' + descBg};
        ${descBorderWidth > 0 ? (
            colorPickerRegistry['imageDescBorderColor'] && cpIsGradient('imageDescBorderColor')
                ? 'border: ' + descBorderWidth + 'px solid transparent; border-image: ' + descBorderColor + ' 1;'
                : 'border: ' + descBorderWidth + 'px solid ' + descBorderColor + ';'
        ) : ''}
    `;
    
    
    let descTextStyle = `
        font-size: ${descFontSize}px;
        ${descFontFamily}
        ${descFontColorIsGradient 
            ? `background-image: ${descFontColor}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;` 
            : `color: ${descFontColor};`
        }
    `;
    
    
    let placeholderContent = '';
    if (bc.placeholderType === 'url' && bc.placeholderUrl) {
        placeholderContent = `<img src="${bc.placeholderUrl}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;">`;
    } else if (bc.placeholderType === 'upload' && bc.placeholderUrl) {
        placeholderContent = `<img src="${bc.placeholderUrl}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;">`;
    } else if (bc.placeholderType === 'svg' && bc.placeholderSvg) {
        placeholderContent = `<div style="width:100%;height:100%;position:absolute;top:0;left:0;z-index:1;display:flex;align-items:center;justify-content:center;">${bc.placeholderSvg}</div>`;
    } else if (bc.placeholderType === 'emoji' && bc.placeholderEmoji) {
        placeholderContent = `<div style="width:100%;height:100%;position:absolute;top:0;left:0;z-index:1;display:flex;align-items:center;justify-content:center;font-size:48px;">${bc.placeholderEmoji}</div>`;
    } else if (bc.placeholderType === 'text' && bc.placeholderText) {
        placeholderContent = `<div style="width:100%;height:100%;position:absolute;top:0;left:0;z-index:1;display:flex;align-items:center;justify-content:center;font-size:14px;color:#666;text-align:center;padding:10px;">${bc.placeholderText}</div>`;
    }
    
    const content = `
        <div class="preview-dreamy-photo-container" onclick="togglePhotoDescription(this)">
            <div class="preview-dreamy-photo" style="width:${bc.imageMaxWidth}px;height:${bc.imageMaxHeight}px;">
                ${placeholderContent ? '' : '<div class="preview-photo-misty-bg"></div>'}
${placeholderContent}
                ${placeholderContent ? '' : `<div class="preview-sparkle-container">
    <span class="preview-sparkle preview-sparkle-1">✨</span>
    <span class="preview-sparkle preview-sparkle-2">✨</span>
    <span class="preview-sparkle preview-sparkle-3">✨</span>
    <span class="preview-sparkle preview-sparkle-4">✨</span>
    <span class="preview-sparkle preview-sparkle-5">✨</span>
</div>`}
                <div class="preview-photo-badge"><i class="fa-solid fa-image"></i></div>
                <div class="preview-photo-text-overlay" style="${descStyle}">
                    <div class="preview-photo-description" style="${descTextStyle}">${isSent ? '夕阳下的海边，金色的光芒洒在波光粼粼的海面上。' : '一只橘猫正懒洋洋地趴在窗台上晒太阳，阳光把它金色的毛照得发亮。'}</div>
                </div>
            </div>
        </div>
    `;
    return generateMessageWithIndex(side, content, index, total);
}

        function generatePreviewBySubTab(side) {
    switch (currentSubTab) {
        case 'avatar':
            return generateAllMessagesForSide(side);
        case 'bubble':
            
            return generateAllMessagesForSide(side);
        case 'reply':
            return generateReplyPreview(side);
        case 'transfer':
            return generateTransferPreview(side);
        case 'system':
            return '';
            case 'toolbar':
    return generateAllMessages();
        default:
            return generateTextPreview(side);
    }
}




        function generateTextPreview(side) {
    return generateTextPreviewWithIndex(side, 0, 1);
}

function generateImagePreview(side, hasBubble) {
    return generateImagePreviewWithIndex(side, hasBubble, 0, 1);
}

function generateEmojiPreview(side, hasBubble) {
    return generateEmojiPreviewWithIndex(side, hasBubble, 0, 1);
}

function generateReplyPreview(side) {
    return generateReplyPreviewWithIndex(side, 0, 1);
}


function getTextStyle(isSent) {
    const bc = bubbleConfig;
    // 核心修改：如果是 sent，优先读取 fontSizeSent，否则读取兼容的 fontSize
    let currentFontSize = isSent ? (bc.fontSizeSent || bc.fontSize) : (bc.fontSizeRecv || bc.fontSize);
    let style = `font-size: ${currentFontSize}px;`;

    if (bc.fontFamily) {
        style += `font-family: '${bc.fontFamily}', -apple-system, sans-serif;`;
    }

    
    if (bc.fontWeight && bc.fontWeight !== 'normal') {
        style += `font-weight: ${bc.fontWeight};`;
    }

    
    const fontColorKey = isSent ? 'fontColorSent' : 'fontColor';
    const isGradientText = colorPickerRegistry[fontColorKey] && cpIsGradient(fontColorKey);
    
    if (isGradientText) {
        style += `background-image: ${cpGetCssValue(fontColorKey)}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; display: inline;`;
    } else if (colorPickerRegistry[fontColorKey]) {
        style += `color: ${cpGetCssValue(fontColorKey)};`;
    } else {
        style += `color: ${isSent ? styleConfig.text.sentTextColor : styleConfig.text.receivedTextColor};`;
    }

    

if (bc.textBgEnabled) {
    
    if (isGradientText) {
        var fallbackColor = colorPickerRegistry[fontColorKey]?.gradientColors?.[0]?.color || (isSent ? '#ffffff' : '#333333');
        style = style.replace(/background-image:.*?;/g, '');
        style = style.replace(/-webkit-background-clip:.*?;/g, '');
        style = style.replace(/background-clip:.*?;/g, '');
        style = style.replace(/-webkit-text-fill-color:.*?;/g, '');
        style += 'color: ' + fallbackColor + '; -webkit-text-fill-color: ' + fallbackColor + ';';
    }
}
    
    

    return style;
}


function generateVoicePreview(side) {
    return generateVoicePreviewWithIndex(side, 0, 1);
}

function generateTransferPreview(side) {
    return generateTransferPreviewWithIndex(side, 0, 1);
}

function generateDreamyPhotoPreview(side) {
    return generateDreamyPhotoPreviewWithIndex(side, 0, 1);
}

function generateTimestampPreview() {
    const cfg = styleConfig.system;

    const fontColorVal = colorPickerRegistry['systemFontColor'] ? cpGetCssValue('systemFontColor') : cfg.color;
    const isFontGradient = colorPickerRegistry['systemFontColor'] && cpIsGradient('systemFontColor');
    
    let baseFontStyle = `font-size:${cfg.fontSize}px;`;
    if (cfg.fontWeight && cfg.fontWeight !== 'normal') baseFontStyle += `font-weight:${cfg.fontWeight};`;
    if (cfg.fontFamily) baseFontStyle += `font-family:'${cfg.fontFamily}',-apple-system,sans-serif;`;

    let gradientTextStyle = '';
    let solidTextStyle = '';
    
    if (isFontGradient) {
        gradientTextStyle = `background-image:${fontColorVal};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;`;
    } else {
        solidTextStyle = `color:${fontColorVal};`;
    }

    let bgStyle = '';
    if (cfg.useColorBg === false) {
        if (cfg.bgUrl) {
            bgStyle = `background-image:url('${cfg.bgUrl}'); background-size:${cfg.bgSize || 'cover'}; background-position:center; background-repeat:no-repeat;`;
        }
    } else {
        if (colorPickerRegistry['systemBgColor']) {
            const bgVal = cpGetCssValue('systemBgColor');
            bgStyle = cpIsGradient('systemBgColor') ? `background:${bgVal};` : `background-color:${bgVal};`;
        }
    }

    let shapeStyle = '';
    if (cfg.radius > 0) shapeStyle += `border-radius:${cfg.radius}px;`;
    if (cfg.padX > 0 || cfg.padY > 0) shapeStyle += `padding:${cfg.padY || 0}px ${cfg.padX || 0}px;`;

    const shadowVal = spGetCssValue('systemShadow');
    if (shadowVal !== 'none') shapeStyle += `box-shadow:${shadowVal};`;

    let borderStyle = '';
    let borderWrapperStart = '';
    let borderWrapperEnd = '';
    if (cfg.borderWidth > 0) {
        const borderColor = colorPickerRegistry['systemBorderColor'] ? cpGetCssValue('systemBorderColor') : '#ddd';
        const isBorderGradient = colorPickerRegistry['systemBorderColor'] && cpIsGradient('systemBorderColor');
        if (isBorderGradient) {
            borderWrapperStart = `<div style="background:${borderColor}; padding:${cfg.borderWidth}px; border-radius:${(cfg.radius || 0) + cfg.borderWidth}px; display:inline-block; box-shadow:${shadowVal !== 'none'? shadowVal : 'none'};">`;
            borderWrapperEnd = `</div>`;
            shapeStyle = shapeStyle.replace(`box-shadow:${shadowVal};`, '');
        } else {
            borderStyle = `border:${cfg.borderWidth}px solid ${borderColor};`;
        }
    }

    const contentStr = isFontGradient ? `<span style="${baseFontStyle}${gradientTextStyle}">10:00</span>` : '10:00';
    const finalTextStyle = isFontGradient ? '' : solidTextStyle;

    return `<div class="preview-timestamp" style="margin:20px 0;text-align:center;">${borderWrapperStart}<span style="${baseFontStyle}${finalTextStyle}${bgStyle}${shapeStyle}${borderStyle}">${contentStr}</span>${borderWrapperEnd}</div>`;
}

function generateSystemPreview() {
    const cfg = styleConfig.system;

    const fontColorVal = colorPickerRegistry['systemFontColor'] ? cpGetCssValue('systemFontColor') : cfg.color;
    const isFontGradient = colorPickerRegistry['systemFontColor'] && cpIsGradient('systemFontColor');
    
    let baseFontStyle = `font-size:${cfg.fontSize}px;`;
    if (cfg.fontWeight && cfg.fontWeight !== 'normal') baseFontStyle += `font-weight:${cfg.fontWeight};`;
    if (cfg.fontFamily) baseFontStyle += `font-family:'${cfg.fontFamily}',-apple-system,sans-serif;`;

    let gradientTextStyle = '';
    let solidTextStyle = '';
    
    if (isFontGradient) {
        gradientTextStyle = `background-image:${fontColorVal};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;`;
    } else {
        solidTextStyle = `color:${fontColorVal};`;
    }

    let bgStyle = '';
    if (cfg.useColorBg === false) {
        if (cfg.bgUrl) {
            bgStyle = `background-image:url('${cfg.bgUrl}'); background-size:${cfg.bgSize || 'cover'}; background-position:center; background-repeat:no-repeat;`;
        }
    } else {
        if (colorPickerRegistry['systemBgColor']) {
            const bgVal = cpGetCssValue('systemBgColor');
            bgStyle = cpIsGradient('systemBgColor') ? `background:${bgVal};` : `background-color:${bgVal};`;
        }
    }

    let shapeStyle = '';
    if (cfg.radius > 0) shapeStyle += `border-radius:${cfg.radius}px;`;
    if (cfg.padX > 0 || cfg.padY > 0) shapeStyle += `padding:${cfg.padY || 0}px ${cfg.padX || 0}px;`;

    const shadowVal = spGetCssValue('systemShadow');
    if (shadowVal !== 'none') shapeStyle += `box-shadow:${shadowVal};`;

    let borderStyle = '';
    let borderWrapperStart = '';
    let borderWrapperEnd = '';
    if (cfg.borderWidth > 0) {
        const borderColor = colorPickerRegistry['systemBorderColor'] ? cpGetCssValue('systemBorderColor') : '#ddd';
        const isBorderGradient = colorPickerRegistry['systemBorderColor'] && cpIsGradient('systemBorderColor');
        if (isBorderGradient) {
            borderWrapperStart = `<div style="background:${borderColor}; padding:${cfg.borderWidth}px; border-radius:${(cfg.radius || 0) + cfg.borderWidth}px; display:inline-block; box-shadow:${shadowVal !== 'none'? shadowVal : 'none'};">`;
            borderWrapperEnd = `</div>`;
            shapeStyle = shapeStyle.replace(`box-shadow:${shadowVal};`, '');
        } else {
            borderStyle = `border:${cfg.borderWidth}px solid ${borderColor};`;
        }
    }

    let html = '';
    const text1 = 'EVEChat主题编辑器已收款 ¥70.00';
    const text2 = 'EVEChat戳了戳用户';
    const tStyle = isFontGradient ? '' : solidTextStyle;

    if (isFontGradient) {
        html += `<div class="preview-system-message-wrapper">${borderWrapperStart}<div class="preview-system-message" style="${baseFontStyle}${bgStyle}${shapeStyle}${borderStyle}"><span style="${baseFontStyle}${gradientTextStyle}">${text1}</span></div>${borderWrapperEnd}</div>`;
        html += `<div class="preview-system-message-wrapper">${borderWrapperStart}<div class="preview-system-message" style="${baseFontStyle}${bgStyle}${shapeStyle}${borderStyle}"><span style="${baseFontStyle}${gradientTextStyle}">${text2}</span></div>${borderWrapperEnd}</div>`;
    } else {
        html += `<div class="preview-system-message-wrapper">${borderWrapperStart}<div class="preview-system-message" style="${baseFontStyle}${tStyle}${bgStyle}${shapeStyle}${borderStyle}">${text1}</div>${borderWrapperEnd}</div>`;
        html += `<div class="preview-system-message-wrapper">${borderWrapperStart}<div class="preview-system-message" style="${baseFontStyle}${tStyle}${bgStyle}${shapeStyle}${borderStyle}">${text2}</div>${borderWrapperEnd}</div>`;
    }

    return html;
}

function generateRecalledPreview() {
    const cfg = styleConfig.system;

    const fontColorVal = colorPickerRegistry['systemFontColor'] ? cpGetCssValue('systemFontColor') : cfg.color;
    const isFontGradient = colorPickerRegistry['systemFontColor'] && cpIsGradient('systemFontColor');
    
    let baseFontStyle = `font-size:${cfg.fontSize}px;`;
    if (cfg.fontWeight && cfg.fontWeight !== 'normal') baseFontStyle += `font-weight:${cfg.fontWeight};`;
    if (cfg.fontFamily) baseFontStyle += `font-family:'${cfg.fontFamily}',-apple-system,sans-serif;`;

    let gradientTextStyle = '';
    let solidTextStyle = '';
    
    if (isFontGradient) {
        gradientTextStyle = `background-image:${fontColorVal};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;`;
    } else {
        solidTextStyle = `color:${fontColorVal};`;
    }

    let bgStyle = '';
    if (cfg.useColorBg === false) {
        if (cfg.bgUrl) {
            bgStyle = `background-image:url('${cfg.bgUrl}'); background-size:${cfg.bgSize || 'cover'}; background-position:center; background-repeat:no-repeat;`;
        }
    } else {
        if (colorPickerRegistry['systemBgColor']) {
            const bgVal = cpGetCssValue('systemBgColor');
            bgStyle = cpIsGradient('systemBgColor') ? `background:${bgVal};` : `background-color:${bgVal};`;
        }
    }

    let shapeStyle = '';
    if (cfg.radius > 0) shapeStyle += `border-radius:${cfg.radius}px;`;
    if (cfg.padX > 0 || cfg.padY > 0) shapeStyle += `padding:${cfg.padY || 0}px ${cfg.padX || 0}px;`;

    const shadowVal = spGetCssValue('systemShadow');
    if (shadowVal !== 'none') shapeStyle += `box-shadow:${shadowVal};`;

    let borderStyle = '';
    let borderWrapperStart = '';
    let borderWrapperEnd = '';
    if (cfg.borderWidth > 0) {
        const borderColor = colorPickerRegistry['systemBorderColor'] ? cpGetCssValue('systemBorderColor') : '#ddd';
        const isBorderGradient = colorPickerRegistry['systemBorderColor'] && cpIsGradient('systemBorderColor');
        if (isBorderGradient) {
            borderWrapperStart = `<div style="background:${borderColor}; padding:${cfg.borderWidth}px; border-radius:${(cfg.radius || 0) + cfg.borderWidth}px; display:inline-block; box-shadow:${shadowVal !== 'none'? shadowVal : 'none'};">`;
            borderWrapperEnd = `</div>`;
            shapeStyle = shapeStyle.replace(`box-shadow:${shadowVal};`, '');
        } else {
            borderStyle = `border:${cfg.borderWidth}px solid ${borderColor};`;
        }
    }

    let html = '';
    const text1 = '你撤回了一条消息';
    const text2 = 'EVEChat主题编辑器撤回了一条消息';
    const tStyle = isFontGradient ? '' : solidTextStyle;

    if (isFontGradient) {
        html += `<div class="preview-recalled-message-wrapper">${borderWrapperStart}<div class="preview-recalled-message" style="${baseFontStyle}${bgStyle}${shapeStyle}${borderStyle}"><span style="${baseFontStyle}${gradientTextStyle}">${text1}</span></div>${borderWrapperEnd}</div>`;
        html += `<div class="preview-recalled-message-wrapper">${borderWrapperStart}<div class="preview-recalled-message" style="${baseFontStyle}${bgStyle}${shapeStyle}${borderStyle}"><span style="${baseFontStyle}${gradientTextStyle}">${text2}</span></div>${borderWrapperEnd}</div>`;
    } else {
        html += `<div class="preview-recalled-message-wrapper">${borderWrapperStart}<div class="preview-recalled-message" style="${baseFontStyle}${tStyle}${bgStyle}${shapeStyle}${borderStyle}">${text1}</div>${borderWrapperEnd}</div>`;
        html += `<div class="preview-recalled-message-wrapper">${borderWrapperStart}<div class="preview-recalled-message" style="${baseFontStyle}${tStyle}${bgStyle}${shapeStyle}${borderStyle}">${text2}</div>${borderWrapperEnd}</div>`;
    }

    return html;
}

function generateSystemPreview() {
    const cfg = styleConfig.system;

    
    const fontColorVal = colorPickerRegistry['systemFontColor'] ? cpGetCssValue('systemFontColor') : cfg.color;
    const isFontGradient = colorPickerRegistry['systemFontColor'] && cpIsGradient('systemFontColor');
    
    
    let baseFontStyle = `font-size:${cfg.fontSize}px;`;
    if (cfg.fontWeight && cfg.fontWeight !== 'normal') baseFontStyle += `font-weight:${cfg.fontWeight};`;
    if (cfg.fontFamily) baseFontStyle += `font-family:'${cfg.fontFamily}',-apple-system,sans-serif;`;

    
    let gradientTextStyle = '';
    let solidTextStyle = '';
    
    if (isFontGradient) {
        gradientTextStyle = `background-image:${fontColorVal};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;`;
    } else {
        solidTextStyle = `color:${fontColorVal};`;
    }

    
    let bgStyle = '';
    if (cfg.useColorBg === false) {
        if (cfg.bgUrl) {
            bgStyle = `background:url('${cfg.bgUrl}') center/${cfg.bgSize || 'cover'} no-repeat;`;
        }
    } else {
        if (colorPickerRegistry['systemBgColor']) {
            const bgVal = cpGetCssValue('systemBgColor');
            bgStyle = cpIsGradient('systemBgColor') ? `background:${bgVal};` : `background-color:${bgVal};`;
        }
    }

    
    let shapeStyle = '';
    if (cfg.radius > 0) shapeStyle += `border-radius:${cfg.radius}px;`;
    if (cfg.padX > 0 || cfg.padY > 0) shapeStyle += `padding:${cfg.padY || 0}px ${cfg.padX || 0}px;`;

    
    const shadowVal = spGetCssValue('systemShadow');
    if (shadowVal !== 'none') shapeStyle += `box-shadow:${shadowVal};`;

    let borderStyle = '';
    let borderWrapperStart = '';
    let borderWrapperEnd = '';
    if (cfg.borderWidth > 0) {
        const borderColor = colorPickerRegistry['systemBorderColor'] ? cpGetCssValue('systemBorderColor') : '#ddd';
        const isBorderGradient = colorPickerRegistry['systemBorderColor'] && cpIsGradient('systemBorderColor');
        if (isBorderGradient) {
            borderWrapperStart = `<div style="background:${borderColor}; padding:${cfg.borderWidth}px; border-radius:${(cfg.radius || 0) + cfg.borderWidth}px; display:inline-block; box-shadow:${shadowVal !== 'none'? shadowVal : 'none'};">`;
            borderWrapperEnd = `</div>`;
            shapeStyle = shapeStyle.replace(`box-shadow:${shadowVal};`, '');
        } else {
            borderStyle = `border:${cfg.borderWidth}px solid ${borderColor};`;
        }
    }

    let html = '';
    const text1 = 'EVEChat主题编辑器已收款 ¥70.00';
    const text2 = 'EVEChat戳了戳用户';
    const tStyle = isFontGradient ? '' : solidTextStyle;

    if (isFontGradient) {
        html += `<div class="preview-system-message-wrapper">${borderWrapperStart}<div class="preview-system-message" style="${baseFontStyle}${bgStyle}${shapeStyle}${borderStyle}"><span style="${baseFontStyle}${gradientTextStyle}">${text1}</span></div>${borderWrapperEnd}</div>`;
        html += `<div class="preview-system-message-wrapper">${borderWrapperStart}<div class="preview-system-message" style="${baseFontStyle}${bgStyle}${shapeStyle}${borderStyle}"><span style="${baseFontStyle}${gradientTextStyle}">${text2}</span></div>${borderWrapperEnd}</div>`;
    } else {
        html += `<div class="preview-system-message-wrapper">${borderWrapperStart}<div class="preview-system-message" style="${baseFontStyle}${tStyle}${bgStyle}${shapeStyle}${borderStyle}">${text1}</div>${borderWrapperEnd}</div>`;
        html += `<div class="preview-system-message-wrapper">${borderWrapperStart}<div class="preview-system-message" style="${baseFontStyle}${tStyle}${bgStyle}${shapeStyle}${borderStyle}">${text2}</div>${borderWrapperEnd}</div>`;
    }

    return html;
}


function generateRecalledPreview() {
    const cfg = styleConfig.system;

    const fontColorVal = colorPickerRegistry['systemFontColor'] ? cpGetCssValue('systemFontColor') : cfg.color;
    const isFontGradient = colorPickerRegistry['systemFontColor'] && cpIsGradient('systemFontColor');
    
    let baseFontStyle = `font-size:${cfg.fontSize}px;`;
    if (cfg.fontWeight && cfg.fontWeight !== 'normal') baseFontStyle += `font-weight:${cfg.fontWeight};`;
    if (cfg.fontFamily) baseFontStyle += `font-family:'${cfg.fontFamily}',-apple-system,sans-serif;`;

    let gradientTextStyle = '';
    let solidTextStyle = '';
    
    if (isFontGradient) {
        gradientTextStyle = `background-image:${fontColorVal};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;`;
    } else {
        solidTextStyle = `color:${fontColorVal};`;
    }

    
    let bgStyle = '';
    if (cfg.useColorBg === false) {
        if (cfg.bgUrl) {
            bgStyle = `background:url('${cfg.bgUrl}') center/${cfg.bgSize || 'cover'} no-repeat;`;
        }
    } else {
        if (colorPickerRegistry['systemBgColor']) {
            const bgVal = cpGetCssValue('systemBgColor');
            bgStyle = cpIsGradient('systemBgColor') ? `background:${bgVal};` : `background-color:${bgVal};`;
        }
    }

    let shapeStyle = '';
    if (cfg.radius > 0) shapeStyle += `border-radius:${cfg.radius}px;`;
    if (cfg.padX > 0 || cfg.padY > 0) shapeStyle += `padding:${cfg.padY || 0}px ${cfg.padX || 0}px;`;
    
    const shadowVal = spGetCssValue('systemShadow');
    if (shadowVal !== 'none') shapeStyle += `box-shadow:${shadowVal};`;

    let borderStyle = '';
    let borderWrapperStart = '';
    let borderWrapperEnd = '';
    if (cfg.borderWidth > 0) {
        const borderColor = colorPickerRegistry['systemBorderColor'] ? cpGetCssValue('systemBorderColor') : '#ddd';
        const isBorderGradient = colorPickerRegistry['systemBorderColor'] && cpIsGradient('systemBorderColor');
        if (isBorderGradient) {
            borderWrapperStart = `<div style="background:${borderColor}; padding:${cfg.borderWidth}px; border-radius:${(cfg.radius || 0) + cfg.borderWidth}px; display:inline-block; box-shadow:${shadowVal !== 'none'? shadowVal : 'none'};">`;
            borderWrapperEnd = `</div>`;
            shapeStyle = shapeStyle.replace(`box-shadow:${shadowVal};`, '');
        } else {
            borderStyle = `border:${cfg.borderWidth}px solid ${borderColor};`;
        }
    }

    let html = '';
    const text1 = '你撤回了一条消息';
    const text2 = 'EVEChat主题编辑器撤回了一条消息';
    const tStyle = isFontGradient ? '' : solidTextStyle;

    if (isFontGradient) {
        html += `<div class="preview-recalled-message-wrapper">${borderWrapperStart}<div class="preview-recalled-message" style="${baseFontStyle}${bgStyle}${shapeStyle}${borderStyle}"><span style="${baseFontStyle}${gradientTextStyle}">${text1}</span></div>${borderWrapperEnd}</div>`;
        html += `<div class="preview-recalled-message-wrapper">${borderWrapperStart}<div class="preview-recalled-message" style="${baseFontStyle}${bgStyle}${shapeStyle}${borderStyle}"><span style="${baseFontStyle}${gradientTextStyle}">${text2}</span></div>${borderWrapperEnd}</div>`;
    } else {
        html += `<div class="preview-recalled-message-wrapper">${borderWrapperStart}<div class="preview-recalled-message" style="${baseFontStyle}${tStyle}${bgStyle}${shapeStyle}${borderStyle}">${text1}</div>${borderWrapperEnd}</div>`;
        html += `<div class="preview-recalled-message-wrapper">${borderWrapperStart}<div class="preview-recalled-message" style="${baseFontStyle}${tStyle}${bgStyle}${shapeStyle}${borderStyle}">${text2}</div>${borderWrapperEnd}</div>`;
    }

    return html;
}


function toggleCollapse(header) {
    const section = header.parentElement;
    const wasOpen = section.classList.contains('open');
    section.classList.toggle('open');

    
    if (!wasOpen) {
        const scrollTo = header.getAttribute('data-scroll-to');
        if (scrollTo) {
            setTimeout(() => {
                const container = document.getElementById('previewMessages');
                const target = container.querySelector(`[data-msg-type="${scrollTo}"]`);
                if (target && container) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150);
        }
    }
}


function copyToClipboard(textareaId) {
    const textarea = document.getElementById(textareaId);
    textarea.select();
    document.execCommand('copy');
    showCustomAlert('已复制到剪切板', 'success', '复制成功');
}


function exportToTxt(textareaId) {
    const content = document.getElementById(textareaId).value;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.txt';
    a.click();
    URL.revokeObjectURL(url);
}


function exportToDocx(textareaId) {
    const content = document.getElementById(textareaId).value;
    
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.docx';
    a.click();
    URL.revokeObjectURL(url);
}

// ================================================================
// ==================== 导出 Diff 机制 ====================
// ================================================================
const _sectionInitStates = {};


function _safeStr(obj) {
    try { return JSON.stringify(obj) || ''; }
    catch(e) { return ''; }
}


function _cpSnap(key) {
    const c = colorPickerRegistry[key];
    if (!c) return null;
    return { t: c.type, c: c.color, o: c.opacity, g: c.gradientColors, d: c.direction };
}
function _spSnap(key) {
    const c = shadowPickerRegistry[key];
    if (!c) return null;
    return { e: c.enabled, t: c.type, c: c.color, o: c.opacity, x: c.x, y: c.y, b: c.blur, s: c.spread, d: c.direction, g: c.gradientColors };
}


const _sectionStateExtractors = {
    topBar: () => _safeStr([
        styleConfig.topBar,
        _cpSnap('topBarBg'), _cpSnap('topBarBackColor'), _cpSnap('topBarTitleColor'),
        _cpSnap('topBarOfflineColor'), _cpSnap('topBarMoreColor')
    ]),
    chatArea: () => _safeStr([
        styleConfig.chatArea, _cpSnap('chatAreaBg'), styleConfig.chatArea.bgUrl
    ]),
    avatarMode: () => _safeStr([styleConfig.avatar.displayMode]),
    avatarStyle: () => _safeStr([
        styleConfig.avatar.size, styleConfig.avatar.radius,
        styleConfig.avatar.shadow, styleConfig.avatar.position
    ]),
    bubble: () => _safeStr([
    bubbleConfig.fontSize, bubbleConfig.fontFamily, bubbleConfig.fontWeight,
    bubbleConfig.borderRadius, bubbleConfig.padding, bubbleConfig.margin,
    bubbleConfig.bgImageEnabled, bubbleConfig.bgUrl, bubbleConfig.bgSize, bubbleConfig.bgPosition,
    
    bubbleConfig.textBgEnabled, bubbleConfig.textBgUrl,
    bubbleConfig.textBgWidth, bubbleConfig.textBgHeight,
    bubbleConfig.textBgOffsetX, bubbleConfig.textBgOffsetY,
    bubbleConfig.textBgBlur, bubbleConfig.textBgRadius,
    bubbleConfig.textBgRadialShape, bubbleConfig.textBgRadialRx, bubbleConfig.textBgRadialRy,
    bubbleConfig.textBgRadialCx, bubbleConfig.textBgRadialCy,
    _cpSnap('bubbleSentBg'), _cpSnap('bubbleRecvBg'),
    _cpSnap('fontColor'), _cpSnap('fontColorSent'),
    _cpSnap('textBgColor'),
    _spSnap('bubbleShadow')
]),
    bubbleBorder: () => _safeStr([
        bubbleConfig.borderWidth, bubbleConfig.borderStyle, _cpSnap('bubbleBorderColor')
    ]),
    reply: () => _safeStr([
    bubbleConfig.replyPreset, bubbleConfig.replyPosition, bubbleConfig.replyBarStyle,
    bubbleConfig.replyBarWidth, bubbleConfig.replyBgRadius, bubbleConfig.replyPadding,
    bubbleConfig.replyFontSize, bubbleConfig.replyShowSender, bubbleConfig.replyShowTime,
    bubbleConfig.replyJumpBtnType, bubbleConfig.replyJumpBtnSize,
    bubbleConfig.replyJumpBtnWidth, bubbleConfig.replyJumpBtnHeight,
    bubbleConfig.replyJumpBtnRadius, bubbleConfig.replyFontFamily, bubbleConfig.replyBgUrl,
    bubbleConfig.replyBarPlacement, bubbleConfig.replyBarOffsetX, bubbleConfig.replyBarOffsetY,
    bubbleConfig.replyJumpBtnPlacement, bubbleConfig.replyJumpBtnOffsetX, bubbleConfig.replyJumpBtnOffsetY,
    bubbleConfig.replyBorderWidth, bubbleConfig.replyBorderColor,
    bubbleConfig.replyTimeHideMethod,
    bubbleConfig.replyJumpBtnExternal, bubbleConfig.replyJumpBtnExternalText,
    bubbleConfig.replyJumpBtnExternalPos, bubbleConfig.replyJumpBtnExternalGap,
    bubbleConfig.replyJumpBtnExternalFontSize, bubbleConfig.replyJumpBtnExternalRadius,
    bubbleConfig.replyJumpBtnExternalPadX, bubbleConfig.replyJumpBtnExternalPadY,
    _cpSnap('replyBarColor'), _cpSnap('replyBgColor'), _cpSnap('replySenderColor'),
    _cpSnap('replyTimeColor'), _cpSnap('replyMsgColor'),
    _cpSnap('replyJumpColor'), _cpSnap('replyJumpBg'),
    _cpSnap('replyJumpExtBg'), _cpSnap('replyJumpExtText')
]),
    voice: () => _safeStr([
    bubbleConfig.voiceWaveSource, bubbleConfig.voiceCustomIcon,
    bubbleConfig.voiceWaveStyle, bubbleConfig.voiceWaveCount,
    bubbleConfig.voiceTextPosition, bubbleConfig.voiceTextFontSize,
    bubbleConfig.voiceTextRadius, bubbleConfig.voiceTextBorderWidth, bubbleConfig.voiceTextBgUrl,
    _cpSnap('voiceTextColor'), _cpSnap('voiceTextBg'), _cpSnap('voiceTextBorderColor'),
    _spSnap('voiceTextShadow')
]),
    image: () => _safeStr([
    bubbleConfig.imageShowBubble, bubbleConfig.imageMaxWidth,
    bubbleConfig.imageMaxHeight, bubbleConfig.imageRadius,
    bubbleConfig.descRadius, bubbleConfig.descBorderWidth,
    bubbleConfig.descFontSize, bubbleConfig.descFontFamily,
    bubbleConfig.placeholderType, bubbleConfig.placeholderUrl,
    bubbleConfig.placeholderSvg, bubbleConfig.placeholderEmoji,
    bubbleConfig.placeholderText,
    _cpSnap('imageDescBg'), _cpSnap('imageDescFontColor'), _cpSnap('imageDescBorderColor')
]),
    emoji: () => _safeStr([
        bubbleConfig.emojiShowBubble, bubbleConfig.emojiMaxSize, bubbleConfig.emojiRadius
    ]),
    transfer: () => _safeStr([
    bubbleConfig.transferWidth, bubbleConfig.transferHeight, bubbleConfig.transferRadius,
    bubbleConfig.transferBorderWidth, bubbleConfig.transferBgImageEnabled, bubbleConfig.transferBgUrl,
    bubbleConfig.transferTitleVisible, bubbleConfig.transferAmountVisible,
    bubbleConfig.transferNoteVisible, bubbleConfig.transferStatusVisible,
    bubbleConfig.transferDecorations,
    bubbleConfig.transferTitleX, bubbleConfig.transferTitleY, bubbleConfig.transferTitleLayer,
    bubbleConfig.transferAmountX, bubbleConfig.transferAmountY, bubbleConfig.transferAmountLayer,
    bubbleConfig.transferNoteX, bubbleConfig.transferNoteY, bubbleConfig.transferNoteLayer,
    bubbleConfig.transferStatusX, bubbleConfig.transferStatusY, bubbleConfig.transferStatusLayer,
    bubbleConfig.transferTitleSent, bubbleConfig.transferTitleRecv,
    bubbleConfig.transferAmountSent, bubbleConfig.transferAmountRecv,
    bubbleConfig.transferNoteSent, bubbleConfig.transferNoteRecv,
    bubbleConfig.transferStatusSent, bubbleConfig.transferStatusRecv,
    _cpSnap('transferBg'), _cpSnap('transferBorderColor'), _cpSnap('transferTextColor'),
    _spSnap('transferShadow')
]),
    system: () => _safeStr([
        styleConfig.system,
        _cpSnap('systemBgColor'), _cpSnap('systemFontColor'), _cpSnap('systemBorderColor'),
        _spSnap('systemShadow')
    ]),
    bottomBar: () => _safeStr([
        styleConfig.bottomBar,
        _cpSnap('bottomBarBg'), _cpSnap('bottomBarToolColor'), _cpSnap('bottomBarToolBg'),
        _cpSnap('bottomBarInputBg'), _cpSnap('bottomBarInputBorder'),
        _cpSnap('bottomBarResumeColor'), _cpSnap('bottomBarResumeBg'),
        _cpSnap('bottomBarSendBg'), _cpSnap('bottomBarSendText')
    ]),
    toolbar: () => _safeStr([
        toolbarLayout, toolbarItems,
        _cpSnap('toolbarBgColor'), _cpSnap('toolbarIconColor'), _cpSnap('toolbarLabelColor'),
        _spSnap('toolbarIconShadow')
    ]),
    tail: () => _safeStr([tailConfig, _cpSnap('tailColor')]),
    bubbleDecorations: () => _safeStr(bubbleConfig.bubbleDecorations),
    avatarDecorations: () => _safeStr(decorationItems),
    avatarFrame: () => _safeStr([styleConfig.avatar.frameUrl, styleConfig.avatar.framePosition]),
};

function captureInitialExportStates() {
    for (const key in _sectionStateExtractors) {
        _sectionInitStates[key] = _sectionStateExtractors[key]();
    }
}

function sectionChanged(name) {
    if (!_sectionInitStates[name]) return true; 
    return _sectionStateExtractors[name]() !== _sectionInitStates[name];
}

function anyChanged() {
    for (const key in _sectionStateExtractors) {
        if (sectionChanged(key)) return true;
    }
    return false;
}

// ================================================================
// ==================== [核心更新] 侧边栏 CSS 智能隔离机制 ====================
// ================================================================

// 工具函数：为通用的 CSS 区块自动套上我方/对方特有的选择器前缀
function _scopeCssToSide(cssText, side) {
    if (!cssText) return '';
    const otherSide = side === 'sent' ? 'received' : 'sent';
    const sideClass = '.' + side;
    const otherSideClass = '.' + otherSide;

    return cssText.replace(/([^{]+)\{([^}]+)\}/g, (match, selectorsRaw, rulesRaw) => {
        if (selectorsRaw.trim().startsWith('@')) return match; // 原封不动保留 @keyframes 等动画规则

        let commentPrefix = '';
        selectorsRaw = selectorsRaw.replace(/\/\*[\s\S]*?\*\//g, match => {
            commentPrefix += match + '\n';
            return '';
        });

        let splitSels = selectorsRaw.split(',').map(s => s.trim()).filter(Boolean);
        let validSels = [];

        for (let s of splitSels) {
            // 如果某条规则本来就是为对面写的，直接在这个分支里扔掉它！
            if (s.includes(otherSideClass) || s.includes(':not(' + sideClass + ')')) continue;
            // 如果它本来就指名道姓写了当前分支，保留
            if (s.includes(sideClass)) {
                validSels.push(s);
                continue;
            }

            // 万能作用域：把它归属到当前分支的容器下
            if (s.startsWith('#api-chat-screen')) {
                validSels.push(s.replace('#api-chat-screen ', '#api-chat-screen .message-container.' + side + ' '));
            } else if (s.startsWith('body ')) {
                validSels.push(s.replace('body ', 'body .message-container.' + side + ' '));
            } else {
                validSels.push('.message-container.' + side + ' ' + s + ', .chat-message.' + side + ' ' + s);
            }
        }

        if (validSels.length === 0) return '';
        return commentPrefix + validSels.join(', ') + ' {' + rulesRaw + '}';
    });
}

function generateExportCode() {
    if (Object.keys(_sectionInitStates).length === 0) captureInitialExportStates();
    
    // 拍下当前正在使用层的快照以免被我们破坏
    const backupState = snapshotCore(); 
    
    // ============================================
    // [关键修复] 跨分支变动脏检测：挨个巡查三个分支
    // ============================================
    let isChanged = false;
    ['overall', 'sent', 'received'].forEach(branchName => {
        if (!isChanged && branchDB[branchName]) {
            applyBranch(branchDB[branchName]); // 临时切入此分支
            if (anyChanged()) isChanged = true;
        }
    });

    // 如果三个分支都没变过，才触发未修改警告
    if (!isChanged) {
        applyBranch(backupState); // 恢复界面以免错乱
        const forceExport = confirm('未检测到与默认值的差异。\n\n如果你确实修改了样式，点击"确定"强制导出全部样式。\n点击"取消"返回编辑。');
        if (!forceExport) {
            document.getElementById('exportCodeArea').value = '/* 未检测到任何修改，无需导出 */';
            return;
        }
        // 强制把所有旧状态标志破坏
        for (const key in _sectionInitStates) _sectionInitStates[key] = '__force_changed__';
    }

    let finalSections = [];
    finalSections.push(`/* EVEChat主题编辑器 by qaq*/`);

    const getCol = (k, fall) => colorPickerRegistry[k] ? cpGetCssValue(k) : fall;
    const getShd = (k) => spGetCssValue(k);

    // ============================================
    // 1. 生成全局通用样式 (顶栏、底栏、系统等不可切割内容)
    // ============================================
    applyBranch(branchDB.overall);
    
    const frameUrlEl = document.getElementById('avatar-frame-url');
    if (frameUrlEl && frameUrlEl.value && !styleConfig.avatar.frameUrl) {
        styleConfig.avatar.frameUrl = frameUrlEl.value;
    }
    
    finalSections.push(..._genGlobalSections(getCol, getShd));

    // ============================================
    // 2. 生成【对方】消息样式并附加隔离级 CSS
    // ============================================
    if (branchDB.received) {
        applyBranch(branchDB.received);
        let recvRaw = _genTargetMessageSections(getCol, getShd, 'received');
        let recvScoped = recvRaw.map(css => _scopeCssToSide(css, 'received')).filter(Boolean);
        if (recvScoped.length) {
            finalSections.push('\n\n/* ==================== 对方(Received)专属样式区 ==================== */\n');
            finalSections.push(...recvScoped);
        }
    }

    // ============================================
    // 3. 生成【我方】消息样式并附加隔离级 CSS
    // ============================================
    if (branchDB.sent) {
        applyBranch(branchDB.sent);
        let sentRaw = _genTargetMessageSections(getCol, getShd, 'sent');
        let sentScoped = sentRaw.map(css => _scopeCssToSide(css, 'sent')).filter(Boolean);
        if (sentScoped.length) {
            finalSections.push('\n\n/* ==================== 我方(Sent)专属样式区 ==================== */\n');
            finalSections.push(...sentScoped);
        }
    }

    // 恢复滑块原貌
    applyBranch(backupState);

        // ============================================
    // 4. 重构并清洗输出结果
    // ============================================
    let code = finalSections.join('\n');
    
    // 穿上保护罩：先把头部替换成不会被清除的占位符
    code = code.replace('/* EVEChat主题编辑器 by qaq*/', '====HEADER====');
    
    // 提取板块标题保护
    code = code.replace(/\/\* ========== (.*?) ========== \*\//g, function(match, title) {
        let name = title.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').split(' - ')[0].trim();
        return `\n====MODULE_COMMENT==== ${name} ====`;
    });
    
    // 无差别清理其他杂项注释
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 还原护盾
    code = code.replace(/====MODULE_COMMENT==== (.*?) ====/g, '/* $1 */');
    code = code.replace('====HEADER====', '/* EVEChat主题编辑器 by qaq*/\n'); // 恢复头部
    code = code.replace(/\n\s*\n/g, '\n\n').trim();

    document.getElementById('exportCodeArea').value = code;
    const encryptCodeArea = document.getElementById('encryptCodeArea');
    if (encryptCodeArea) encryptCodeArea.value = code;
    showCustomAlert('已成功生成独立适配的CSS双轨代码！', 'success', '生成成功');
}


// ----------------------------------------------------
// 内部引擎：生成不可切割侧边属性的全局区块
// ----------------------------------------------------
function _genGlobalSections(getColor, getShadow) {
    let sc = styleConfig, sections = [];

    // --- 顶栏 ---
    if (sectionChanged('topBar')) {
        sections.push(`
/* ========== 顶部栏 ========== */
#api-chat-screen .header {
    background-image: ${sc.topBar.container?.bgUrl ? `url('${sc.topBar.container.bgUrl}')` : 'none'} !important;
    ${sc.topBar.container?.bgUrl ? `background-size: cover !important;\n    background-position: center !important;\n    background-repeat: no-repeat !important;` : ''}
    background-color: ${getColor('topBarBg', 'transparent')} !important;
    -webkit-backdrop-filter: blur(20px) !important;
    backdrop-filter: blur(20px) !important;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05) !important;
    height: ${sc.topBar.container?.height || 60}px !important;
    align-items: center !important;
    position: relative !important;
    display: flex !important;
}
#api-chat-screen .back-btn {
    width: 36px !important; height: 36px !important; border-radius: 50% !important;
    background: transparent !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    font-size: ${sc.topBar.backBtn?.size || 28}px !important;
    color: ${getColor('topBarBackColor', '#333')} !important;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
    transform: translate(${sc.topBar.backBtn?.x || 0}px, ${sc.topBar.backBtn?.y || 0}px) !important;
}
#api-chat-screen .header .header-title, #api-chat-screen .header .app-title {
    font-size: ${sc.topBar.title?.size || 18}px !important; 
    font-weight: 600 !important;
    color: ${getColor('topBarTitleColor', '#1d1d1f')} !important;
    flex: 1 !important; text-align: center !important;
    transform: translate(${sc.topBar.title?.x || 0}px, ${sc.topBar.title?.y || 0}px) !important;
    margin: 0 !important; padding: 0 !important;
    position: relative !important; left: auto !important; top: auto !important;
}
#offline-mode-btn {
    width: 36px !important; height: 36px !important; border-radius: 50% !important; border: none !important;
    background: transparent !important;
    font-size: ${sc.topBar.offlineBtn?.size || 22}px !important;
    color: ${getColor('topBarOfflineColor', '#333')} !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    cursor: pointer !important; transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
    transform: translate(${sc.topBar.offlineBtn?.x || 0}px, ${sc.topBar.offlineBtn?.y || 0}px) !important;
}
#more-actions-btn {
    width: 36px !important; height: 36px !important; border-radius: 50% !important;
    background: transparent !important; border: none !important;
    color: ${getColor('topBarMoreColor', '#333')} !important;
    cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
    transform: translate(${sc.topBar.moreBtn?.x || 0}px, ${sc.topBar.moreBtn?.y || 0}px) !important;
}`);
    }

    // --- 聊天区域 ---
    if (sectionChanged('chatArea')) {
        let zoomCss = sc.chatArea.scale && sc.chatArea.scale !== 100 ? `\n    zoom: ${sc.chatArea.scale / 100};` : '';
        sections.push(`
/* ========== 聊天区域 ========== */
#api-chat-screen .chat-messages {
    background: ${getColor('chatAreaBg', '#FFFFFF')};
    padding: ${sc.chatArea.padding.t}px ${sc.chatArea.padding.r}px ${sc.chatArea.padding.b}px ${sc.chatArea.padding.l}px;
    ${sc.chatArea.bgUrl ? `background-image: url('${sc.chatArea.bgUrl}'); background-size: cover; background-position: center;` : ''}${zoomCss}
}`);
    }

    // --- 底栏 ---
    if (sectionChanged('bottomBar')) {
        sections.push(`
/* ========== 底栏大背景 ========== */
#api-chat-screen .input-area, .chat-input-area {
    background: ${sc.bottomBar.container?.bgUrl ? `url('${sc.bottomBar.container.bgUrl}') center/cover no-repeat` : getColor('bottomBarBg', 'rgba(255,255,255,0.95)')} !important;
    -webkit-backdrop-filter: blur(20px) !important; backdrop-filter: blur(20px) !important;
    border-top: ${sc.bottomBar.container?.border || '1px solid rgba(0,0,0,0.05)'} !important; padding: 12px 16px !important; z-index: 100 !important; height: ${sc.bottomBar.container?.height || 120}px !important; box-sizing: border-box !important;
}
.input-controls, .input-container { display: flex !important; align-items: flex-end !important; gap: 8px !important; background: transparent !important; border: none !important; position: relative !important; width: 100% !important; }
.chat-input, #message-input { 
    flex: 1 !important; background: ${getColor('bottomBarInputBg', '#FFFFFF')} !important; border-radius: ${sc.bottomBar.input?.radius !== undefined ? sc.bottomBar.input.radius : 8}px !important; border: ${sc.bottomBar.input?.borderWidth || 0}px solid ${getColor('bottomBarInputBorder', 'transparent')} !important; outline: none !important; padding: 10px 14px !important; font-size: 16px !important; line-height: 1.5 !important; resize: none !important; min-height: 40px !important; max-height: 120px !important; color: #1d1d1f !important; position: relative !important; z-index: 2 !important; box-sizing: border-box !important; box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important; 
}
.input-controls::before, .input-container::before { content: "${sc.bottomBar.input?.placeholder || '我心有所愿'}" !important; position: absolute !important; left: 50px !important; top: 50% !important; transform: translateY(-50%) !important; color: ${sc.bottomBar.input?.placeholderColor || '#999999'} !important; pointer-events: none !important; z-index: 5 !important; font-size: 16px !important; }
.input-controls:focus-within::before, .input-container:focus-within::before { display: none !important; }
#toggle-tools-btn {
    width: ${sc.bottomBar.toolBtn?.width || 32}px !important; height: ${sc.bottomBar.toolBtn?.height || 32}px !important; border-radius: ${sc.bottomBar.toolBtn?.radius || 50}% !important; border: none !important; background: ${getColor('bottomBarToolBg', 'transparent')} !important; color: ${getColor('bottomBarToolColor', '#666666')} !important; font-size: ${sc.bottomBar.toolBtn?.size || 28}px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; transition: all .3s cubic-bezier(.4,0,.2,1) !important; margin-bottom: 4px !important; transform: translate(${sc.bottomBar.toolBtn?.x || 0}px, ${sc.bottomBar.toolBtn?.y || 0}px) !important;
}
#continue-btn, .continue-btn, .chat-action-btn[onclick*="triggerSmartReply"] {
    width: ${sc.bottomBar.resumeBtn?.width || 36}px !important; height: ${sc.bottomBar.resumeBtn?.height || 36}px !important; border-radius: ${sc.bottomBar.resumeBtn?.radius || 50}% !important; background: ${getColor('bottomBarResumeBg', 'transparent')} !important; color: ${getColor('bottomBarResumeColor', '#555555')} !important; display: flex !important; justify-content: center !important; align-items: center !important; border: none !important; cursor: pointer !important; font-size: ${sc.bottomBar.resumeBtn?.size || 32}px !important; flex-shrink: 0 !important; margin-left: 2px !important; z-index: 3 !important; transition: all .3s ease !important; margin-bottom: 2px !important; transform: translate(${sc.bottomBar.resumeBtn?.x || 0}px, ${sc.bottomBar.resumeBtn?.y || 0}px) !important;
}
#send-btn {
    width: ${sc.bottomBar.sendBtn?.width || 50}px !important; height: ${sc.bottomBar.sendBtn?.height || 30}px !important; border-radius: ${sc.bottomBar.sendBtn?.radius !== undefined ? sc.bottomBar.sendBtn.radius : 25}px !important; border: none !important; background: ${getColor('bottomBarSendBg', '#5B9BD5')} !important; color: ${getColor('bottomBarSendText', '#FFFFFF')} !important; font-size: ${sc.bottomBar.sendBtn?.size || 11}px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; transition: all .3s cubic-bezier(.4,0,.2,1) !important; margin-bottom: 5px !important; transform: translate(${sc.bottomBar.sendBtn?.x || 0}px, ${sc.bottomBar.sendBtn?.y || 0}px) !important;
}`);
    }

    // --- 工具栏 ---
    if (sectionChanged('toolbar')) {
        sections.push(`
/* ========== 工具面板 ========== */
.tools-panel {
    background: ${getColor('toolbarBgColor', 'rgba(255,255,255,0.95)')}; backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px); border:1px solid rgba(255,255,255,.2); border-radius:20px;
    margin:8px 12px 12px; padding:${toolbarLayout.padding}px; max-height:${toolbarLayout.maxHeight}px; overflow-y:auto; box-shadow:0 10px 40px rgba(0,0,0,.1); animation:slideUp .3s ease;
}
@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.tools-grid { display:grid; grid-template-columns:repeat(${toolbarLayout.columns},1fr); gap:${toolbarLayout.gap}px; }
.tool-item { display:flex; flex-direction:column; align-items:center; padding:12px 8px; border-radius:16px; background:rgba(255,255,255,.8); cursor:pointer; transition:all .3s cubic-bezier(.4,0,.2,1); border:1px solid rgba(255,255,255,.3); }
.tool-icon {
    width:${toolbarLayout.iconSize}px; height:${toolbarLayout.iconSize}px; border-radius:${toolbarLayout.iconRadius}%;
    background: ${getColor('toolbarIconColor', 'linear-gradient(135deg,#007AFF,#0066DD)')}; display:flex; align-items:center; justify-content:center;
    font-size:20px; color:white; margin-bottom:8px; box-shadow: ${getShadow('toolbarIconShadow')};
}
.tool-label { font-size:${toolbarLayout.labelSize}px; font-weight:500; color: ${getColor('toolbarLabelColor', '#1d1d1f')}; text-align:center; }`);
    }

    // --- 系统消息 ---
    if (sectionChanged('system')) {
        let systemBorderCss = '', systemPseudoCss = '';
        let innerBg = (sc.system.useColorBg === false) ? (sc.system.bgUrl ? `background-image: url('${sc.system.bgUrl}') !important; background-size: ${sc.system.bgSize || 'cover'} !important; background-position: center !important; background-repeat: no-repeat !important;` : 'background-color: transparent !important;') : (colorPickerRegistry['systemBgColor'] ? (cpIsGradient('systemBgColor') ? `background: ${cpGetCssValue('systemBgColor')} !important;` : `background-color: ${cpGetCssValue('systemBgColor')} !important;`) : 'background-color: rgba(0,0,0,0.05) !important;');
        const bw = sc.system.borderWidth || 0; const r = sc.system.radius || 0; const shadowVal = spGetCssValue('systemShadow');
        const borderColor = colorPickerRegistry['systemBorderColor'] ? cpGetCssValue('systemBorderColor') : '#ddd';
        const sysSelectors = `.system-message, .recalled-message, .timestamp, .chat-timestamp, .message-notice, .chat-notice, .action-message, .system-msg, .tip-message, .poke-system-message`;

        if (colorPickerRegistry['systemBorderColor'] && cpIsGradient('systemBorderColor') && bw > 0) {
            systemBorderCss = `position: relative !important; border: none !important; z-index: 1 !important; background-color: transparent !important;`;
            systemPseudoCss = `
${sysSelectors.split(',').map(s=>s.trim()+'::before').join(', ')} { content: '' !important; position: absolute !important; top: -${bw}px !important; left: -${bw}px !important; right: -${bw}px !important; bottom: -${bw}px !important; background: ${borderColor} !important; border-radius: ${r + bw}px !important; z-index: -2 !important; box-shadow: ${shadowVal !== 'none' ? shadowVal : 'none'} !important; -webkit-background-clip: border-box !important; background-clip: border-box !important; -webkit-text-fill-color: currentcolor !important; }
${sysSelectors.split(',').map(s=>s.trim()+'::after').join(', ')} { content: '' !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; ${innerBg} border-radius: ${r}px !important; z-index: -1 !important; -webkit-background-clip: border-box !important; background-clip: border-box !important; -webkit-text-fill-color: currentcolor !important; }`;
        } else {
            systemBorderCss = `position: relative !important; border: none !important; z-index: 1 !important; background-color: transparent !important;`;
            systemPseudoCss = `
${sysSelectors.split(',').map(s=>s.trim()+'::after').join(', ')} { content: '' !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; ${innerBg} border-radius: ${r}px !important; border: ${bw}px solid transparent !important; ${bw > 0 ? `border-color: ${borderColor} !important;` : ''} z-index: -1 !important; box-sizing: border-box !important; box-shadow: ${shadowVal !== 'none' ? shadowVal : 'none'} !important; -webkit-background-clip: border-box !important; background-clip: border-box !important; -webkit-text-fill-color: currentcolor !important; }`;
        }

        const fontColorVal = colorPickerRegistry['systemFontColor'] ? cpGetCssValue('systemFontColor') : '#999';
        const isFontGradient = colorPickerRegistry['systemFontColor'] && cpIsGradient('systemFontColor');
        let fontCss = `padding: ${sc.system.padY || 6}px ${sc.system.padX || 14}px !important; font-size: ${sc.system.fontSize || 12}px !important; ${sc.system.fontWeight && sc.system.fontWeight !== 'normal' ? `font-weight: ${sc.system.fontWeight} !important;` : ''} ${sc.system.fontFamily ? `font-family: '${sc.system.fontFamily}', sans-serif !important;` : ''} text-align: center !important; display: inline-block !important; line-height: 1.5 !important; max-width: 80% !important; margin: 4px auto !important;`;

        if (isFontGradient) fontCss += `background-image: ${fontColorVal} !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important; color: transparent !important;`;
        else fontCss += `color: ${fontColorVal} !important; background-image: none !important;`;

        sections.push(`
/* ========== 系统/通知消息 ========== */
.system-message-wrapper, .recalled-message-wrapper, .poke-system-container { display: flex !important; justify-content: center !important; margin: 16px 0 !important; text-align: center !important; }
.timestamp, .chat-timestamp { margin: 20px auto !important; width: max-content !important; display: block; }
${sysSelectors} { ${fontCss} ${systemBorderCss} }
${isFontGradient ? `${sysSelectors.split(',').map(s=>s.trim()+' *').join(', ')} { background-image: inherit !important; -webkit-background-clip: inherit !important; background-clip: inherit !important; -webkit-text-fill-color: inherit !important; color: inherit !important; }` : `${sysSelectors.split(',').map(s=>s.trim()+' *').join(', ')} { color: inherit !important; }`}
${systemPseudoCss}
.recalled-message { font-style: italic !important; }`);
    }
    return sections;
}

// ----------------------------------------------------
// 内部引擎：生成侧边结构（气泡、头像、引用，以及转账、语音等所有组件的隔离化）
// ----------------------------------------------------
function _genTargetMessageSections(getColor, getShadow, sideObj) {
    let bc = bubbleConfig, sc = styleConfig, sections = [];
    const _getIsolatedCss = (c) => c.unified ? `${c.all}px` : (c.tl !== undefined ? `${c.tl}px ${c.tr}px ${c.br}px ${c.bl}px` : `${c.t}px ${c.r}px ${c.b}px ${c.l}px`);

    // --- 1. 头像 ---
    if (sectionChanged('avatarMode')) {
        const mode = sc.avatar.displayMode || 'all';
        if (mode === 'none') sections.push(`\n.message-avatar, .chat-avatar, .avatar-wrapper { display: none !important; width: 0 !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }\n.message-row { padding-left: 0 !important; padding-right: 0 !important; }\n.message-container { margin-left: 0 !important; margin-right: 0 !important; }`);
        else if (mode === 'first') sections.push(`\n.message-container [class*="avatar"] { visibility: visible !important; }\n.message-container + .message-container [class*="avatar"] { visibility: hidden !important; }`);
        else if (mode === 'last') sections.push(`\n.message-container [class*="avatar"] { visibility: visible !important; }\n.message-container:has(+ .message-container) [class*="avatar"] { visibility: hidden !important; }`);
    }
    if (sectionChanged('avatarStyle')) {
        const av = sc.avatar, posX = av.position?.x || 0, posY = av.position?.y || 0;
        let shadowCss = 'none';
        if (av.shadow.enabled) {
            if (av.shadow.type === 'solid') {
                const r = parseInt(av.shadow.color.slice(1, 3), 16), g = parseInt(av.shadow.color.slice(3, 5), 16), b = parseInt(av.shadow.color.slice(5, 7), 16);
                shadowCss = `${av.shadow.x}px ${av.shadow.y}px ${av.shadow.blur}px ${av.shadow.spread}px rgba(${r},${g},${b},${av.shadow.opacity / 100})`;
            } else if (av.shadow.type === 'gradient') {
                shadowCss = av.shadow.gradientColors.map((c, i) => `${av.shadow.x + i}px ${av.shadow.y + i}px ${av.shadow.blur}px ${av.shadow.spread}px ${c.color}`).join(', ');
            }
        }
        sections.push(`\n/* ========== 头像样式 ========== */\n.message-avatar, .chat-avatar { width: ${av.size}px; height: ${av.size}px; border-radius: ${av.radius}%; box-shadow: ${shadowCss}; ${(posX !== 0 || posY !== 0) ? `position: relative; left: ${posX}px; top: ${posY}px;` : ''} object-fit: cover; }`);
    }

    // --- 2. 气泡骨架与皮肤 ---
    if (sectionChanged('bubble')) {
        const fontColorKey = sideObj === 'sent' ? 'fontColorSent' : 'fontColor';
        const bgKey = sideObj === 'sent' ? 'bubbleSentBg' : 'bubbleRecvBg';
        
        const isTextGrad = colorPickerRegistry[fontColorKey] && cpIsGradient(fontColorKey);
        const bgRaw = getColor(bgKey, '#007AFF');
        const textGrad = isTextGrad ? cpGetCssValue(fontColorKey) : '';
        const textColor = getColor(fontColorKey, '#ffffff');
        let fontSizeKey = sideObj === 'sent' ? (bc.fontSizeSent || bc.fontSize) : (bc.fontSizeRecv || bc.fontSize);

        sections.push(`\n/* ========== 气泡样式 ========== */\n.message-bubble { padding: ${_getIsolatedCss(bc.padding)}; border-radius: ${_getIsolatedCss(bc.borderRadius)}; margin: ${_getIsolatedCss(bc.margin)}; font-size: ${fontSizeKey}px !important; line-height: 1.5; word-break: break-word; box-shadow: ${getShadow('bubbleShadow')}; transition: all 0.2s ease; position: relative; overflow: visible; ${bc.fontFamily ? `font-family: '${bc.fontFamily}', -apple-system, sans-serif !important;` : ''} ${bc.fontWeight && bc.fontWeight !== 'normal' ? `font-weight: ${bc.fontWeight} !important;` : ''} ${bc.bgImageEnabled && bc.bgUrl ? `background-image: url('${bc.bgUrl}') !important; background-size: ${bc.bgSize} !important; background-position: ${bc.bgPosition} !important; background-repeat: no-repeat !important;` : ''} }`);
        
        if (isTextGrad) {
            sections.push(`\n.message-bubble:not(.emoji-bubble):not(.image-bubble):not(.voice-message):not(.preview-voice-message) { background-color: transparent !important; background-image: none !important; box-shadow: none !important; background: ${textGrad} text, ${bgRaw} !important; -webkit-background-clip: text, padding-box !important; background-clip: text, padding-box !important; -webkit-text-fill-color: transparent !important; color: transparent !important; display: inline-block !important; }\n.message-bubble.emoji-bubble, .message-bubble.image-bubble, .voice-message { background: ${bgRaw} !important; -webkit-background-clip: padding-box !important; background-clip: padding-box !important; -webkit-text-fill-color: #333 !important; color: #333 !important; }\n.voice-wave .wave-bar, .voice-duration { -webkit-text-fill-color: currentColor !important; color: inherit !important; background: none !important; }`);
        } else {
            sections.push(`\n.message-bubble { background: ${bgRaw} !important; color: ${textColor} !important; -webkit-text-fill-color: ${textColor} !important; }`);
        }
        
        if (bc.textBgEnabled) {
            let textBgGradient = bc.textBgUrl ? `url('${bc.textBgUrl}')` : getColor('textBgColor', 'transparent');
            if (textBgGradient && textBgGradient !== 'transparent') {
                const w = bc.textBgWidth > 0 ? bc.textBgWidth + 'px' : '100%', h = bc.textBgHeight > 0 ? bc.textBgHeight + 'px' : '100%', ox = bc.textBgOffsetX || 0, oy = bc.textBgOffsetY || 0, posX = ox === 0 ? 'center' : `calc(50% + ${ox}px)`, posY = oy === 0 ? 'center' : `calc(50% + ${oy}px)`;
                sections.push(`\n.message-bubble { background: ${textBgGradient}, ${bgRaw} !important; background-size: ${w} ${h}, 100% 100% !important; background-position: ${posX} ${posY}, center !important; background-repeat: no-repeat, no-repeat !important; }`);
            }
        }
    }
    if (sectionChanged('bubbleBorder')) {
        const bw = bc.borderWidth;
        if (bw.unified ? bw.all > 0 : (bw.t > 0 || bw.r > 0 || bw.b > 0 || bw.l > 0)) {
            const borderColor = getColor('bubbleBorderColor', '#cccccc');
            const borderWidthVal = bw.unified ? bw.all + 'px' : `${bw.t}px ${bw.r}px ${bw.b}px ${bw.l}px`;
            sections.push(`\n/* ========== 气泡边框 ========== */\n.message-bubble { border-style: ${bc.borderStyle} !important; border-width: ${borderWidthVal} !important; ${(colorPickerRegistry['bubbleBorderColor'] && cpIsGradient('bubbleBorderColor')) ? `border-color: transparent !important; border-image: ${borderColor} 1 !important;` : `border-color: ${borderColor} !important;`} }`);
        }
    }
    
    // --- 3. 引用回复 ---
    if (sectionChanged('reply')) {
        let externalJumpCss = '', internalJumpCss = '';
        if (bc.replyJumpBtnType !== 'none') {
            if (bc.replyJumpBtnExternal) {
                const extBg = getColor('replyJumpExtBg', 'linear-gradient(135deg, #7B68EE, #4A90D9)'), extTextColor = getColor('replyJumpExtText', '#FFFFFF'), isExtTextGrad = colorPickerRegistry['replyJumpExtText'] && cpIsGradient('replyJumpExtText'), extPos = bc.replyJumpBtnExternalPos || 'right', extGap = bc.replyJumpBtnExternalGap !== undefined ? bc.replyJumpBtnExternalGap : 6;
                let extTextCss = isExtTextGrad ? `background-image: ${extTextColor} !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; color: transparent !important;` : `color: ${extTextColor} !important; -webkit-text-fill-color: ${extTextColor} !important;`;
                let posStyle = '';
                if (extPos === 'right') posStyle = `top: 50% !important; left: 100% !important; transform: translateY(-50%) !important; margin-left: ${extGap}px !important;`; else if (extPos === 'left') posStyle = `top: 50% !important; right: 100% !important; transform: translateY(-50%) !important; margin-right: ${extGap}px !important;`; else if (extPos === 'top') posStyle = `bottom: 100% !important; left: 50% !important; transform: translateX(-50%) !important; margin-bottom: ${extGap}px !important;`; else if (extPos === 'bottom') posStyle = `top: 100% !important; left: 50% !important; transform: translateX(-50%) !important; margin-top: ${extGap}px !important;`;
                externalJumpCss = `\n::after.reply-reference, .quote-message::after { content: "${bc.replyJumpBtnExternalText || '跳转'}" !important; display: flex !important; align-items: center !important; justify-content: center !important; position: absolute !important; ${posStyle} padding: ${bc.replyJumpBtnExternalPadY || 3}px ${bc.replyJumpBtnExternalPadX || 10}px !important; font-size: ${bc.replyJumpBtnExternalFontSize || 11}px !important; font-weight: 600 !important; ${extTextCss} background: ${extBg} !important; border-radius: ${bc.replyJumpBtnExternalRadius || 4}px !important; white-space: nowrap !important; pointer-events: none !important; z-index: 51 !important; }\n.reply-reference .reply-jump-btn, .reply-jump-btn { position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; height: 100% !important; opacity: 0 !important; cursor: pointer !important; z-index: 10 !important; background: transparent !important; border: none !important; }\n.reply-jump-btn * { display: none !important; }`;
            } else {
                const jumpColor = getColor('replyJumpColor', '#BCBCBC'), jumpBg = getColor('replyJumpBg', 'transparent'), jumpPlacement = bc.replyJumpBtnPlacement || 'inside', jumpOffX = bc.replyJumpBtnOffsetX || 0, jumpOffY = bc.replyJumpBtnOffsetY || 0;
                let jumpFgCss = (colorPickerRegistry['replyJumpColor'] && cpIsGradient('replyJumpColor')) ? `background-image: ${jumpColor} !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; color: transparent !important;` : `color: ${jumpColor} !important; -webkit-text-fill-color: ${jumpColor} !important;`;
                let jumpPosCss = jumpPlacement === 'inside' ? `right: 8px !important; left: auto !important; top: 50% !important; transform: translate(${jumpOffX}px, calc(-50% + ${jumpOffY}px)) !important;` : `left: 100% !important; right: auto !important; top: 50% !important; transform: translate(${4 + parseInt(jumpOffX)}px, calc(-50% + ${jumpOffY}px)) !important;`;
                let btnContentCss = `\n.reply-jump-btn * { opacity: 0 !important; color: transparent !important; pointer-events: auto !important; }\n.reply-jump-btn::before { display: flex !important; align-items: center !important; justify-content: center !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; pointer-events: none !important; z-index: 1 !important; }`;
                if (bc.replyJumpBtnType === 'text') btnContentCss += `.reply-jump-btn::before { content: "${bc.replyJumpBtnText || '↑'}" !important; font-size: ${bc.replyJumpBtnSize || 16}px !important; font-weight: bold !important; ${jumpFgCss} }`; else if (bc.replyJumpBtnType === 'image' && bc.replyJumpBtnUrl) btnContentCss += `.reply-jump-btn::before { content: "" !important; background: url('${bc.replyJumpBtnUrl}') center/contain no-repeat !important; }`; else btnContentCss += `.reply-jump-btn::before { content: "➣" !important; font-size: ${bc.replyJumpBtnSize || 16}px !important; ${jumpFgCss} }`;
                internalJumpCss = `\n.reply-jump-btn { position: absolute !important; ${jumpPosCss} width: ${bc.replyJumpBtnWidth || 24}px !important; height: ${bc.replyJumpBtnHeight || 24}px !important; border: none !important; background: ${jumpBg} !important; border-radius: ${bc.replyJumpBtnRadius || 0}% !important; cursor: pointer !important; z-index: 10 !important; padding: 0 !important; overflow: visible !important; }\n${btnContentCss}`;
            }
        } else { internalJumpCss = `\n.reply-jump-btn { display: none !important; }`; }

        if (bc.replyPreset === 'telegram') {
            sections.push(`/* ========== 引用消息 ========== */\n.reply-reference, .quote-message { margin-bottom: 4px; padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 13px; position: relative; border-left: 2px solid #3390ec; cursor: pointer; overflow: hidden; ${bc.replyFontFamily ? `font-family: '${bc.replyFontFamily}', sans-serif;` : ''} }\n.reply-reference-sender { font-weight: 600; color: #3390ec; font-size: 12px; line-height: 1.3; }\n.reply-reference-time { display: none !important; }\n.reply-reference-message { color: #8b8e91; line-height: 1.3; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }\n.reply-jump-btn * { display: none !important; }\n.reply-reference::before { display: none !important; }\n.reply-reference-header { display: none !important; }`);
        } else if (bc.replyPreset === 'wechat' || bc.replyPosition === 'outside-bottom') {
            let wechatCss = `\n/* ========== 引用消息 ========== */\n.message-bubble { overflow: visible !important; position: relative !important; }\n.reply-reference, .quote-message { position: absolute !important; bottom: 0 !important; transform: translateY(calc(100% + 6px)) !important; left: auto !important; right: 0 !important; z-index: 50 !important; margin: 0 !important; padding: ${bc.replyPadding || 7}px 12px !important; background: ${getColor('replyBgColor', '#F7F7F7')} !important; border: ${bc.replyBorderWidth || 0.7}px solid ${bc.replyBorderColor || '#E6E6E6'} !important; border-radius: ${bc.replyBgRadius || 3}px !important; max-width: 280px !important; width: max-content !important; cursor: pointer !important; display: flex !important; flex-wrap: nowrap !important; box-sizing: border-box !important; ${bc.replyFontFamily ? `font-family: '${bc.replyFontFamily}', sans-serif;` : ''} }\n.reply-reference .reply-reference-content, .quote-message .quote-content-wrapper { display: flex !important; flex-wrap: nowrap !important; align-items: center !important; flex: 1 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }\n.reply-reference-sender, .quote-sender { display: inline-block !important; color: ${getColor('replySenderColor', '#727272')} !important; font-size: ${bc.replyFontSize || 12}px !important; white-space: nowrap !important; }\n.reply-reference-message, .quote-content { display: inline !important; color: ${getColor('replyMsgColor', '#727272')} !important; font-size: ${bc.replyFontSize || 12}px !important; flex: 1 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }\n.reply-reference-message::before, .quote-content::before { content: "：" !important; word-spacing: normal !important; color: ${getColor('replyMsgColor', '#727272')} !important; }\n.reply-reference::before { display: none !important; } .reply-reference-time { display: none !important; } .reply-reference-header { display: none !important; }\n.message-container:has(.reply-reference) { margin-bottom: 42px !important; position: relative !important; } .message-container:has(.reply-reference) + .message-container { margin-top: 5px !important; } .message-container:has(.reply-reference):last-child { margin-bottom: 50px !important; }`;
            if (bc.replyBarStyle === 'line') wechatCss += `\n.reply-reference::before, .quote-message::before { display: block !important; content: "" !important; width: ${bc.replyBarWidth || 3}px !important; min-height: 100% !important; background: ${getColor('replyBarColor', '#007AFF')} !important; margin-right: 8px !important; }`;
            sections.push(wechatCss + externalJumpCss + internalJumpCss);
        } else if (bc.replyPosition === 'outside-above') {
            const barColor = getColor('replyBarColor', '#007AFF'), senderColor = getColor('replySenderColor', '#727272'), msgColor = getColor('replyMsgColor', '#727272');
            let barCss = bc.replyBarStyle === 'line' ? `.reply-reference::before, .quote-message::before { content: '' !important; display: block !important; width: ${bc.replyBarWidth || 3}px !important; background: ${barColor} !important; margin-right: 8px !important; flex-shrink: 0 !important; align-self: stretch !important; }` : `.reply-reference::before { display: none !important; }`;
            let timeCss = bc.replyShowTime !== false ? `.reply-reference-time, .quote-time { font-size: ${Math.max(9, (bc.replyFontSize || 12) - 2)}px !important; color: ${getColor('replyTimeColor', '#999')} !important; margin-left: auto !important; }` : `.reply-reference-time { display: none !important; }`;
            let senderCss = bc.replyShowSender !== false ? `.reply-reference-sender, .quote-sender { font-size: ${bc.replyFontSize || 12}px !important; font-weight: 600 !important; margin-right: 8px !important; color: ${senderColor} !important; }` : `.reply-reference-sender { display: none !important; }`;
            sections.push(`/* ========== 引用消息 ========== */\n.message-bubble { overflow: visible !important; position: relative !important; }\n.reply-reference, .quote-message { position: absolute !important; top: 0 !important; transform: translateY(calc(-100% - 6px)) !important; left: auto !important; right: 0 !important; z-index: 50 !important; margin: 0 !important; padding: ${bc.replyPadding || 6}px ${(bc.replyPadding || 6) + 4}px !important; background: ${getColor('replyBgColor', '#F7F7F7')} !important; border: ${bc.replyBorderWidth || 0}px solid ${bc.replyBorderColor || '#E6E6E6'} !important; border-radius: ${bc.replyBgRadius || 6}px !important; box-sizing: border-box !important; display: flex !important; align-items: stretch !important; min-height: 34px !important; ${bc.replyFontFamily ? "font-family: '" + bc.replyFontFamily + "', sans-serif;" : ''} }\n.reply-reference .reply-reference-content { display: flex !important; flex-direction: column !important; justify-content: center !important; gap: 2px !important; flex: 1 !important; min-width: 0 !important; }\n.reply-reference-header { display: flex !important; align-items: center !important; margin-bottom: 2px !important; }\n${senderCss} ${timeCss}\n.reply-reference-message { font-size: ${bc.replyFontSize || 12}px !important; line-height: 1.3 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; color: ${msgColor} !important; }\n${barCss} ${externalJumpCss} ${internalJumpCss}\n.message-container:has(.reply-reference) { margin-top: 42px !important; } .message-container:has(.reply-reference):first-child { margin-top: 50px !important; }`);
        } else {
            const senderColorVal = getColor('replySenderColor', '#333'), timeColorVal = getColor('replyTimeColor', '#999'), msgColorVal = getColor('replyMsgColor', '#666');
            let senderCss = bc.replyShowSender !== false ? `\n.reply-reference-sender, .quote-sender { font-weight: 600 !important; font-size: ${Math.max(10, (bc.replyFontSize || 12) - 1)}px !important; color: ${senderColorVal} !important; }` : `\n.reply-reference-sender { display: none !important; }`;
            let timeCss = bc.replyShowTime !== false ? `\n.reply-reference-time, .quote-time { font-size: ${Math.max(9, (bc.replyFontSize || 12) - 2)}px !important; margin-left: 8px !important; color: ${timeColorVal} !important; }` : `\n.reply-reference-time { display: none !important; }`;
            let borderAndBarCss = '', pseudoBarCss = '';
            if (bc.replyBarStyle === 'line') {
                const barPlacement = bc.replyBarPlacement || 'inside', barOffX = parseInt(bc.replyBarOffsetX) || 0, barOffY = parseInt(bc.replyBarOffsetY) || 0, barW = bc.replyBarWidth || 3, barC = getColor('replyBarColor', '#007AFF');
                if (barPlacement === 'inside' && barOffX === 0 && barOffY === 0) { borderAndBarCss = `border-left: ${barW}px solid ${barC} !important;`; } else {
                    let posCss = barPlacement === 'inside' ? `left: ${6 + barOffX}px !important; top: ${8 + barOffY}px !important; bottom: ${8 - barOffY}px !important;` : `left: ${-barW + barOffX - 4}px !important; top: ${barOffY}px !important; bottom: ${-barOffY}px !important;`;
                    borderAndBarCss = barPlacement === 'inside' ? `padding-left: ${6 + barW + 4}px !important; border-left: none !important;` : `border-left: none !important;`;
                    pseudoBarCss = `\n.reply-reference::before { content: '' !important; display: block !important; position: absolute !important; width: ${barW}px !important; background: ${barC} !important; border-radius: ${barW / 2}px !important; ${posCss} z-index: 10 !important; }`;
                }
            } else { borderAndBarCss = 'border-left: none !important;'; pseudoBarCss = `\n.reply-reference::before { display: none !important; }`; }

            sections.push(`/* ========== 引用消息 ========== */\n.message-bubble { overflow: visible !important; }\n.reply-reference, .quote-message { margin-bottom: 8px !important; padding: ${bc.replyPadding || 6}px ${(bc.replyPadding || 6) + 4}px !important; background: ${getColor('replyBgColor', '#F3F3F3')} !important; border-radius: ${bc.replyBgRadius || 6}px !important; font-size: ${bc.replyFontSize || 12}px !important; position: relative !important; overflow: visible !important; border: ${bc.replyBorderWidth || 0}px solid ${bc.replyBorderColor || '#E6E6E6'} !important; ${borderAndBarCss} ${bc.replyFontFamily ? `font-family: '${bc.replyFontFamily}', sans-serif !important;` : ''} }\n${pseudoBarCss}\n${senderCss}\n${timeCss}\n.reply-reference-message { line-height: 1.4 !important; font-size: ${bc.replyFontSize || 12}px !important; color: ${msgColorVal} !important; }${externalJumpCss}${internalJumpCss}`);
        }
    }

    // --- 4. 图片消息 ---
    if (sectionChanged('image')) {
        sections.push(`
/* ========== 图片与描述 ========== */
.message-image {
    max-width:${bc.imageMaxWidth || 150}px; max-height:${bc.imageMaxHeight || 150}px;
    border-radius:${bc.imageRadius || 10}px; cursor:pointer; object-fit:cover; display:block; box-shadow:0 2px 8px rgba(0,0,0,.1);
}
.message-bubble.image-bubble { padding:4px; display:inline-block; }
.message-bubble.image-bubble .message-image { border-radius:${Math.max(0, (bc.imageRadius || 10) - 4)}px; }
.photo-text-overlay {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${getColor('imageDescBg', 'rgba(255, 255, 255, 0.95)')}; backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 3; border-radius: ${bc.descRadius || 10}px;
    ${(bc.descBorderWidth || 0) > 0 ? (colorPickerRegistry['imageDescBorderColor'] && cpIsGradient('imageDescBorderColor') ? `border: ${bc.descBorderWidth}px solid transparent; border-image: ${getColor('imageDescBorderColor', '#ddd')} 1;` : `border: ${bc.descBorderWidth}px solid ${getColor('imageDescBorderColor', '#ddd')};`) : ''}
}`);
    }
    
    // --- 5. 表情包 ---
    if (sectionChanged('emoji')) {
        sections.push(`
/* ========== 表情包 ========== */
.message-emoji { max-width:${bc.emojiMaxSize || 100}px; max-height:${bc.emojiMaxSize || 100}px; border-radius:${bc.emojiRadius || 8}px; cursor:pointer; display:block; }
.message-bubble.emoji-bubble { padding:6px; display:inline-block; }
${!bc.emojiShowBubble ? '\n.message-bubble.emoji-bubble { background: none !important; box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; }' : ''}`);
    }

    // --- 6. 语音消息 (支持自定义/多波形) ---
    if (sectionChanged('voice')) {
        const waveCount = bc.voiceWaveCount || 4, voiceSource = bc.voiceWaveSource || 'builtin';
        const hideOriginal = `.voice-wave, .voice-wave .wave-bar, .voice-message-bar .voice-icon { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; }`;
        const voiceContainerCss = `.voice-message, .voice-message-bar { display: flex !important; align-items: center !important; padding: 3px 7px !important; border-radius: 13px !important; min-width: 49px !important; max-width: 99px !important; cursor: pointer !important; position: relative !important; }`;
        const textBgGrad = colorPickerRegistry['voiceTextBg'] && cpIsGradient('voiceTextBg') ? `background: ${getColor('voiceTextBg', 'rgba(255,255,255,0.95)')} !important;` : `background-color: ${getColor('voiceTextBg', 'rgba(255,255,255,0.95)')} !important;`;
        
        let buildPseudoCss = (svgData, waveW, waveH) => `
/* ========== 语音伪元素增强 ========== */
${hideOriginal} ${voiceContainerCss}
.voice-message::before { content: '' !important; display: block !important; width: ${waveW}px !important; height: ${waveH}px !important; flex-shrink: 0 !important; margin: 0 4px !important; background-image: url("data:image/svg+xml,${svgData}") !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; }
.voice-text-content { display: none !important; margin-top: 3px !important; padding: 5px 9px !important; ${textBgGrad} border-radius: ${bc.voiceTextRadius || 11}px !important; font-size: ${bc.voiceTextFontSize || 12}px !important; line-height: 1.4 !important; color: ${getColor('voiceTextColor', '#333')} !important; box-shadow: ${getShadow('voiceTextShadow')} !important; width: fit-content !important; max-width: 145px !important; ${(bc.voiceTextBorderWidth || 0) > 0 ? `border: ${bc.voiceTextBorderWidth}px solid ${getColor('voiceTextBorderColor', 'rgba(0,0,0,0.06)')} !important;` : `border: 1px solid rgba(0,0,0,0.06) !important;`} }`;

        if (voiceSource === 'custom' && bc.voiceCustomIcon && bc.voiceCustomIcon.url) {
            const icon = bc.voiceCustomIcon;
            if (icon.renderMode === 'mask') {
                sections.push(`
/* ========== 语音消息 (自定义面具) ========== */
${hideOriginal} ${voiceContainerCss}
.voice-message::before { content: '' !important; display: block !important; width: ${icon.width}px !important; height: ${icon.height}px !important; flex-shrink: 0 !important; margin: 0 3px !important; background-color: currentColor !important; -webkit-mask-image: url('${icon.url}') !important; mask-image: url('${icon.url}') !important; -webkit-mask-size: contain !important; mask-size: contain !important; mask-repeat: no-repeat !important; mask-position: center !important; }
.voice-text-content { display: none !important; margin-top: 3px !important; padding: 5px 9px !important; ${textBgGrad} border-radius: ${bc.voiceTextRadius || 11}px !important; font-size: ${bc.voiceTextFontSize || 12}px !important; color: ${getColor('voiceTextColor', '#333')} !important; }`);
            } else {
                sections.push(`/* ========== 语音消息 (自定义图片) ========== */\n${hideOriginal} ${voiceContainerCss}\n.voice-message::before { content: '' !important; display: block !important; width: ${icon.width}px !important; height: ${icon.height}px !important; flex-shrink: 0 !important; margin: 0 3px !important; background-image: url('${icon.url}') !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; }`);
            }
        } else {
            let waveW = Math.max(30, waveCount * 5 + 4), curColor = (sideObj === 'sent' && colorPickerRegistry['fontColorSent']) ? getColor('fontColorSent', 'rgba(255,255,255,0.9)') : 'currentcolor';
            let bars = '';
            for (let i = 0; i < waveCount; i++) {
                const h = [8, 14, 6, 12, 16][i%5], x = i * 5 + 1;
                bars += `<rect x='${x}' y='${(20-h)/2}' width='3' height='${h}' rx='1.5' fill='${curColor}'/>`;
            }
            let svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${waveW} 20'>${bars}</svg>`);
            sections.push(buildPseudoCss(svg, waveW, 16));
        }
    }

    // --- 7. 转账卡片 ---
    if (sectionChanged('transfer')) {
        let titleBlock = bc.transferTitleVisible === false ? `\n.transfer-title { display: none !important; }` : `
.transfer-title { 
    font-size:12px !important; color:#666 !important; margin-bottom:8px !important;
    position: relative !important; transform: translate(${bc.transferTitleX || 0}px, ${bc.transferTitleY || 0}px) !important;
    z-index: ${bc.transferTitleLayer === 'before' ? 0 : 10} !important;
}
${bc.transferTitleSent !== '💕 你发起的转账' ? `\n.message-container.sent .transfer-title { font-size: 0 !important; }\n.message-container.sent .transfer-title::after { content: "${bc.transferTitleSent}" !important; font-size: 12px !important; }` : ''}
${bc.transferTitleRecv !== '💖 收到转账' ? `\n.message-container.received .transfer-title { font-size: 0 !important; }\n.message-container.received .transfer-title::after { content: "${bc.transferTitleRecv}" !important; font-size: 12px !important; }` : ''}`;

        let amountBlock = bc.transferAmountVisible === false ? `\n.transfer-amount { display: none !important; }` : `
.transfer-amount { 
    font-size:26px !important; font-weight:bold !important; margin-bottom:8px !important;
    position: relative !important; transform: translate(${bc.transferAmountX || 0}px, ${bc.transferAmountY || 0}px) !important;
    z-index: ${bc.transferAmountLayer === 'before' ? 0 : 10} !important;
    ${colorPickerRegistry['transferTextColor'] && cpIsGradient('transferTextColor') ? `background-image: ${getColor('transferTextColor', '#333')} !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important; color: transparent !important; display: inline-block !important;` : `color: ${getColor('transferTextColor', '#333')} !important; -webkit-text-fill-color: ${getColor('transferTextColor', '#333')} !important;`}
}`;

        let noteBlock = bc.transferNoteVisible === false ? `\n.transfer-note { display: none !important; }` : `
.transfer-note { 
    font-size:13px !important; color:#666 !important; flex:1 !important;
    position: relative !important; transform: translate(${bc.transferNoteX || 0}px, ${bc.transferNoteY || 0}px) !important;
    z-index: ${bc.transferNoteLayer === 'before' ? 0 : 10} !important;
}
${bc.transferNoteSent !== '转账' ? `\n.message-container.sent .transfer-note { font-size: 0 !important; }\n.message-container.sent .transfer-note::after { content: "${bc.transferNoteSent}" !important; font-size: 13px !important; }` : ''}
${bc.transferNoteRecv !== '爱你么么哒' ? `\n.message-container.received .transfer-note { font-size: 0 !important; }\n.message-container.received .transfer-note::after { content: "${bc.transferNoteRecv}" !important; font-size: 13px !important; }` : ''}`;

        let statusBlock = bc.transferStatusVisible === false ? `\n.transfer-status { display: none !important; }` : `
.transfer-status { 
    font-size:11px !important; color:#999 !important; text-align:right !important;
    position: relative !important; transform: translate(${bc.transferStatusX || 0}px, ${bc.transferStatusY || 0}px) !important;
    z-index: ${bc.transferStatusLayer === 'before' ? 0 : 10} !important;
}
${bc.transferStatusSent !== '对方已收款' ? `\n.message-container.sent .transfer-status { font-size: 0 !important; }\n.message-container.sent .transfer-status::after { content: "${bc.transferStatusSent}" !important; font-size: 11px !important; }` : ''}
${bc.transferStatusRecv !== '已收款' ? `\n.message-container.received .transfer-status { font-size: 0 !important; }\n.message-container.received .transfer-status::after { content: "${bc.transferStatusRecv}" !important; font-size: 11px !important; }` : ''}`;

        let bgStyle = '', borderStyle = '';
        if (bc.transferBgImageEnabled && bc.transferBgUrl) {
            bgStyle = `background: url('${bc.transferBgUrl}') center/cover no-repeat !important;`;
        } else {
            bgStyle = `background: ${getColor('transferBg', '#FFE5E5')} !important;`;
        }
        if (bc.transferBorderWidth > 0) {
            borderStyle = cpIsGradient('transferBorderColor') ? `border: ${bc.transferBorderWidth}px solid transparent !important; border-image: ${getColor('transferBorderColor', '#ddd')} 1 !important;` : `border: ${bc.transferBorderWidth}px solid ${getColor('transferBorderColor', '#ddd')} !important;`;
        }

        let decoCss = '';
        if (bc.transferDecorations && bc.transferDecorations.length > 0) {
            let validDecos = bc.transferDecorations.filter(d => d.img);
            let beforeUsed = false, afterUsed = false;
            validDecos.forEach(d => {
                let pseudoSel = '';
                if (d.pseudo === 'before' && !beforeUsed) { pseudoSel = '::before'; beforeUsed = true; }
                else if (d.pseudo !== 'before' && !afterUsed) { pseudoSel = '::after'; afterUsed = true; }
                else return;
                
                let dPos = d.anchor.includes('top') ? `top:${d.y}px !important;` : (d.anchor.includes('bottom') ? `bottom:${-d.y}px !important;` : `top:calc(50% + ${d.y}px) !important;`);
                dPos += d.anchor.includes('left') ? `left:${d.x}px !important;` : (d.anchor.includes('right') ? `right:${-d.x}px !important;` : `left:calc(50% + ${d.x}px) !important;`);
                
                decoCss += `\n.transfer-card${pseudoSel} { content: '' !important; display: block !important; position: absolute !important; ${dPos} width: ${d.size}px !important; height: ${d.size}px !important; background-image: url('${d.img}') !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; pointer-events: none !important; z-index: ${d.pseudo === 'before' ? 0 : 20} !important; }`;
            });
        }

        sections.push(`
/* ========== 转账卡片 ========== */
.transfer-card {
    ${bgStyle} ${borderStyle} border-radius: ${bc.transferRadius || 12}px !important; padding: 14px 16px !important; box-shadow: ${getShadow('transferShadow')} !important; width: ${bc.transferWidth || 220}px !important; height: ${bc.transferHeight || 110}px !important; display: flex !important; flex-direction: column !important; position: relative !important; overflow: visible !important; box-sizing: border-box !important; z-index: 1 !important;
}
${decoCss} ${titleBlock} ${amountBlock} ${noteBlock} ${statusBlock}`);
    }

    // --- 8. 气泡小尾巴 ---
    if (sectionChanged('tail') && tailConfig.enabled) {
        let tc = tailConfig, bgKey = sideObj === 'sent' ? 'bubbleSentBg' : 'bubbleRecvBg';
        let fillColor = undefined;
        if (colorPickerRegistry['tailColor']) {
            fillColor = colorPickerRegistry['tailColor'].type === 'solid' ? colorPickerRegistry['tailColor'].color : undefined;
        }
        let tailImgSrc = (tc.preset === 'custom' && tc.imgUrl) ? tc.imgUrl : (tailPresets[tc.preset] ? tailPresets[tc.preset](fillColor || getColor(bgKey, '#007AFF'), '') : '');
        let sentPos = '';
        if (tc.anchor.includes('bottom')) sentPos += `bottom:${tc.offsetY}px;`; else if (tc.anchor.includes('top')) sentPos += `top:${tc.offsetY}px;`;
        if (tc.anchor.includes('right')) sentPos += `right:${-tc.width + tc.offsetX}px;`; else if (tc.anchor.includes('left')) sentPos += `left:${-tc.width + tc.offsetX}px;`;
        
        let mirrorTransform = (sideObj === 'received' && tc.autoMirror) ? 'transform: scaleX(-1) !important;' : '';
        sections.push(`/* ========== 气泡小尾巴 ========== */\n.message-bubble { position: relative !important; overflow: visible !important; }\n.message-bubble::${tc.pseudo === 'before' ? 'before' : 'after'} { content: '' !important; display: block !important; position: absolute !important; ${sentPos} width: ${tc.width}px !important; height: ${tc.height}px !important; background-image: url("${tailImgSrc}") !important; background-size: contain !important; background-repeat: no-repeat !important; pointer-events: none !important; z-index: ${tc.pseudo === 'before' ? 0 : 10} !important; ${mirrorTransform} }`);
    }

    // --- 9. 气泡装饰 ---
    if (sectionChanged('bubbleDecorations') && bc.bubbleDecorations && bc.bubbleDecorations.length > 0) {
        const slots = { 'before': null, 'after': null, 'inner-before': null, 'inner-after': null };
        bc.bubbleDecorations.filter(d => d.img).forEach(d => { if (!slots[d.pseudo || 'after']) slots[d.pseudo || 'after'] = d; });
        const buildPos = d => { let p=''; if (d.anchor.includes('top')) p+=`top:${d.y}px;`; if(d.anchor.includes('bottom')) p+=`bottom:${-d.y}px;`; if(d.anchor.includes('left')) p+=`left:${d.x}px;`; if(d.anchor.includes('right')) p+=`right:${-d.x}px;`; return p; };
        let zMap = {'before':1, 'inner-before':4, 'inner-after':6, 'after':10};
        
        let decoCss = `\n/* ========== 气泡装饰 ========== */\n.message-bubble, .message-bubble > *:first-child { position: relative !important; overflow: visible !important; }`;
        for (let ps in slots) {
            if (slots[ps]) {
                let sel = ps.includes('inner') ? `.message-bubble > *:first-child::${ps.replace('inner-','')}` : `.message-bubble::${ps}`;
                decoCss += `\n${sel} { content: '' !important; display: block !important; position: absolute !important; ${buildPos(slots[ps])} width: ${slots[ps].size}px !important; height: ${slots[ps].size}px !important; background-image: url('${slots[ps].img}') !important; background-size: contain !important; background-repeat: no-repeat !important; z-index: ${zMap[ps]} !important; pointer-events: none !important; }`;
            }
        }
        sections.push(decoCss);
    }

    // --- 10. 头像装饰 ---
    if (sectionChanged('avatarDecorations') && decorationItems && decorationItems.length > 0) {
        const buildAvatarDeco = (item) => {
            let bgStyle = '';
            if (item.bgEnabled) {
                const hex = item.bgColor || '#ffffff'; const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16), opacity = (item.bgOpacity || 80) / 100;
                bgStyle = `\n    background: rgba(${r},${g},${b},${opacity}) !important; padding: ${item.bgPadding || 4}px ${(item.bgPadding || 4) + 4}px !important; border-radius: ${item.bgRadius || 4}px !important;`;
            }
            return `\n    content: '${(item.text || '').replace(/'/g, "\\'")}' !important; display: block !important; position: absolute !important; left: 50% !important; top: 50% !important; transform: translate(calc(-50% + ${item.offsetX}px), calc(-50% + ${item.offsetY}px)) !important; font-size: ${item.fontSize}px !important; color: ${item.color} !important; font-weight: ${item.fontWeight} !important; white-space: nowrap !important; pointer-events: none !important;${bgStyle}`;
        };
        const beforeItem = decorationItems.find(d => d.position === 'before');
        const afterItem = decorationItems.find(d => d.position === 'after');
        let decoCss = `\n/* ========== 头像装饰 ========== */\n[class*="avatar"] { position: relative !important; overflow: visible !important; }`;
        if (beforeItem) decoCss += `\n[class*="avatar"]::before {${buildAvatarDeco(beforeItem)}\n    z-index: 0 !important;\n}`;
        if (afterItem) decoCss += `\n[class*="avatar"]::after {${buildAvatarDeco(afterItem)}\n    z-index: 10 !important;\n}`;
        sections.push(decoCss);
    }

    // --- 11. 头像框 ---
    if (sectionChanged('avatarFrame') && sc.avatar.frameUrl) {
        const framePseudo = sc.avatar.framePosition === 'before' ? '::before' : '::after';
        const frameSize = sc.avatar.size + 16, overflowPct = Math.round((frameSize / sc.avatar.size - 1) * 100), offsetPct = Math.round(overflowPct / 2);
        sections.push(`\n/* ========== 头像框 ========== */\n[class*="avatar"] { position: relative !important; overflow: visible !important; }\n[class*="avatar"]${framePseudo} { content: '' !important; display: block !important; position: absolute !important; top: -${offsetPct}% !important; left: -${offsetPct}% !important; width: ${100 + overflowPct}% !important; height: ${100 + overflowPct}% !important; background-image: url('${sc.avatar.frameUrl}') !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; z-index: ${sc.avatar.framePosition === 'before' ? -1 : 10} !important; pointer-events: none !important; }`);
    }

    return sections;
}

// 修改原有的 generateEncrypted 函数，确保从 encryptCodeArea 读取
function generateEncrypted() {
    const code = document.getElementById('encryptCodeArea').value;
    if (!code) {
        showCustomAlert('请先在导出页面生成代码', 'warning', '提示');
        return;
    }
    
    let result = code;
    
    // 作者注释
    if (document.getElementById('opt-author-comment').checked) {
        const author = document.getElementById('author-name').value || 'Anonymous';
        result = `/* Author: ${author} */\n` + result;
    }
    
    // 随机注释
    if (document.getElementById('opt-random-comment').checked) {
        const comment = document.getElementById('custom-comment').value || 'Generated';
        const lines = result.split('\n');
        const randomIndex = Math.floor(Math.random() * lines.length);
        lines.splice(randomIndex, 0, `/* ${comment} */`);
        result = lines.join('\n');
    }
    
    // 水印代码
    if (document.getElementById('opt-watermark').checked) {
        const watermark = document.getElementById('watermark-code').value || '/* WATERMARK */';
        result += '\n' + watermark;
    }
    
    document.getElementById('encryptCodeArea').value = result;
    showCustomAlert('加密代码已生成', 'success', '成功');
}
// 头像自动获取开关
function toggleAvatarAutoFetch() {
    const isAuto = document.getElementById('avatar-auto-fetch').checked;
    const manualSection = document.getElementById('avatar-manual-section');
    manualSection.style.display = isAuto ? 'none' : 'block';
    updatePreview();
}

// 头像上传处理
function handleAvatarUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatar-url').value = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 头像框上传处理
function handleFrameUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatar-frame-url').value = e.target.result;
            styleConfig.avatar.frameUrl = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 头像设置更新函数
function updateAvatarSize(value) {
    styleConfig.avatar.size = parseInt(value);
    document.getElementById('avatar-size-slider').value = value;
    document.getElementById('avatar-size-input').value = value;
    updatePreview();
}

function updateAvatarRadius(value) {
    styleConfig.avatar.radius = parseInt(value);
    document.getElementById('avatar-radius-slider').value = value;
    document.getElementById('avatar-radius-input').value = value;
    updatePreview();
}

function updateAvatarShadow() {
    const cfg = styleConfig.avatar.shadow;
    cfg.enabled = document.getElementById('avatar-shadow-enable')?.checked ?? true;
    cfg.type = document.getElementById('avatar-shadow-type')?.value || 'solid';
    cfg.color = document.getElementById('avatar-shadow-color')?.value || '#000000';
    cfg.opacity = parseInt(document.getElementById('avatar-shadow-opacity')?.value || 20);
    cfg.x = parseInt(document.getElementById('avatar-shadow-x')?.value || 0);
    cfg.y = parseInt(document.getElementById('avatar-shadow-y')?.value || 2);
    cfg.blur = parseInt(document.getElementById('avatar-shadow-blur')?.value || 4);
    cfg.spread = parseInt(document.getElementById('avatar-shadow-spread')?.value || 0);
    cfg.direction = document.getElementById('avatar-shadow-direction')?.value || 'to right';
    
    // 同步输入框
    const opacityDisplay = document.getElementById('avatar-shadow-opacity-value');
    if (opacityDisplay) opacityDisplay.textContent = cfg.opacity + '%';
    
    document.getElementById('avatar-shadow-x-input').value = cfg.x;
    document.getElementById('avatar-shadow-y-input').value = cfg.y;
    document.getElementById('avatar-shadow-blur-input').value = cfg.blur;
    document.getElementById('avatar-shadow-spread-input').value = cfg.spread;
    
    if (cfg.type === 'gradient') {
        updateGradientPreview();
    }
    
    updatePreview();
}

// 渐变颜色更新
function addShadowGradientColor() {
    const colors = styleConfig.avatar.shadow.gradientColors;
    const lastColor = colors[colors.length - 1];
    colors.push({ color: '#999999', position: Math.min(lastColor.position + 25, 100) });
    renderShadowGradientColors();
    updateGradientPreview();
    updateAvatarShadow();
}

function removeShadowGradientColor(index) {
    const colors = styleConfig.avatar.shadow.gradientColors;
    if (colors.length <= 2) {
        showCustomAlert('至少需要2个颜色', 'warning', '无法删除');
        return;
    }
    colors.splice(index, 1);
    renderShadowGradientColors();
    updateGradientPreview();
    updateAvatarShadow();
}
function updateShadowGradientColor(index, color) {
    styleConfig.avatar.shadow.gradientColors[index].color = color;
    renderShadowGradientColors();
    updateGradientPreview();
    updateAvatarShadow();
}

function updateShadowGradientPosition(index, position) {
    styleConfig.avatar.shadow.gradientColors[index].position = parseInt(position);
    updateGradientPreview();
    updateAvatarShadow();
}

function renderShadowGradientColors() {
    const container = document.getElementById('shadow-gradient-colors');
    if (!container) return;
    
    const colors = styleConfig.avatar.shadow.gradientColors;
    container.innerHTML = colors.map((item, index) => `
        <div class="gradient-color-item">
            <input type="color" class="editor-color-input" value="${item.color}" 
                   onchange="updateShadowGradientColor(${index}, this.value)">
            <input type="text" class="color-hex" value="${item.color}" 
                   onchange="updateShadowGradientColor(${index}, this.value)">
            <input type="number" class="color-position" value="${item.position}" min="0" max="100"
                   onchange="updateShadowGradientPosition(${index}, this.value)">
            <span style="font-size: 11px; color: var(--text-muted);">%</span>
            <button class="delete-color-btn" onclick="removeShadowGradientColor(${index})">×</button>
        </div>
    `).join('');
}

function updateGradientPreview() {
    const preview = document.getElementById('shadow-gradient-preview');
    if (!preview) return;
    
    const cfg = styleConfig.avatar.shadow;
    const sortedColors = [...cfg.gradientColors].sort((a, b) => a.position - b.position);
    const colorStops = sortedColors.map(c => `${c.color} ${c.position}%`).join(', ');
    
    if (cfg.direction === 'circle') {
        preview.style.background = `radial-gradient(circle, ${colorStops})`;
    } else {
        preview.style.background = `linear-gradient(${cfg.direction}, ${colorStops})`;
    }
}

function toggleShadowType() {
    const type = document.getElementById('avatar-shadow-type').value;
    document.getElementById('shadow-solid-section').style.display = type === 'solid' ? 'block' : 'none';
    document.getElementById('shadow-gradient-section').style.display = type === 'gradient' ? 'block' : 'none';
    
    if (type === 'gradient') {
        renderShadowGradientColors();
        updateGradientPreview();
    }
    updateAvatarShadow();
}

function syncShadowColor(value) {
    document.getElementById('avatar-shadow-color').value = value;
    updateAvatarShadow();
}

function syncShadowX(value) {
    document.getElementById('avatar-shadow-x').value = value;
    updateAvatarShadow();
}

function syncShadowY(value) {
    document.getElementById('avatar-shadow-y').value = value;
    updateAvatarShadow();
}

function syncShadowBlur(value) {
    document.getElementById('avatar-shadow-blur').value = value;
    updateAvatarShadow();
}

function syncShadowSpread(value) {
    document.getElementById('avatar-shadow-spread').value = value;
    updateAvatarShadow();
}

function updateAvatarPosition(axis, value) {
    styleConfig.avatar.position[axis] = parseInt(value);
    document.getElementById(`avatar-pos-${axis}-slider`).value = value;
    document.getElementById(`avatar-pos-${axis}-input`).value = value;
    updatePreview();
}
function updateAvatarDisplayMode(mode) {
    styleConfig.avatar.displayMode = mode;
    updatePreview();
}
function updateFramePosition(position) {
    styleConfig.avatar.framePosition = position;
    updatePreview();
}
// 头像框位置弹窗
function openFramePositionModal() {
    document.getElementById('framePositionModal').classList.add('show');
}

function closeFramePositionModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('framePositionModal').classList.remove('show');
}


function setFramePosition(position) {
    styleConfig.avatar.framePosition = position;
    
    // 更新按钮文字（两处）
    const text = position === 'before' ? '::before（底层）' : '::after（顶层）';
    const el1 = document.getElementById('frame-position-text');
    const el2 = document.getElementById('frame-position-text2');
    if (el1) el1.textContent = text;
    if (el2) el2.textContent = text;
    
    closeFramePositionModal();
    updatePreview();
    showCustomAlert('头像框挂载位置已更新', 'success', '设置成功');
}
    
    // 初始化渐变颜色列表
    renderShadowGradientColors();
    // 初始化装饰列表
    renderDecorationList();
    // ==================== 初始化所有通用颜色/阴影组件 ====================
initColorPicker('font-color-picker', 'fontColor', '字体颜色', {
    type: 'solid', color: '#333333', opacity: 100,
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#0066dd', position: 100 }],
    direction: 'to right'
});

// 我方独立面板里的颜色组件挂载
initColorPicker('font-color-sent-picker-alone', 'fontColorSent', '我方字体颜色');
initColorPicker('bubble-sent-color-picker-alone', 'bubbleSentBg', '我方气泡颜色');

// 对方独立面板里的颜色组件挂载
initColorPicker('font-color-recv-picker-alone', 'fontColor', '对方字体颜色');
initColorPicker('bubble-recv-color-picker-alone', 'bubbleRecvBg', '对方气泡颜色');

initColorPicker('font-color-sent-picker', 'fontColorSent', '我方字体颜色', {
    type: 'solid', color: '#ffffff', opacity: 100,
    gradientColors: [{ color: '#ffffff', position: 0 }, { color: '#e0e0ff', position: 100 }],
    direction: 'to right'
});

initColorPicker('text-bg-color-picker', 'textBgColor', '文字背景色', {
    type: 'gradient',
    color: '#ffffff',
    opacity: 100,
    gradientColors: [{ color: '#ffffff', position: 0 }, { color: '#f0f0f0', position: 100 }],
    direction: 'circle'   // ← 这里从 'to right' 改成 'circle' 就是径向渐变
});

initColorPicker('bubble-sent-color-picker', 'bubbleSentBg', '我方气泡颜色', {
    type: 'solid', color: '#007AFF', opacity: 100,
    gradientColors: [{ color: '#007AFF', position: 0 }, { color: '#0055CC', position: 100 }],
    direction: 'to right'
});

initColorPicker('bubble-received-color-picker', 'bubbleRecvBg', '对方气泡颜色', {
    type: 'solid', color: '#F0F0F0', opacity: 100,
    gradientColors: [{ color: '#F0F0F0', position: 0 }, { color: '#E0E0E0', position: 100 }],
    direction: 'to right'
});

initColorPicker('bubble-border-color-picker', 'bubbleBorderColor', '边框颜色', {
    type: 'solid', color: '#cccccc', opacity: 100,
    gradientColors: [{ color: '#cccccc', position: 0 }, { color: '#999999', position: 100 }],
    direction: 'to right'
});

initShadowPicker('bubble-shadow-picker', 'bubbleShadow', '气泡阴影', {
    enabled: true, type: 'solid', color: '#000000', opacity: 8,
    x: 0, y: 1, blur: 2, spread: 0,
    direction: 'to right',
    gradientColors: [{ color: '#000000', position: 0 }, { color: '#666666', position: 100 }]
});

initColorPicker('voice-text-color-picker', 'voiceTextColor', '转文字颜色', {
    type: 'solid', color: '#333333', opacity: 100,
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#666666', position: 100 }],
    direction: 'to right'
});

initColorPicker('voice-text-bg-color-picker', 'voiceTextBg', '转文字背景色', {
    type: 'solid', color: '#FFFFFF', opacity: 100,
    gradientColors: [{ color: '#FFFFFF', position: 0 }, { color: '#F0F0F0', position: 100 }],
    direction: 'to right'
});

initColorPicker('voice-text-border-color-picker', 'voiceTextBorderColor', '转文字边框色', {
    type: 'solid', color: '#dddddd', opacity: 100,
    gradientColors: [{ color: '#dddddd', position: 0 }, { color: '#bbbbbb', position: 100 }],
    direction: 'to right'
});

initShadowPicker('voice-text-shadow-picker', 'voiceTextShadow', '转文字阴影', {
    enabled: true, type: 'solid', color: '#000000', opacity: 10,
    x: 0, y: 1, blur: 3, spread: 0,
    direction: 'to right',
    gradientColors: [{ color: '#000000', position: 0 }, { color: '#666666', position: 100 }]
});

initColorPicker('image-desc-bg-color-picker', 'imageDescBg', '描述背景色', {
    type: 'solid', color: '#ffffff', opacity: 95,
    gradientColors: [{ color: '#ffffff', position: 0 }, { color: '#f5f5f5', position: 100 }],
    direction: 'to right'
});

initColorPicker('image-desc-border-color-picker', 'imageDescBorderColor', '描述边框色', {
    type: 'solid', color: '#dddddd', opacity: 100,
    gradientColors: [{ color: '#dddddd', position: 0 }, { color: '#bbbbbb', position: 100 }],
    direction: 'to right'
});
initColorPicker('image-desc-font-color-picker', 'imageDescFontColor', '描述字体颜色', {
    type: 'solid', color: '#333333', opacity: 100,
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#666666', position: 100 }],
    direction: 'to right'
});

// --- 转账卡片颜色配置 ---
initColorPicker('transfer-bg-picker', 'transferBg', '卡片背景', {
    type: 'gradient', color: '#FFE5E5', opacity: 100,
    gradientColors: [{ color: '#FFE5E5', position: 0 }, { color: '#FFF0F5', position: 100 }],
    direction: 'to bottom right'
});

initColorPicker('transfer-border-picker', 'transferBorderColor', '边框颜色', {
    type: 'solid', color: '#dddddd', opacity: 100,
    gradientColors: [{ color: '#dddddd', position: 0 }, { color: '#aaaaaa', position: 100 }],
    direction: 'to right'
});

initColorPicker('transfer-text-picker', 'transferTextColor', '文字颜色 (金额)', {
    type: 'solid', color: '#333333', opacity: 100, 
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#000000', position: 100 }],
    direction: 'to right'
});
// ================================================================
// ==================== 工具栏数据与逻辑 ====================
// ================================================================
/* ================================================================
   ==================== 更新后的 17 个默认工具项 ====================
   ================================================================ */
// 这里将原来的 font-awesome 类名转换为了对应的 SVG 图片 URL
// color 设为空字符串，以便它们能继承全局的“图标背景色”渐变设置
const defaultToolItems = [
    { id: 1, url: 'https://api.iconify.design/ri:refresh-line.svg?color=white', label: '重回', color: '' },
    { id: 2, url: 'https://api.iconify.design/fa6-solid:microphone.svg?color=white', label: '语音', color: '' },
    { id: 3, url: 'https://api.iconify.design/fa6-solid:face-smile.svg?color=white', label: '表情', color: '' },
    { id: 4, url: 'https://api.iconify.design/fa6-solid:camera.svg?color=white', label: '拍照', color: '' },
    { id: 5, url: 'https://api.iconify.design/fa6-solid:image.svg?color=white', label: '图片', color: '' },
    { id: 6, url: 'https://api.iconify.design/fa6-solid:arrow-right-arrow-left.svg?color=white', label: '转账', color: '' },
    { id: 7, url: 'https://api.iconify.design/fa6-solid:phone.svg?color=white', label: '电话', color: '' },
    { id: 8, url: 'https://api.iconify.design/fa6-solid:video.svg?color=white', label: '视频', color: '' },
    { id: 9, url: 'https://api.iconify.design/fa6-solid:location-dot.svg?color=white', label: '位置', color: '' },
    { id: 10, url: 'https://api.iconify.design/fa6-solid:book.svg?color=white', label: '日记', color: '' },
    { id: 11, url: 'https://api.iconify.design/fa6-solid:gamepad.svg?color=white', label: '游戏', color: '' },
    { id: 12, url: 'https://api.iconify.design/fa6-solid:headphones.svg?color=white', label: '听歌', color: '' },
    { id: 13, url: 'https://api.iconify.design/fa6-solid:cart-shopping.svg?color=white', label: '购物', color: '' },
    { id: 14, url: 'https://api.iconify.design/fa6-solid:map.svg?color=white', label: '足迹', color: '' },
    { id: 15, url: 'https://api.iconify.design/fa6-solid:mobile-screen.svg?color=white', label: '查看', color: '' },
    { id: 16, url: 'https://api.iconify.design/fa6-solid:book-open.svg?color=white', label: '书架', color: '' },
    { id: 17, url: 'https://api.iconify.design/fa6-solid:heart.svg?color=white', label: '陪伴', color: '' }
];

let toolbarItems = JSON.parse(JSON.stringify(defaultToolItems));
let toolbarItemIdCounter = 20;

const toolbarLayout = {
    columns: 4,
    gap: 10,
    padding: 12,
    maxHeight: 200,
    iconSize: 30,
    iconRadius: 50,
    labelSize: 10,
};

function updateToolbarLayout(prop, value) {
    toolbarLayout[prop] = parseInt(value);
    const displayMap = {
        'columns': 'toolbar-columns-val',
        'gap': 'toolbar-gap-val',
        'padding': 'toolbar-padding-val',
        'maxHeight': 'toolbar-maxheight-val',
        'iconSize': 'toolbar-icon-size-val',
        'iconRadius': 'toolbar-icon-radius-val',
        'labelSize': 'toolbar-label-size-val',
    };
    if (displayMap[prop]) {
        const el = document.getElementById(displayMap[prop]);
        if (el) {
            if (prop === 'columns') el.textContent = value;
            else if (prop === 'iconRadius') el.textContent = value + '%';
            else el.textContent = value + 'px';
        }
    }
    renderPreviewToolbar();
}

// 重新渲染预览区工具栏
function renderPreviewToolbar() {
    const grid = document.getElementById('previewToolsGrid');
    if (!grid) return;
    
    // 1. 面板背景色修复
    const panel = document.getElementById('previewToolsPanel');
    const panelBg = colorPickerRegistry['toolbarBgColor'] ? cpGetCssValue('toolbarBgColor') : '#F5F5F5';
    
    // 获取全局图标背景和阴影配置
    const globalIconBgVal = colorPickerRegistry['toolbarIconColor'] ? cpGetCssValue('toolbarIconColor') : '#5B9BD5';
    const isGlobalIconGrad = colorPickerRegistry['toolbarIconColor'] && cpIsGradient('toolbarIconColor');
    const iconShadow = spGetCssValue('toolbarIconShadow');
    
    // 获取全局文字颜色配置（修复文字渐变）
    const globalLabelColorVal = colorPickerRegistry['toolbarLabelColor'] ? cpGetCssValue('toolbarLabelColor') : '#333';
    const isLabelGrad = colorPickerRegistry['toolbarLabelColor'] && cpIsGradient('toolbarLabelColor');

    if (panel) {
        panel.style.padding = toolbarLayout.padding + 'px ' + (toolbarLayout.padding + 4) + 'px';
        panel.style.maxHeight = toolbarLayout.maxHeight + 'px';
        panel.style.background = panelBg; // 应用面板背景
    }
    
    grid.style.gridTemplateColumns = `repeat(${toolbarLayout.columns}, 1fr)`;
    grid.style.gap = toolbarLayout.gap + 'px ' + (toolbarLayout.gap - 2) + 'px';
    
    grid.innerHTML = toolbarItems.map(item => {
    // --- 图标背景逻辑 ---
    let iconBgStyle = '';
    if (item.color) {
        iconBgStyle = `background: ${item.color};`;
    } else {
        iconBgStyle = `background: ${globalIconBgVal};`;
    }

    // --- 文字颜色逻辑 ---
    let labelStyle = `font-size:${toolbarLayout.labelSize}px;`;
    if (isLabelGrad) {
        labelStyle += `background-image: ${globalLabelColorVal}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; display: block;`;
    } else {
        labelStyle += `color: ${globalLabelColorVal}; display: block;`;
    }

    const defaultIcon = 'https://api.iconify.design/ri:function-line.svg?color=white';
    const iconSrc = item.url || defaultIcon;

    // --- 新增：获取大小、位置和填充模式 ---
    const scale = item.scale || 50; 
    const fit = item.fit || 'contain';
    const x = item.x || 0;
    const y = item.y || 0;

    return `
    <div class="preview-tool-item">
        <div class="preview-tool-icon" style="
            width:${toolbarLayout.iconSize}px;
            height:${toolbarLayout.iconSize}px;
            border-radius:${toolbarLayout.iconRadius}%;
            ${iconBgStyle}
            box-shadow:${iconShadow};
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden; 
            position: relative; /* 确保位移相对于框 */
        ">
            <img src="${iconSrc}" style="
                width: ${scale}%; 
                height: ${scale}%; 
                object-fit: ${fit}; 
                display: block;
                pointer-events: none;
                transform: translate(${x}px, ${y}px); /* 应用位移 */
            ">
        </div>
        <span class="preview-tool-label" style="${labelStyle}">${item.label}</span>
    </div>`;
}).join('');
}

function renderToolbarItemsList() {
    const container = document.getElementById('toolbarItemsList');
    if (!container) return;
    
    container.innerHTML = toolbarItems.map((item, idx) => `
        <div class="toolbar-item-card">
            <div class="toolbar-item-header">
                <span class="toolbar-item-title">
                    <img src="${item.url || 'https://api.iconify.design/ri:image-line.svg'}" style="width:16px;height:16px;object-fit:contain;margin-right:4px;">
                    ${item.label}
                </span>
                <div class="toolbar-item-actions">
                    <button onclick="moveToolbarItem(${idx}, -1)" title="上移" ${idx === 0 ? 'disabled' : ''}>↑</button>
                    <button onclick="moveToolbarItem(${idx}, 1)" title="下移" ${idx === toolbarItems.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="delete-btn" onclick="removeToolbarItem(${idx})" title="删除">×</button>
                </div>
            </div>
            
            <div class="editor-row">
                <span class="editor-label">功能名称</span>
                <input type="text" class="editor-input" value="${item.label}" 
                       onchange="updateToolbarItem(${idx}, 'label', this.value)">
            </div>

            <div class="editor-row">
                <span class="editor-label">图标URL</span>
                <input type="text" class="editor-input" value="${item.url || ''}" 
                       placeholder="https://..."
                       onchange="updateToolbarItem(${idx}, 'url', this.value)">
            </div>

            <div class="editor-row">
                <span class="editor-label">上传图标</span>
                <input type="file" class="editor-input" accept="image/*" 
                       onchange="handleToolbarItemUpload(${idx}, this)">
            </div>

            <!-- 填充模式 (Select不需要实时，用onchange即可) -->
            <div class="editor-row">
                <span class="editor-label">填充模式</span>
                <select class="editor-select" onchange="updateToolbarItem(${idx}, 'fit', this.value)">
                    <option value="contain" ${(!item.fit || item.fit==='contain')?'selected':''}>适应 (Contain)</option>
                    <option value="cover" ${item.fit==='cover'?'selected':''}>铺满 (Cover)</option>
                    <option value="fill" ${item.fit==='fill'?'selected':''}>拉伸 (Fill)</option>
                </select>
            </div>

            <!-- 图标大小：使用 oninput 实时预览，onchange 保存 -->
            <div class="editor-row">
                <span class="editor-label">图标大小</span>
                <input type="range" class="editor-slider" min="10" max="150" value="${item.scale || 50}" 
                       oninput="handleToolbarLiveUpdate(${idx}, 'scale', this.value, this.nextElementSibling)"
                       onchange="updateToolbarItem(${idx}, 'scale', this.value)">
                <span style="font-size:12px;width:35px;text-align:right;">${item.scale || 50}%</span>
            </div>

            <!-- X 偏移：使用 oninput 实时预览，onchange 保存 -->
            <div class="editor-row">
                <span class="editor-label">X 偏移</span>
                <input type="range" class="editor-slider" min="-50" max="50" value="${item.x || 0}" 
                       oninput="handleToolbarLiveUpdate(${idx}, 'x', this.value, this.nextElementSibling)"
                       onchange="updateToolbarItem(${idx}, 'x', this.value)">
                <span style="font-size:12px;width:35px;text-align:right;">${item.x || 0}px</span>
            </div>

            <!-- Y 偏移：使用 oninput 实时预览，onchange 保存 -->
            <div class="editor-row">
                <span class="editor-label">Y 偏移</span>
                <input type="range" class="editor-slider" min="-50" max="50" value="${item.y || 0}" 
                       oninput="handleToolbarLiveUpdate(${idx}, 'y', this.value, this.nextElementSibling)"
                       onchange="updateToolbarItem(${idx}, 'y', this.value)">
                <span style="font-size:12px;width:35px;text-align:right;">${item.y || 0}px</span>
            </div>

            <div class="editor-row">
                <span class="editor-label">背景色</span>
                <div class="editor-color-row">
                    <input type="color" class="editor-color-input" value="${item.color || '#5B9BD5'}" 
                           onchange="updateToolbarItem(${idx}, 'color', this.value)">
                    <input type="text" class="editor-color-text" value="${item.color || ''}" 
                           placeholder="留空用全局配置"
                           onchange="updateToolbarItem(${idx}, 'color', this.value)">
                </div>
            </div>
        </div>
    `).join('');
}

// 新增：处理单个工具项的图标上传
function handleToolbarItemUpload(idx, input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveUndoState();
            // 更新该项的 url
            toolbarItems[idx].url = e.target.result;
            renderToolbarItemsList();
            renderPreviewToolbar();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 新增：专门处理滑块拖动时的实时预览，不重绘DOM，防止滑块卡顿
function handleToolbarLiveUpdate(idx, prop, value, labelSpan) {
    // 1. 更新数据
    toolbarItems[idx][prop] = prop === 'fit' ? value : parseInt(value);
    
    // 2. 如果传了显示数值的标签，更新它
    if (labelSpan) {
        const unit = prop === 'scale' ? '%' : 'px';
        labelSpan.textContent = value + unit;
    }
    
    // 3. 只更新预览区，不更新左侧列表
    renderPreviewToolbar();
}

function updateToolbarItem(idx, prop, value) {
    saveUndoState();
    toolbarItems[idx][prop] = value;
    renderToolbarItemsList();
    renderPreviewToolbar();
}

function removeToolbarItem(idx) {
    saveUndoState();
    toolbarItems.splice(idx, 1);
    renderToolbarItemsList();
    renderPreviewToolbar();
}

function moveToolbarItem(idx, dir) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= toolbarItems.length) return;
    saveUndoState();
    [toolbarItems[idx], toolbarItems[newIdx]] = [toolbarItems[newIdx], toolbarItems[idx]];
    renderToolbarItemsList();
    renderPreviewToolbar();
}

function addToolbarItem() {
    saveUndoState();
    toolbarItems.push({
        id: ++toolbarItemIdCounter,
        url: '', 
        label: '新功能',
        color: '',
        // --- 新增默认属性 ---
        fit: 'contain', // 填充模式
        scale: 50,      // 大小百分比 (原本默认是50%)
        x: 0,           // X轴偏移
        y: 0            // Y轴偏移
    });
    renderToolbarItemsList();
    renderPreviewToolbar();
}

// ================================================================
// ==================== 撤回/恢复 ====================
// ================================================================
const undoStack = [];
const redoStack = [];
const MAX_UNDO = 30;
let _lastSavedState = '';
let _undoDebounceTimer = null;
let _stateBeforeSlide = ''; // 滑动开始前的状态

function getGlobalState() {
    try {
        return JSON.stringify({
            toolbarItems: toolbarItems,
            bubbleConfig: bubbleConfig,
            styleConfig: styleConfig,
            decorationItems: decorationItems,
            tailConfig: tailConfig
            // 移除 colorPickerRegistry 和 shadowPickerRegistry，太大了
        });
    } catch(e) {
        return '';
    }
}


let _undoSaveTimer = null;
function saveGlobalUndoState() {
    if (_initPhase) return;
    
    // 防抖：500ms内多次操作只保存一次
    if (_undoSaveTimer) clearTimeout(_undoSaveTimer);
    _undoSaveTimer = setTimeout(() => {
        const currentState = getGlobalState();
        if (currentState === _lastSavedState) return;
        
        if (_lastSavedState) {
            undoStack.push(_lastSavedState);
            if (undoStack.length > MAX_UNDO) undoStack.shift();
            redoStack.length = 0;
        }
        _lastSavedState = currentState;
        updateUndoRedoButtons();
    }, 400);
}
function saveUndoState() {
    saveGlobalUndoState();
}

function undoAction() {
    if (undoStack.length === 0) return;
    redoStack.push(getGlobalState());
    const prev = undoStack.pop();
    _initPhase = true; // 防止恢复时触发更新
    applyGlobalState(prev);
    _initPhase = false;
    _lastSavedState = prev;
    updateUndoRedoButtons();
    updatePreview();
}

function redoAction() {
    if (redoStack.length === 0) return;
    undoStack.push(getGlobalState());
    const next = redoStack.pop();
    _initPhase = true;
    applyGlobalState(next);
    _initPhase = false;
    _lastSavedState = next;
    updateUndoRedoButtons();
    updatePreview();
}

function applyGlobalState(stateStr) {
    if (!stateStr) return;
    try {
        const state = JSON.parse(stateStr);
        
        // 深拷贝赋值
        const bc = state.bubbleConfig;
        for (const key in bc) {
            bubbleConfig[key] = bc[key];
        }
        const sc = state.styleConfig;
        for (const key in sc) {
            if (typeof sc[key] === 'object' && sc[key] !== null) {
                styleConfig[key] = JSON.parse(JSON.stringify(sc[key]));
            } else {
                styleConfig[key] = sc[key];
            }
        }
        toolbarItems = state.toolbarItems;
        decorationItems = state.decorationItems || [];
if (state.tailConfig) {
    for (const key in state.tailConfig) {
        tailConfig[key] = state.tailConfig[key];
    }
}
        // 恢复颜色选择器和阴影选择器
if (state.colorPickerRegistry) {
    for (const key in state.colorPickerRegistry) {
        colorPickerRegistry[key] = JSON.parse(JSON.stringify(state.colorPickerRegistry[key]));
    }
}
if (state.shadowPickerRegistry) {
    for (const key in state.shadowPickerRegistry) {
        shadowPickerRegistry[key] = JSON.parse(JSON.stringify(state.shadowPickerRegistry[key]));
    }
}
        
        // 同步所有UI控件
        syncAllUIControls();
        
        renderToolbarItemsList();
        renderPreviewToolbar();
        renderDecorationList();
        
        _initPhase = true;
        _initPhase = false;
        
        let html = generateTimestampPreview();
        html += generateAllMessages();
        previewMessages.innerHTML = html;
        renderPreviewToolbar();
    } catch(e) {
        console.error('Undo state parse error', e);
    }
}

// 同步所有UI控件到当前数据状态
function syncAllUIControls() {
    const bc = bubbleConfig;
    const sc = styleConfig;
    
    // 我们必须获取到当面处于活跃状态的配置层，防止覆盖错误
    const activeRadius = getActiveObj('borderRadius');
    const activePadding = getActiveObj('padding');
    const activeMargin = getActiveObj('margin');
    const activeBorderW = getActiveObj('borderWidth');

    // 字体大小
    const fss = document.getElementById('font-size-slider');
    const fsi = document.getElementById('font-size-input');
    if (fss) fss.value = bc.fontSize;
    if (fsi) fsi.value = bc.fontSize;
    
    // 圆角统一回写
    const brSlider = document.getElementById('br-all-slider');
    const brInput = document.getElementById('br-all-input');
    if (brSlider) brSlider.value = activeRadius.all;
    if (brInput) brInput.value = activeRadius.all;
    
    // 内边距回写
    const padSlider = document.getElementById('pad-all-slider');
    const padInput = document.getElementById('pad-all-input');
    if (padSlider) padSlider.value = activePadding.all;
    if (padInput) padInput.value = activePadding.all;
    
    // 外边距回写
    const marSlider = document.getElementById('mar-all-slider');
    const marInput = document.getElementById('mar-all-input');
    if (marSlider) marSlider.value = activeMargin.all;
    if (marInput) marInput.value = activeMargin.all;
    
    // 边框粗细回写
    const bwSlider = document.getElementById('bw-all-slider');
    const bwInput = document.getElementById('bw-all-input');
    if (bwSlider) bwSlider.value = activeBorderW.all;
    if (bwInput) bwInput.value = activeBorderW.all;

    
    // 头像设置
    const avSizeSlider = document.getElementById('avatar-size-slider');
    const avSizeInput = document.getElementById('avatar-size-input');
    if (avSizeSlider) avSizeSlider.value = sc.avatar.size;
    if (avSizeInput) avSizeInput.value = sc.avatar.size;
    
    const avRadiusSlider = document.getElementById('avatar-radius-slider');
    const avRadiusInput = document.getElementById('avatar-radius-input');
    if (avRadiusSlider) avRadiusSlider.value = sc.avatar.radius;
    if (avRadiusInput) avRadiusInput.value = sc.avatar.radius;
    
    const avPosXSlider = document.getElementById('avatar-pos-x-slider');
    const avPosXInput = document.getElementById('avatar-pos-x-input');
    if (avPosXSlider) avPosXSlider.value = sc.avatar.position.x;
    if (avPosXInput) avPosXInput.value = sc.avatar.position.x;
    
    const avPosYSlider = document.getElementById('avatar-pos-y-slider');
    const avPosYInput = document.getElementById('avatar-pos-y-input');
    if (avPosYSlider) avPosYSlider.value = sc.avatar.position.y;
    if (avPosYInput) avPosYInput.value = sc.avatar.position.y;
    
    // 头像阴影
    const shX = document.getElementById('avatar-shadow-x');
    const shXI = document.getElementById('avatar-shadow-x-input');
    const shY = document.getElementById('avatar-shadow-y');
    const shYI = document.getElementById('avatar-shadow-y-input');
    const shBlur = document.getElementById('avatar-shadow-blur');
    const shBlurI = document.getElementById('avatar-shadow-blur-input');
    const shSpread = document.getElementById('avatar-shadow-spread');
    const shSpreadI = document.getElementById('avatar-shadow-spread-input');
    const shOpacity = document.getElementById('avatar-shadow-opacity');
    const shOpVal = document.getElementById('avatar-shadow-opacity-value');
    if (shX) shX.value = sc.avatar.shadow.x;
    if (shXI) shXI.value = sc.avatar.shadow.x;
    if (shY) shY.value = sc.avatar.shadow.y;
    if (shYI) shYI.value = sc.avatar.shadow.y;
    if (shBlur) shBlur.value = sc.avatar.shadow.blur;
    if (shBlurI) shBlurI.value = sc.avatar.shadow.blur;
    if (shSpread) shSpread.value = sc.avatar.shadow.spread;
    if (shSpreadI) shSpreadI.value = sc.avatar.shadow.spread;
    if (shOpacity) shOpacity.value = sc.avatar.shadow.opacity;
    if (shOpVal) shOpVal.textContent = sc.avatar.shadow.opacity + '%';
    
    // 表情/图片尺寸
    const emojiSize = document.getElementById('emoji-max-size');
    const emojiVal = document.getElementById('emoji-max-size-val');
    if (emojiSize) emojiSize.value = bc.emojiMaxSize;
    if (emojiVal) emojiVal.textContent = bc.emojiMaxSize + 'px';
    
    const imgW = document.getElementById('image-max-w');
    const imgWVal = document.getElementById('image-max-w-val');
    if (imgW) imgW.value = bc.imageMaxWidth;
    if (imgWVal) imgWVal.textContent = bc.imageMaxWidth + 'px';
    
    const imgH = document.getElementById('image-max-h');
    const imgHVal = document.getElementById('image-max-h-val');
    if (imgH) imgH.value = bc.imageMaxHeight;
    if (imgHVal) imgHVal.textContent = bc.imageMaxHeight + 'px';
    
    const imgR = document.getElementById('image-radius');
    const imgRVal = document.getElementById('image-radius-val');
    if (imgR) imgR.value = bc.imageRadius;
    if (imgRVal) imgRVal.textContent = bc.imageRadius + 'px';
    
    const emojiRadius = document.getElementById('emoji-radius');
const emojiRadiusInput = document.getElementById('emoji-radius-input');
if (emojiRadius) emojiRadius.value = bc.emojiRadius || 8;
if (emojiRadiusInput) emojiRadiusInput.value = bc.emojiRadius || 8;

    // 语音
    const voiceWC = document.getElementById('voice-wave-count');
    const voiceWCVal = document.getElementById('voice-wave-count-val');
    if (voiceWC) voiceWC.value = bc.voiceWaveCount;
    if (voiceWCVal) voiceWCVal.textContent = bc.voiceWaveCount;
    
    // 气泡装饰
    const decoW = document.getElementById('bubble-deco-w');
    const decoWVal = document.getElementById('bubble-deco-w-val');
    if (decoW) decoW.value = bc.decoWidth;
    if (decoWVal) decoWVal.textContent = bc.decoWidth + 'px';
    
    const decoH = document.getElementById('bubble-deco-h');
    const decoHVal = document.getElementById('bubble-deco-h-val');
    if (decoH) decoH.value = bc.decoHeight;
    if (decoHVal) decoHVal.textContent = bc.decoHeight + 'px';
    
    const decoX = document.getElementById('bubble-deco-x');
    const decoXVal = document.getElementById('bubble-deco-x-val');
    if (decoX) decoX.value = bc.decoX;
    if (decoXVal) decoXVal.textContent = bc.decoX + 'px';
    
    const decoY = document.getElementById('bubble-deco-y');
    const decoYVal = document.getElementById('bubble-deco-y-val');
    if (decoY) decoY.value = bc.decoY;
    if (decoYVal) decoYVal.textContent = bc.decoY + 'px';

// 描述字体大小
const descFS = document.getElementById('image-desc-fontsize');
const descFSI = document.getElementById('image-desc-fontsize-input');
if (descFS) descFS.value = bc.descFontSize || 14;
if (descFSI) descFSI.value = bc.descFontSize || 14;

// 聊天区域比例
const chatScaleSlider = document.getElementById('chat-area-scale-slider');
const chatScaleInput = document.getElementById('chat-area-scale-input');
if (chatScaleSlider) chatScaleSlider.value = sc.chatArea.scale || 100;
if (chatScaleInput) chatScaleInput.value = sc.chatArea.scale || 100;

renderBubbleDecoList();

const topbarBgUrlInput = document.getElementById('topbar-bg-url');
    if (topbarBgUrlInput) topbarBgUrlInput.value = sc.topBar?.container?.bgUrl || '';

    const bottombarBgUrlInput = document.getElementById('bottombar-bg-url');
    if (bottombarBgUrlInput) bottombarBgUrlInput.value = sc.bottomBar?.container?.bgUrl || '';
    
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

// 预览区+按钮绑定
document.getElementById('previewAddBtn').addEventListener('click', function() {
    this.classList.toggle('active');
    document.getElementById('previewToolsPanel').classList.toggle('show');
});

// 初始化工具栏
renderPreviewToolbar();
renderToolbarItemsList();

// 工具栏颜色组件
initColorPicker('toolbar-bg-color-picker', 'toolbarBgColor', '工具栏背景色', {
    type: 'solid', color: '#F5F5F5', opacity: 100,
    gradientColors: [{ color: '#F5F5F5', position: 0 }, { color: '#E8E8E8', position: 100 }],
    direction: 'to right'
});
initColorPicker('tail-color-picker', 'tailColor', '小尾巴颜色（留空跟随气泡）', {
    type: 'solid', color: '#007AFF', opacity: 100,
    gradientColors: [{ color: '#007AFF', position: 0 }, { color: '#0055CC', position: 100 }],
    direction: 'to right'
});
initColorPicker('toolbar-icon-color-picker', 'toolbarIconColor', '图标背景色（全局）', {
    type: 'solid', color: '#5B9BD5', opacity: 100,
    gradientColors: [{ color: '#5B9BD5', position: 0 }, { color: '#4A8BC2', position: 100 }],
    direction: 'to right'
});
initColorPicker('toolbar-label-color-picker', 'toolbarLabelColor', '文字颜色（全局）', {
    type: 'solid', color: '#333333', opacity: 100,
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#666666', position: 100 }],
    direction: 'to right'
});
initShadowPicker('transfer-shadow-picker', 'transferShadow', '卡片阴影', {
    enabled: true, type: 'solid', color: '#000000', opacity: 8,
    x: 0, y: 2, blur: 8, spread: 0,
    direction: 'to right',
    gradientColors: [{ color: '#000000', position: 0 }, { color: '#666666', position: 100 }]
});
initShadowPicker('toolbar-icon-shadow-picker', 'toolbarIconShadow', '图标阴影', {
    enabled: false, type: 'solid', color: '#000000', opacity: 15,
    x: 0, y: 2, blur: 4, spread: 0,
    direction: 'to right',
    gradientColors: [{ color: '#000000', position: 0 }, { color: '#666666', position: 100 }]
});

function applyFontFromUrl(url) {
    if (!url || url === '(已上传本地字体)') return;
    bubbleConfig.fontUrl = url;

    let styleEl = document.getElementById('custom-font-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-font-style';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
        @font-face {
            font-family: 'CustomBubbleFont';
            src: url('${url}');
            font-display: swap;
        }
    `;
    bubbleConfig.fontFamily = 'CustomBubbleFont';
    updatePreview();
}

function toggleBubbleBgImage(enabled) {
    bubbleConfig.bgImageEnabled = enabled;
    document.getElementById('bubble-bg-settings').style.display = enabled ? 'block' : 'none';
    document.getElementById('bubble-color-section').style.display = enabled ? 'none' : 'block';
    updatePreview();
}

function toggleTextBg(enabled) {
    bubbleConfig.textBgEnabled = enabled;
    document.getElementById('text-bg-settings').style.display = enabled ? 'block' : 'none';
    updatePreview();
}

function toggleTextBgRadiusMode(unified) {
    bubbleConfig.textBgRadius.unified = unified;
    document.getElementById('textBgRadius-uniform').style.display = unified ? 'block' : 'none';
    document.getElementById('textBgRadius-individual').style.display = unified ? 'none' : 'block';
    updatePreview();
}

function updateTextBgRadiusUniform(value) {
    const v = parseInt(value);
    const r = bubbleConfig.textBgRadius;
    r.all = r.tl = r.tr = r.br = r.bl = v;
    document.getElementById('tbr-all-slider').value = v;
    document.getElementById('tbr-all-input').value = v;
    updatePreview();
}

function updateTextBgRadiusSide(side, value) {
    const v = parseInt(value);
    bubbleConfig.textBgRadius[side] = v;
    const el = document.getElementById('tbr-' + side);
    if (el) el.value = v;
    updatePreview();
}

function getTextBgRadiusCss() {
    const r = bubbleConfig.textBgRadius;
    if (r.unified) return r.all + 'px';
    return `${r.tl}px ${r.tr}px ${r.br}px ${r.bl}px`;
}

function handleTextBgUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bubbleConfig.textBgUrl = e.target.result;
            document.getElementById('text-bg-url').value = '(已上传)';
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function getBubbleDecoHtml(isSent) {
    let decoHtml = '';
    const transforms = ['none', 'scaleX(-1)', 'scaleY(-1)', 'scale(-1)'];
    
    bubbleConfig.bubbleDecorations.forEach(d => {
        if (!d.img) return;

        // 根据锚点计算定位
        let posStyle = 'position: absolute; ';
        if (d.anchor.includes('top'))    posStyle += `top: ${d.y}px; `;
        if (d.anchor.includes('bottom')) posStyle += `bottom: ${-d.y}px; `;
        if (d.anchor.includes('left'))   posStyle += `left: ${d.x}px; `;
        if (d.anchor.includes('right'))  posStyle += `right: ${-d.x}px; `;

        // 图层层级
        let zIndex;
        switch(d.pseudo) {
            case 'before':       zIndex = 1; break;
            case 'inner-before': zIndex = 4; break;
            case 'inner-after':  zIndex = 6; break;
            case 'after':
            default:             zIndex = 10; break;
        }

        decoHtml += `<img src="${d.img}" style="
            ${posStyle}
            width: ${d.size}px;
            height: ${d.size}px;
            transform: ${transforms[d.flip] || 'none'};
            pointer-events: none;
            z-index: ${zIndex};
            object-fit: contain;
        ">`;
    });
    decoHtml += getTailHtml(isSent);
    return decoHtml;
}

// 描述字体URL应用
function applyDescFont(url) {
    if (!url) return;
    
    let styleEl = document.getElementById('desc-font-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'desc-font-style';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
        @font-face {
            font-family: 'DescCustomFont';
            src: url('${url}');
            font-display: swap;
        }
    `;
    bubbleConfig.descFontFamily = 'DescCustomFont';
    updatePreview();
}

// 描述字体上传
function handleDescFontUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('desc-font-url').value = '(已上传)';
            applyDescFont(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ==================== 引用消息配置函数 ====================

const replyPresets = {
    default: {
        position: 'inside-top', barStyle: 'none', barWidth: 3, barColor: '#007AFF',
        bgColor: '#F3F3F3', bgRadius: 6, jumpBtnType: 'icon',
        replySenderColor: '#333333', 
        replyMsgColor: '#666666'     
    },
    wechat: {
    position: 'outside-bottom',
    barStyle: 'none',
    barWidth: 0,
    barColor: '#007AFF',
    bgColor: '#F7F7F7',
    bgRadius: 3,
    replyPadding: 5,
    jumpBtnType: 'none',
    replySenderColor: '#727272',
    replyMsgColor: '#727272',
    replyShowTime: false, 
    replyBorderWidth: 0.7,
    replyBorderColor: '#E6E6E6',
},
'wechat-above': {
    position: 'outside-above',
    barStyle: 'none',
    barWidth: 0,
    barColor: '#007AFF',
    bgColor: '#F7F7F7',
    bgRadius: 3,
    replyPadding: 5,
    jumpBtnType: 'none',
    replySenderColor: '#727272',
    replyMsgColor: '#727272',
    replyShowTime: false,
    replyBorderWidth: 0.7,
    replyBorderColor: '#E6E6E6',
},
    telegram: {
        position: 'inside-top',
        barStyle: 'line',
        barWidth: 2,
        barColor: '#3390ec',
        bgColor: 'transparent',
        bgRadius: 4,
        replyPadding: 4,
        replySenderColor: '#3390ec',
        replyMsgColor: '#8b8e91',
        replyShowTime: false,
        jumpBtnType: 'none', 
        replyFontSize: 12,
        replyBorderWidth: 0,
        replyBorderColor: 'transparent',
    },
    custom: null
};

function setReplyPreset(preset) {
    bubbleConfig.replyPreset = preset;
    document.querySelectorAll('#reply-preset-grid .wave-style-option').forEach(el => {
        el.classList.toggle('active', el.dataset.style === preset);
    });
    
    if (preset !== 'custom' && replyPresets[preset]) {
        const p = replyPresets[preset];
        bubbleConfig.replyPosition = p.position;
        bubbleConfig.replyBarStyle = p.barStyle;
        bubbleConfig.replyBarWidth = p.barWidth;
        bubbleConfig.replyBgRadius = p.bgRadius;
        bubbleConfig.replyJumpBtnType = p.jumpBtnType;
        
        // 同步颜色到颜色选择器
        if (p.barColor && colorPickerRegistry['replyBarColor']) {
            colorPickerRegistry['replyBarColor'].color = p.barColor;
            colorPickerRegistry['replyBarColor'].type = 'solid';
            colorPickerRegistry['replyBarColor'].opacity = 100;
        }
        if (p.bgColor && colorPickerRegistry['replyBgColor']) {
            colorPickerRegistry['replyBgColor'].color = p.bgColor;
            colorPickerRegistry['replyBgColor'].type = 'solid';
            colorPickerRegistry['replyBgColor'].opacity = 100;
        }
        if (p.replySenderColor && colorPickerRegistry['replySenderColor']) {
            colorPickerRegistry['replySenderColor'].color = p.replySenderColor;
            colorPickerRegistry['replySenderColor'].type = 'solid';
            colorPickerRegistry['replySenderColor'].opacity = 100;
        }
        if (p.replyMsgColor && colorPickerRegistry['replyMsgColor']) {
            colorPickerRegistry['replyMsgColor'].color = p.replyMsgColor;
            colorPickerRegistry['replyMsgColor'].type = 'solid';
            colorPickerRegistry['replyMsgColor'].opacity = 100;
        }
if (p.replyShowTime !== undefined) bubbleConfig.replyShowTime = p.replyShowTime;
if (p.replyBorderWidth !== undefined) bubbleConfig.replyBorderWidth = p.replyBorderWidth;
if (p.replyBorderColor !== undefined) bubbleConfig.replyBorderColor = p.replyBorderColor;
if (p.replyPadding !== undefined) bubbleConfig.replyPadding = p.replyPadding;
        renderColorPickerHtml('reply-bar-color-picker', 'replyBarColor', '竖条颜色');
        renderColorPickerHtml('reply-bg-color-picker', 'replyBgColor', '引用背景色');
        renderColorPickerHtml('reply-sender-color-picker', 'replySenderColor', '发送者颜色');
        renderColorPickerHtml('reply-msg-color-picker', 'replyMsgColor', '消息颜色');
        
        syncReplyUIControls();
    }
    else if (preset === 'custom') {
        syncReplyUIControls();
    }
    updatePreview();
}

function updateReplyConfig(prop, value) {
    const numProps = ['barWidth', 'bgRadius', 'padding', 'fontSize', 'jumpBtnSize', 'jumpBtnWidth', 'jumpBtnHeight', 'jumpBtnRadius', 'barOffsetX', 'barOffsetY', 'jumpBtnOffsetX', 'jumpBtnOffsetY', 'jumpBtnExternalGap', 'jumpBtnExternalFontSize', 'jumpBtnExternalRadius', 'jumpBtnExternalPadX', 'jumpBtnExternalPadY'];
    const fullKey = 'reply' + prop.charAt(0).toUpperCase() + prop.slice(1);

    if (numProps.includes(prop)) {
        bubbleConfig[fullKey] = parseInt(value);
    } else {
        bubbleConfig[fullKey] = value;
    }

    if (bubbleConfig.replyPreset !== 'custom') {
        bubbleConfig.replyPreset = 'custom';
        document.querySelectorAll('#reply-preset-grid .wave-style-option').forEach(el => {
            el.classList.toggle('active', el.dataset.style === 'custom');
        });
    }

    if (prop === 'barStyle') {
        const style = value;
        const lineEl = document.getElementById('reply-bar-line-settings');
        const iconEl = document.getElementById('reply-bar-icon-settings');
        const posEl = document.getElementById('reply-bar-position-settings');
        if (lineEl) lineEl.style.display = style === 'line' ? 'block' : 'none';
        if (iconEl) iconEl.style.display = style === 'icon' ? 'block' : 'none';
        if (posEl) posEl.style.display = style === 'none' ? 'none' : 'block';

        if (style === 'line' && (bubbleConfig.replyBarWidth || 0) <= 0) {
            bubbleConfig.replyBarWidth = 3;
            syncRangeAndInput('reply-bar-width', 'reply-bar-width-input', 3);
        }
    }

    if (prop === 'jumpBtnType') {
        const type = value;
        const iEl = document.getElementById('reply-jump-icon-settings');
        const tEl = document.getElementById('reply-jump-text-settings');
        const mEl = document.getElementById('reply-jump-image-settings');
        const posEl = document.getElementById('reply-jump-position-settings');

        if (iEl) iEl.style.display = type === 'icon' ? 'block' : 'none';
        if (tEl) tEl.style.display = type === 'text' ? 'block' : 'none';
        if (mEl) mEl.style.display = type === 'image' ? 'block' : 'none';
        if (posEl) posEl.style.display = type === 'none' ? 'none' : 'block';

        const extSection = document.getElementById('reply-jump-external-section');
        if (extSection) extSection.style.display = (value !== 'none') ? 'block' : 'none';
    }

    if (prop === 'showTime') {
        const methodSection = document.getElementById('reply-time-hide-method-section');
        if (methodSection) methodSection.style.display = value ? 'none' : 'block';
    }

    if (prop === 'jumpBtnExternal') {
        const extSettings = document.getElementById('reply-jump-external-settings');
        if (extSettings) extSettings.style.display = value ? 'block' : 'none';
    }

    updatePreview();
}

function handleReplyJumpUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bubbleConfig.replyJumpBtnUrl = e.target.result;
            document.getElementById('reply-jump-url').value = '(已上传)';
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function syncReplyUIControls() {
    const bc = bubbleConfig;
    const posEl = document.getElementById('reply-position');
    const barStyleEl = document.getElementById('reply-bar-style');
    const barWidthEl = document.getElementById('reply-bar-width');
    const bgRadiusEl = document.getElementById('reply-bg-radius');
    const jumpTypeEl = document.getElementById('reply-jump-type');
    
    if (posEl) posEl.value = bc.replyPosition;
    if (barStyleEl) barStyleEl.value = bc.replyBarStyle;
    if (barWidthEl) barWidthEl.value = bc.replyBarWidth;
    if (bgRadiusEl) bgRadiusEl.value = bc.replyBgRadius;
    if (jumpTypeEl) jumpTypeEl.value = bc.replyJumpBtnType;
    
    const barWidthVal = document.getElementById('reply-bar-width-val');
    const bgRadiusVal = document.getElementById('reply-bg-radius-val');
    if (barWidthVal) barWidthVal.textContent = bc.replyBarWidth + 'px';
    if (bgRadiusVal) bgRadiusVal.textContent = bc.replyBgRadius + 'px';
    
    const lineSettings = document.getElementById('reply-bar-line-settings');
    if (lineSettings) lineSettings.style.display = bc.replyBarStyle === 'line' ? 'block' : 'none';
}

/* 辅助函数：生成文字颜色样式（支持渐变） */
function getGradientTextStyleForReply(colorKey, fallbackColor) {
    const isGradient = colorPickerRegistry[colorKey] && cpIsGradient(colorKey);
    const colorVal = colorPickerRegistry[colorKey] ? cpGetCssValue(colorKey) : fallbackColor;
    
    if (isGradient) {
        return `background-image: ${colorVal}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; display: inline-block;`;
    } else {
        return `color: ${colorVal};`;
    }
}



// 初始化引用相关颜色选择器
initColorPicker('reply-bar-color-picker', 'replyBarColor', '竖条颜色', {
    type: 'solid', color: '#007AFF', opacity: 100,
    gradientColors: [{ color: '#007AFF', position: 0 }, { color: '#0055CC', position: 100 }],
    direction: 'to bottom'
});
initColorPicker('reply-bg-color-picker', 'replyBgColor', '引用背景色', {
    type: 'solid', color: '#F3F3F3', opacity: 100,
    gradientColors: [{ color: '#F3F3F3', position: 0 }, { color: '#E8E8E8', position: 100 }],
    direction: 'to right'
});
initColorPicker('reply-sender-color-picker', 'replySenderColor', '发送者颜色', {
    type: 'solid', color: '#666666', opacity: 100,
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#666666', position: 100 }],
    direction: 'to right'
});
initColorPicker('reply-time-color-picker', 'replyTimeColor', '时间颜色', {
    type: 'solid', color: '#666666', opacity: 100,
    gradientColors: [{ color: '#999999', position: 0 }, { color: '#BBBBBB', position: 100 }],
    direction: 'to right'
});
initColorPicker('reply-msg-color-picker', 'replyMsgColor', '消息颜色', {
    type: 'solid', color: '#333333', opacity: 100,
    gradientColors: [{ color: '#666666', position: 0 }, { color: '#888888', position: 100 }],
    direction: 'to right'
});
initColorPicker('reply-jump-color-picker', 'replyJumpColor', '按钮颜色', {
    type: 'solid', color: '#BCBCBC', opacity: 100,
    gradientColors: [{ color: '#BCBCBC', position: 0 }, { color: '#999999', position: 100 }],
    direction: 'to right'
});
initColorPicker('reply-jump-bg-picker', 'replyJumpBg', '按钮背景', {
    type: 'solid', color: '#ffffff', opacity: 0,
    gradientColors: [{ color: '#FFFFFF', position: 0 }, { color: '#F0F0F0', position: 100 }],
    direction: 'to right'
});
// 跳转按钮外置装饰颜色
initColorPicker('reply-jump-external-bg-picker', 'replyJumpExtBg', '装饰按钮背景', {
    type: 'gradient', color: '#7B68EE', opacity: 100,
    gradientColors: [{ color: '#7B68EE', position: 0 }, { color: '#4A90D9', position: 50 }, { color: '#5B9BD5', position: 100 }],
    direction: 'to bottom right'
});

initColorPicker('reply-jump-external-text-color-picker', 'replyJumpExtText', '装饰按钮文字', {
    type: 'solid', color: '#FFFFFF', opacity: 100,
    gradientColors: [{ color: '#FFFFFF', position: 0 }, { color: '#F0F0F0', position: 100 }],
    direction: 'to right'
});

// --- 系统消息颜色配置 ---
initColorPicker('system-bg-color-picker', 'systemBgColor', '背景颜色', {
    type: 'solid', color: '#ffffff', opacity: 0,
    gradientColors: [{ color: '#F5F5F5', position: 0 }, { color: '#E8E8E8', position: 100 }],
    direction: 'to right'
});

initColorPicker('system-font-color-picker', 'systemFontColor', '字体颜色', {
    type: 'solid', color: '#999999', opacity: 100,
    gradientColors: [{ color: '#999999', position: 0 }, { color: '#666666', position: 100 }],
    direction: 'to right'
});

initColorPicker('system-border-color-picker', 'systemBorderColor', '边框颜色', {
    type: 'solid', color: '#dddddd', opacity: 100,
    gradientColors: [{ color: '#dddddd', position: 0 }, { color: '#bbbbbb', position: 100 }],
    direction: 'to right'
});

initShadowPicker('system-shadow-picker', 'systemShadow', '系统消息阴影', {
    enabled: false, type: 'solid', color: '#000000', opacity: 10,
    x: 0, y: 1, blur: 3, spread: 0,
    direction: 'to right',
    gradientColors: [{ color: '#000000', position: 0 }, { color: '#666666', position: 100 }]
});

// 处理引用区域字体上传
function handleReplyFontUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            applyReplyFont(e.target.result);
            document.getElementById('reply-font-url').value = '(已上传)';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ==================== 系统消息配置 ====================
function updateSystemConfig(prop, value) {
    const numProps = ['fontSize', 'radius', 'padX', 'padY', 'borderWidth'];
    if (numProps.includes(prop)) {
        styleConfig.system[prop] = parseInt(value);
    } else {
        styleConfig.system[prop] = value;
    }
    
    // ★ 修复：设置背景图URL时自动切换到图片模式
    if (prop === 'bgUrl' && value) {
        styleConfig.system.useColorBg = false;
    }
    
    updatePreview();
}

function toggleSystemBgMode(useColor) {
    styleConfig.system.useColorBg = useColor;
    document.getElementById('system-bg-color-section').style.display = useColor ? 'block' : 'none';
    document.getElementById('system-bg-url-section').style.display = useColor ? 'none' : 'block';
    
    if (useColor) {
        styleConfig.system.bgUrl = '';
    }
    
    updatePreview();
}

function handleSystemBgUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            styleConfig.system.bgUrl = e.target.result;
            document.getElementById('system-bg-url').value = '(已上传)';
            
            // ★ 修复：上传后强制切换到图片模式
            styleConfig.system.useColorBg = false;
            
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function applySystemFont(url) {
    if (!url) return;
    let styleEl = document.getElementById('system-font-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'system-font-style';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
        @font-face {
            font-family: 'SystemMsgFont';
            src: url('${url}');
            font-display: swap;
        }
    `;
    styleConfig.system.fontFamily = 'SystemMsgFont';
    updatePreview();
}

function handleSystemFontUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('system-font-url').value = '(已上传)';
            applySystemFont(e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 应用引用区域字体
function applyReplyFont(url) {
    if (!url) return;
    bubbleConfig.replyFontUrl = url;
    
    let styleEl = document.getElementById('reply-font-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'reply-font-style';
        document.head.appendChild(styleEl);
    }
    // 强制优先级
    styleEl.textContent = `
        @font-face {
            font-family: 'ReplyCustomFont';
            src: url('${url}');
            font-display: swap;
        }
    `;
    bubbleConfig.replyFontFamily = 'ReplyCustomFont';
    updatePreview();
}

// 处理引用区域背景上传
function handleReplyBgUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bubbleConfig.replyBgUrl = e.target.result;
            document.getElementById('reply-bg-url').value = '(已上传)';
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 处理前缀图标上传 (新增)
function handleReplyPrefixIconUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            bubbleConfig.replyPrefixIconUrl = e.target.result;
            document.getElementById('reply-prefix-icon-url').value = '(已上传)';
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 重写同步UI函数，确保所有开关和输入框都对齐
const _origSyncReply = syncReplyUIControls; 
syncReplyUIControls = function() {
    const bc = bubbleConfig;
    
    // 基础控件
    setInputValue('reply-position', bc.replyPosition);
    setInputValue('reply-bar-style', bc.replyBarStyle);
    setInputValue('reply-jump-type', bc.replyJumpBtnType);
    setInputValue('reply-font-url', bc.replyFontUrl);
    setInputValue('reply-bg-url', bc.replyBgUrl);
    setInputValue('reply-prefix-icon-nav', bc.replyPrefixIconNav || 'ri-chat-quote-fill');
    setInputValue('reply-prefix-icon-url', bc.replyPrefixIconUrl);
    setInputValue('reply-jump-icon-name', bc.replyJumpBtnIcon);
    setInputValue('reply-jump-text-content', bc.replyJumpBtnText || '↑');
    setInputValue('reply-jump-url', bc.replyJumpBtnUrl);

     
    const senderSwitch = document.getElementById('reply-show-sender');
    const timeSwitch = document.getElementById('reply-show-time');
    if(senderSwitch) senderSwitch.checked = bc.replyShowSender !== false;
    if(timeSwitch) timeSwitch.checked = bc.replyShowTime !== false;

    // 数值与滑块双向同步
    syncRangeAndInput('reply-bar-width', 'reply-bar-width-input', bc.replyBarWidth);
    syncRangeAndInput('reply-bg-radius', 'reply-bg-radius-input', bc.replyBgRadius);
    syncRangeAndInput('reply-padding', 'reply-padding-input', bc.replyPadding || 6);
    syncRangeAndInput('reply-font-size', 'reply-font-size-input', bc.replyFontSize || 12);
    syncRangeAndInput('reply-jump-size', 'reply-jump-size-input', bc.replyJumpBtnSize || 16);
    syncRangeAndInput('reply-jump-width', 'reply-jump-width-input', bc.replyJumpBtnWidth || 24);
syncRangeAndInput('reply-jump-height', 'reply-jump-height-input', bc.replyJumpBtnHeight || 24);
    syncRangeAndInput('reply-jump-radius', 'reply-jump-radius-input', bc.replyJumpBtnRadius || 50);
    
setInputValue('reply-bar-placement', bc.replyBarPlacement || 'inside');
syncRangeAndInput('reply-bar-offset-x', 'reply-bar-offset-x-input', bc.replyBarOffsetX || 0);
syncRangeAndInput('reply-bar-offset-y', 'reply-bar-offset-y-input', bc.replyBarOffsetY || 0);
const barPosEl = document.getElementById('reply-bar-position-settings');
if (barPosEl) barPosEl.style.display = bc.replyBarStyle === 'none' ? 'none' : 'block';


setInputValue('reply-jump-placement', bc.replyJumpBtnPlacement || 'inside');
syncRangeAndInput('reply-jump-offset-x', 'reply-jump-offset-x-input', bc.replyJumpBtnOffsetX || 0);
syncRangeAndInput('reply-jump-offset-y', 'reply-jump-offset-y-input', bc.replyJumpBtnOffsetY || 0);
const jumpPosEl = document.getElementById('reply-jump-position-settings');
if (jumpPosEl) jumpPosEl.style.display = bc.replyJumpBtnType === 'none' ? 'none' : 'block';

    
    const lineSettings = document.getElementById('reply-bar-line-settings');
    const iconSettings = document.getElementById('reply-bar-icon-settings');
    if (lineSettings) lineSettings.style.display = bc.replyBarStyle === 'line' ? 'block' : 'none';
    if (iconSettings) iconSettings.style.display = bc.replyBarStyle === 'icon' ? 'block' : 'none';
    
    const jumpIconEl = document.getElementById('reply-jump-icon-settings');
    const jumpTextEl = document.getElementById('reply-jump-text-settings');
    const jumpImageEl = document.getElementById('reply-jump-image-settings');
    if (jumpIconEl) jumpIconEl.style.display = bc.replyJumpBtnType === 'icon' ? 'block' : 'none';
    if (jumpTextEl) jumpTextEl.style.display = bc.replyJumpBtnType === 'text' ? 'block' : 'none';
    if (jumpImageEl) jumpImageEl.style.display = bc.replyJumpBtnType === 'image' ? 'block' : 'none';
    // 时间戳隐藏方式
const timeMethodSection = document.getElementById('reply-time-hide-method-section');
if (timeMethodSection) timeMethodSection.style.display = (bc.replyShowTime === false) ? 'block' : 'none';
setInputValue('reply-time-hide-method', bc.replyTimeHideMethod || 'display-none');

// 跳转按钮外置
const extSection = document.getElementById('reply-jump-external-section');
if (extSection) extSection.style.display = (bc.replyJumpBtnType !== 'none') ? 'block' : 'none';
const extCheck = document.getElementById('reply-jump-external');
if (extCheck) extCheck.checked = bc.replyJumpBtnExternal || false;
const extSettings = document.getElementById('reply-jump-external-settings');
if (extSettings) extSettings.style.display = bc.replyJumpBtnExternal ? 'block' : 'none';
setInputValue('reply-jump-external-text', bc.replyJumpBtnExternalText || '跳转');
setInputValue('reply-jump-external-pos', bc.replyJumpBtnExternalPos || 'right');
syncRangeAndInput('reply-jump-external-gap', 'reply-jump-external-gap-input', bc.replyJumpBtnExternalGap || 6);
syncRangeAndInput('reply-jump-external-fontsize', 'reply-jump-external-fontsize-input', bc.replyJumpBtnExternalFontSize || 11);
syncRangeAndInput('reply-jump-external-radius', 'reply-jump-external-radius-input', bc.replyJumpBtnExternalRadius || 4);
syncRangeAndInput('reply-jump-external-padx', 'reply-jump-external-padx-input', bc.replyJumpBtnExternalPadX || 10);
syncRangeAndInput('reply-jump-external-pady', 'reply-jump-external-pady-input', bc.replyJumpBtnExternalPadY || 3);
}

function setInputValue(id, val) {
    const el = document.getElementById(id);
    if(el) el.value = val === undefined ? '' : val;
}
function syncRangeAndInput(rangeId, inputId, val) {
    const range = document.getElementById(rangeId);
    const input = document.getElementById(inputId);
    if(range) range.value = val;
    if(input) input.value = val;
}

let _undoOnPointerUp = null;
document.addEventListener('pointerup', function() {
    if (_initPhase) return;
    clearTimeout(_undoOnPointerUp);
    _undoOnPointerUp = setTimeout(function() {
        var currentState = getGlobalState();
        if (currentState !== _lastSavedState) {
            if (_lastSavedState) {
                undoStack.push(_lastSavedState);
                if (undoStack.length > MAX_UNDO) undoStack.shift();
                redoStack.length = 0;
            }
            _lastSavedState = currentState;
            updateUndoRedoButtons();
        }
    }, 300);
});

/* ================== 新增：全局布局 更新逻辑 ================== */

function updateChatAreaLayout(type, flow, value) {
    if (type === 'scale') {
        styleConfig.chatArea.scale = parseInt(value);
    } else {
        styleConfig.chatArea[type][flow] = parseInt(value);
    }
    applyGlobalLayoutToPreview();
}

function updateTopBar(elem, prop, value) {
    if (prop === 'x' || prop === 'y' || prop === 'size' || prop === 'height') {
        value = parseInt(value);
    }
    
    if(!styleConfig.topBar[elem]) styleConfig.topBar[elem] = {};
    
    styleConfig.topBar[elem][prop] = value;
    applyGlobalLayoutToPreview();
}

function handleTopBarIconUpload(elem, input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            styleConfig.topBar[elem].url = e.target.result;
            
            const textInput = input.parentElement.previousElementSibling.querySelector('input[type="text"]');
            if(textInput) textInput.value = '(已上传)';
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function updateBottomBar(elem, prop, value) {
  
    const numProps = ['x', 'y', 'width', 'height', 'radius', 'borderWidth', 'size'];
    if (numProps.includes(prop)) {
        value = parseInt(value);
    }

    if (!styleConfig.bottomBar[elem]) styleConfig.bottomBar[elem] = {};
    
    styleConfig.bottomBar[elem][prop] = value;
    applyGlobalLayoutToPreview();
}
function applyGlobalLayoutToPreview() {
    const msgs = document.getElementById('previewMessages');
    const ca = styleConfig.chatArea;
    if (msgs) {
        const totalTop = ca.padding.t + ca.margin.t;
        const totalRight = ca.padding.r + ca.margin.r;
        const totalBottom = ca.padding.b + ca.margin.b;
        const totalLeft = ca.padding.l + ca.margin.l;

        msgs.style.padding = `${totalTop}px ${totalRight}px ${totalBottom}px ${totalLeft}px`;
        if (ca.bgUrl) {
            msgs.style.background = `url('${ca.bgUrl}') center/cover no-repeat fixed`;
        } else {
            const bgVal = (typeof colorPickerRegistry !== 'undefined' && colorPickerRegistry['chatAreaBg']) 
                ? cpGetCssValue('chatAreaBg') : '#FFFFFF';
            msgs.style.background = bgVal;
        }
        
        // 整体缩放 (zoom) 实现
        const scaleVal = ca.scale !== undefined ? ca.scale : 100;
        msgs.style.zoom = scaleVal / 100;
    }

    const tb = styleConfig.topBar;
    const header = document.querySelector('.preview-header');

    if (header) {
        const topBgVal = (typeof colorPickerRegistry !== 'undefined' && colorPickerRegistry['topBarBg']) 
            ? cpGetCssValue('topBarBg') : '#F9F9F9';
        
       // ★★★ 修复顶栏背景赋值（拆开写防止浏览器丢弃属性） ★★★
if (tb.container && tb.container.bgUrl) {
    header.style.backgroundImage = `url('${tb.container.bgUrl}')`;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
    header.style.backgroundRepeat = 'no-repeat';
    header.style.backgroundColor = 'transparent';
} else {
    header.style.backgroundImage = 'none';
    header.style.background = topBgVal;
}
        
        if (tb.container && tb.container.height) header.style.height = tb.container.height + 'px';
        if (tb.container && tb.container.border) header.style.borderBottom = tb.container.border;
    }

    const applyColorToEl = (el, pickerKey, fallbackHex) => {
        if (!el) return;
        const colorVal = (typeof colorPickerRegistry !== 'undefined' && colorPickerRegistry[pickerKey]) 
            ? cpGetCssValue(pickerKey) : fallbackHex;
        
        if (colorPickerRegistry[pickerKey] && cpIsGradient(pickerKey)) {
             el.style.backgroundImage = colorVal;
             el.style.webkitBackgroundClip = 'text';
             el.style.backgroundClip = 'text';
             el.style.webkitTextFillColor = 'transparent';
             el.style.color = 'transparent'; 
        } else {
             el.style.color = colorVal;
             el.style.backgroundImage = 'none';
             el.style.webkitTextFillColor = colorVal;
        }
    };

    const backBtn = document.querySelector('.preview-back-btn');
    if (backBtn && tb.backBtn) {
        backBtn.style.transform = `translate(${tb.backBtn.x}px, ${tb.backBtn.y}px)`;
        
        const innerSpan = backBtn.querySelector('span'); 
        if (innerSpan) {
            innerSpan.style.fontSize = (tb.backBtn.size || 28) + 'px'; 
            applyColorToEl(innerSpan, 'topBarBackColor', '#333333');
        }

        if (tb.backBtn.url) {
             backBtn.innerHTML = `<img src="${tb.backBtn.url}" style="width:${tb.backBtn.size}px;height:${tb.backBtn.size}px;object-fit:contain;">`;
        } else {
             if(!innerSpan) backBtn.innerHTML = `<span class="preview-back-btn-bracket" style="font-size:${tb.backBtn.size}px">‹</span>`;
        }
    }

    const title = document.querySelector('.preview-header-title');
    if (title && tb.title) {
        title.style.transform = `translate(${tb.title.x}px, ${tb.title.y}px)`;
        title.style.fontSize = (tb.title.size || 18) + 'px'; 
        applyColorToEl(title, 'topBarTitleColor', '#333333'); // 修复颜色
    }


    const rightBtns = document.querySelectorAll('.preview-header-btn');

    // 线下按钮 (第一个)
    if (rightBtns.length > 0 && tb.offlineBtn) {
        const offlineBtn = rightBtns[0];
        offlineBtn.style.transform = `translate(${tb.offlineBtn.x}px, ${tb.offlineBtn.y}px)`;
        offlineBtn.style.fontSize = (tb.offlineBtn.size || 22) + 'px'; 
        applyColorToEl(offlineBtn, 'topBarOfflineColor', '#333333'); 

        if (tb.offlineBtn.url) {
             offlineBtn.innerHTML = `<img src="${tb.offlineBtn.url}" style="width:${tb.offlineBtn.size}px;height:${tb.offlineBtn.size}px;object-fit:contain;">`;
        } else {
             if (!offlineBtn.querySelector('i')) offlineBtn.innerHTML = `<i class="ri-door-open-fill"></i>`;
        }
    }


    if (rightBtns.length > 1 && tb.moreBtn) {
        const moreBtn = rightBtns[1];
        moreBtn.style.transform = `translate(${tb.moreBtn.x}px, ${tb.moreBtn.y}px)`;
        moreBtn.style.fontSize = (tb.moreBtn.size || 22) + 'px'; 
        applyColorToEl(moreBtn, 'topBarMoreColor', '#333333'); // 修复颜色

        if (tb.moreBtn.url) {
             moreBtn.innerHTML = `<img src="${tb.moreBtn.url}" style="width:${tb.moreBtn.size}px;height:${tb.moreBtn.size}px;object-fit:contain;">`;
        } else {
             if (!moreBtn.querySelector('i')) moreBtn.innerHTML = `<i class="fa-solid fa-ellipsis-vertical"></i>`;
        }
    }

    // ---- 3. 底栏 ----
    const bb = styleConfig.bottomBar;
    const inputBar = document.querySelector('.preview-input-bar');
    if (inputBar) {
        const botBg = (typeof colorPickerRegistry !== 'undefined' && colorPickerRegistry['bottomBarBg']) 
            ? cpGetCssValue('bottomBarBg') : '#F9F9F9';
            
        // ★★★ 修改底栏背景赋值 ★★★
        if (bb.container && bb.container.bgUrl) {
            inputBar.style.background = `url('${bb.container.bgUrl}') center/cover no-repeat`;
        } else {
            inputBar.style.background = botBg;
        }
        
        if (bb.container && bb.container.border) inputBar.style.borderTop = bb.container.border;
        if (bb.container && bb.container.height) {
            inputBar.style.height = bb.container.height + 'px';
            inputBar.style.boxSizing = 'border-box'; // 确保高度包含边框
        }
    }

    // 辅助函数：应用按钮样式 (背景+图标+大小)
    const applyBtnStyle = (btnEl, config, colorKey, bgKey) => {
        if(!btnEl) return;
        
        // 基础定位
        btnEl.style.transform = `translate(${config.x || 0}px, ${config.y || 0}px)`;
        if (btnEl.classList.contains('active')) btnEl.style.transform += ' rotate(45deg)'; 
        
        // 容器尺寸
        if (config.width) btnEl.style.width = config.width + 'px';
        if (config.height) btnEl.style.height = config.height + 'px';
        if (config.radius || config.radius === 0) btnEl.style.borderRadius = config.radius + '%';

        // 颜色 (图标/文字颜色)
        const colorVal = (typeof colorPickerRegistry !== 'undefined' && colorPickerRegistry[colorKey]) 
            ? cpGetCssValue(colorKey) : config.color;
        
        // 设置文字颜色（纯色或渐变）
        if (colorPickerRegistry[colorKey] && cpIsGradient(colorKey)) {
             btnEl.style.backgroundImage = colorVal;
             btnEl.style.webkitBackgroundClip = 'text';
             btnEl.style.webkitTextFillColor = 'transparent';
             btnEl.style.color = 'transparent';
        } else {
             btnEl.style.color = colorVal;
             btnEl.style.backgroundImage = 'none';
             btnEl.style.webkitTextFillColor = colorVal;
        }

        // 背景颜色应用
        if (bgKey && colorPickerRegistry[bgKey]) {
            btnEl.style.background = cpGetCssValue(bgKey);
            btnEl.style.webkitBackgroundClip = 'border-box'; 
            btnEl.style.webkitTextFillColor = colorVal; 
            btnEl.style.color = colorVal; // 确保背景存在时文字颜色正确
        }

        // ★★★ 处理内容与大小 ★★★
        const iconSize = config.size || 18;
        btnEl.style.fontSize = iconSize + 'px'; 

        // 内容渲染
        if (config.url) {
             btnEl.innerHTML = `<img src="${config.url}" style="width:${iconSize}px;height:${iconSize}px;object-fit:contain;pointer-events:none;">`;
             btnEl.style.border = 'none'; 
             btnEl.style.display = 'flex';
             btnEl.style.alignItems = 'center';
             btnEl.style.justifyContent = 'center';
        }
    };

    // 左侧工具按钮
    const toolBtn = document.getElementById('previewAddBtn');
    applyBtnStyle(toolBtn, bb.toolBtn, 'bottomBarToolColor', 'bottomBarToolBg');
    if (!bb.toolBtn.url) toolBtn.innerHTML = '+'; // 默认内容

    // 续写按钮
    const resumeBtn = document.querySelector('.preview-continue-btn');
    applyBtnStyle(resumeBtn, bb.resumeBtn, 'bottomBarResumeColor', 'bottomBarResumeBg');
    if (!bb.resumeBtn.url) resumeBtn.innerHTML = '<i class="fa-solid fa-comment-dots"></i>';

    // 发送按钮 (特殊处理文字)
    const sendBtn = document.querySelector('.preview-send-btn');
    if (sendBtn) {
        if (bb.sendBtn.width) sendBtn.style.width = bb.sendBtn.width + 'px';
        if (bb.sendBtn.height) sendBtn.style.height = bb.sendBtn.height + 'px';
        if (bb.sendBtn.radius || bb.sendBtn.radius === 0) sendBtn.style.borderRadius = bb.sendBtn.radius + 'px';
        
        sendBtn.style.fontSize = (bb.sendBtn.size || 14) + 'px';
        sendBtn.style.transform = `translate(${bb.sendBtn.x || 0}px, ${bb.sendBtn.y || 0}px)`;

        const sendBg = colorPickerRegistry['bottomBarSendBg'] ? cpGetCssValue('bottomBarSendBg') : '#5B9BD5';
        const sendTextCol = colorPickerRegistry['bottomBarSendText'] ? cpGetCssValue('bottomBarSendText') : '#fff';
        
        sendBtn.style.background = sendBg;
        sendBtn.style.color = sendTextCol;
        
        if (bb.sendBtn.url) {
            const iconSize = bb.sendBtn.size || 14;
            sendBtn.innerHTML = `<img src="${bb.sendBtn.url}" style="width:${iconSize}px;height:${iconSize}px;object-fit:contain;">`;
        } else {
            sendBtn.textContent = bb.sendBtn.text || '发送';
        }
    }

    // 输入框
    const input = document.querySelector('.preview-input-field');
    if (input) {
        if (bb.input.height) input.style.height = bb.input.height + 'px';
        if (bb.input.radius) input.style.borderRadius = bb.input.radius + 'px';
        
        const inpBg = colorPickerRegistry['bottomBarInputBg'] ? cpGetCssValue('bottomBarInputBg') : '#fff';
        input.style.background = inpBg;
        
        const inpBorder = colorPickerRegistry['bottomBarInputBorder'] ? cpGetCssValue('bottomBarInputBorder') : 'transparent';
        const bw = bb.input.borderWidth || 0;
        input.style.border = `${bw}px solid ${inpBorder}`;
        
        input.placeholder = bb.input.placeholder;
    }
}

// ==================== 顶部/底部/区域 样式初始化 ====================

// Chart Area Background
initColorPicker('chat-area-bg-picker', 'chatAreaBg', '背景颜色', {
    type: 'solid', color: '#FFFFFF', opacity: 100,
    gradientColors: [{ color: '#FFFFFF', position: 0 }, { color: '#F0F0F0', position: 100 }],
    direction: 'to bottom'
});

// TopBar Overalls
initColorPicker('topbar-offline-color-picker', 'topBarOfflineColor', '按钮颜色', {
    type: 'solid', color: '#333333', opacity: 100,
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#FF3333', position: 100 }],
    direction: 'to right'
});
initColorPicker('topbar-bg-picker', 'topBarBg', '顶栏背景', {
    type: 'solid', color: '#F9F9F9', opacity: 100,
    gradientColors: [{ color: '#F9F9F9', position: 0 }, { color: '#E0E0E0', position: 100 }],
    direction: 'to bottom'
});
initColorPicker('topbar-back-color-picker', 'topBarBackColor', '返回按钮颜色', {
    type: 'solid', color: '#333333', opacity: 100,
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#555555', position: 100 }],
    direction: 'to right'
});
initColorPicker('topbar-title-color-picker', 'topBarTitleColor', '标题颜色', {
    type: 'solid', color: '#333333', opacity: 100,
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#555555', position: 100 }],
    direction: 'to right'
});
initColorPicker('topbar-more-color-picker', 'topBarMoreColor', '右侧按钮颜色', {
    type: 'solid', color: '#333333', opacity: 100,
    gradientColors: [{ color: '#333333', position: 0 }, { color: '#555555', position: 100 }],
    direction: 'to right'
});

// BottomBar Overalls
initColorPicker('bottombar-bg-picker', 'bottomBarBg', '底栏背景', {
    type: 'solid', color: '#F9F9F9', opacity: 100,
    gradientColors: [{ color: '#F9F9F9', position: 0 }, { color: '#E0E0E0', position: 100 }],
    direction: 'to top'
});
initColorPicker('bottombar-tool-color-picker', 'bottomBarToolColor', '左侧按钮颜色', {
    type: 'solid', color: '#666666', opacity: 100,
    gradientColors: [{ color: '#666666', position: 0 }, { color: '#888888', position: 100 }],
    direction: 'to right'
});
// 左侧按钮背景色
initColorPicker('bottombar-tool-bg-picker', 'bottomBarToolBg', '按钮背景色', {
    type: 'solid', color: '#ffffff', opacity: 0,
    gradientColors: [{ color: '#FFFFFF', position: 0 }, { color: '#F0F0F0', position: 100 }],
    direction: 'to right'
});
initColorPicker('bottombar-input-bg-picker', 'bottomBarInputBg', '输入框背景', {
    type: 'solid', color: '#FFFFFF', opacity: 100,
    gradientColors: [{ color: '#FFFFFF', position: 0 }, { color: '#F0F0F0', position: 100 }],
    direction: 'to right'
});
initColorPicker('bottombar-input-border-picker', 'bottomBarInputBorder', '输入框边框', {
    type: 'solid', color: '#DDDDDD', opacity: 100,
    gradientColors: [{ color: '#DDDDDD', position: 0 }, { color: '#AAAAAA', position: 100 }],
    direction: 'to right'
});
initColorPicker('bottombar-resume-color-picker', 'bottomBarResumeColor', '中间按钮颜色', {
    type: 'solid', color: '#555555', opacity: 100,
    gradientColors: [{ color: '#555555', position: 0 }, { color: '#777777', position: 100 }],
    direction: 'to right'
});
// 中间续写按钮背景色
initColorPicker('bottombar-resume-bg-picker', 'bottomBarResumeBg', '按钮背景色', {
    type: 'solid', color: '#FFFFFF', opacity: 100, // 默认白色底
    gradientColors: [{ color: '#FFFFFF', position: 0 }, { color: '#F0F0F0', position: 100 }],
    direction: 'to right'
});
initColorPicker('bottombar-send-bg-picker', 'bottomBarSendBg', '发送按钮背景', {
    type: 'solid', color: '#5B9BD5', opacity: 100,
    gradientColors: [{ color: '#5B9BD5', position: 0 }, { color: '#4A8BC2', position: 100 }],
    direction: 'to bottom right'
});
initColorPicker('bottombar-send-text-picker', 'bottomBarSendText', '发送按钮文字', {
    type: 'solid', color: '#FFFFFF', opacity: 100,
    gradientColors: [{ color: '#FFFFFF', position: 0 }, { color: '#F0F0F0', position: 100 }],
    direction: 'to right'
});

// === 新增：处理聊天区域背景上传 ===
function handleChatAreaBgUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // 更新配置
            styleConfig.chatArea.bgUrl = e.target.result;
            const urlInput = document.getElementById('chat-area-bg-url');
            if (urlInput) urlInput.value = '(已上传本地图片)';
            
            updatePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// === 新增：顶栏和底栏背景上传 ===
function handleTopBarBgUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if(!styleConfig.topBar.container) styleConfig.topBar.container = {};
            styleConfig.topBar.container.bgUrl = e.target.result;
            const urlInput = document.getElementById('topbar-bg-url');
            if (urlInput) urlInput.value = '(已上传本地图片)';
            applyGlobalLayoutToPreview(); // 刷新预览区
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function handleBottomBarBgUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if(!styleConfig.bottomBar.container) styleConfig.bottomBar.container = {};
            styleConfig.bottomBar.container.bgUrl = e.target.result;
            const urlInput = document.getElementById('bottombar-bg-url');
            if (urlInput) urlInput.value = '(已上传本地图片)';
            applyGlobalLayoutToPreview(); // 刷新预览区
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ★★★ 径向渐变高级配置 ★★★
bubbleConfig.textBgRadialShape = 'ellipse';
bubbleConfig.textBgRadialRx = 60;
bubbleConfig.textBgRadialRy = 45;
bubbleConfig.textBgRadialCx = 50;
bubbleConfig.textBgRadialCy = 50;
bubbleConfig.textBgBlur = 0;
bubbleConfig.textBgWidth = 0;
bubbleConfig.textBgHeight = 0;
bubbleConfig.textBgOffsetX = 0;
bubbleConfig.textBgOffsetY = 0;

function updateTextBgRadialConfig() {
    bubbleConfig.textBgRadialShape = document.getElementById('text-bg-radial-shape').value;
    bubbleConfig.textBgRadialRx = parseInt(document.getElementById('text-bg-radial-rx').value);
    bubbleConfig.textBgRadialRy = parseInt(document.getElementById('text-bg-radial-ry').value);
    bubbleConfig.textBgRadialCx = parseInt(document.getElementById('text-bg-radial-cx').value);
    bubbleConfig.textBgRadialCy = parseInt(document.getElementById('text-bg-radial-cy').value);

    var ellipseSize = document.getElementById('text-bg-ellipse-size');
    if (ellipseSize) {
        ellipseSize.style.display = bubbleConfig.textBgRadialShape === 'ellipse' ? 'block' : 'none';
    }

    updateTextBgRadialPreview();
    updatePreview();
}

function getTextBgLayerHtml() {
    var bc = bubbleConfig;
    if (!bc.textBgEnabled) return '';

    var bgCss = '';
    if (bc.textBgUrl) {
        bgCss = "background-image: url('" + bc.textBgUrl + "'); background-size: cover; background-position: center;";
    } else if (colorPickerRegistry['textBgColor']) {
        var bgVal = cpGetCssValue('textBgColor');
        bgCss = cpIsGradient('textBgColor')
            ? 'background: ' + bgVal + ';'
            : 'background-color: ' + bgVal + ';';
    }

    if (!bgCss) return '';

    var radiusCss = getTextBgRadiusCss();
    var w = bc.textBgWidth || 0;
    var h = bc.textBgHeight || 0;
    var ox = bc.textBgOffsetX || 0;
    var oy = bc.textBgOffsetY || 0;
    var blur = bc.textBgBlur || 0;

    // 尺寸：0=100%自适应
    var widthCss = w > 0 ? 'width:' + w + 'px;' : 'width:100%;';
    var heightCss = h > 0 ? 'height:' + h + 'px;' : 'height:100%;';

    // 边缘模糊 mask
    var maskCss = '';
    if (blur > 0) {
        var maskGrad = 'linear-gradient(to right, transparent 0px, black ' + blur + 'px, black calc(100% - ' + blur + 'px), transparent 100%), '
                     + 'linear-gradient(to bottom, transparent 0px, black ' + blur + 'px, black calc(100% - ' + blur + 'px), transparent 100%)';
        maskCss = '-webkit-mask-image:' + maskGrad + ';'
                + '-webkit-mask-composite:destination-in;'
                + 'mask-image:' + maskGrad + ';'
                + 'mask-composite:intersect;';
    }

    return '<div style="'
        + 'position:absolute;'
        + 'top:50%;left:50%;'
        + 'transform:translate(calc(-50% + ' + ox + 'px), calc(-50% + ' + oy + 'px));'
        + widthCss + heightCss
        + bgCss
        + 'border-radius:' + radiusCss + ';'
        + maskCss
        + 'pointer-events:none;'
        + 'z-index:0;'
        + '"></div>';
}
function buildTextBgGradientCss(colorConfig) {
    if (!colorConfig) return 'transparent';

    var sorted = colorConfig.gradientColors.slice().sort(function(a, b) { return a.position - b.position; });
    var stops = sorted.map(function(s) { return s.color + ' ' + s.position + '%'; }).join(', ');
    var dir = colorConfig.direction;
    var bc = bubbleConfig;

    if (dir === 'circle' || dir === 'radial') {
        var shape = bc.textBgRadialShape || 'ellipse';
        var cx = bc.textBgRadialCx != null ? bc.textBgRadialCx : 50;
        var cy = bc.textBgRadialCy != null ? bc.textBgRadialCy : 50;

        if (shape === 'ellipse') {
            var rx = bc.textBgRadialRx || 60;
            var ry = bc.textBgRadialRy || 45;
            return 'radial-gradient(ellipse ' + rx + '% ' + ry + '% at ' + cx + '% ' + cy + '%, ' + stops + ')';
        } else {
            return 'radial-gradient(circle at ' + cx + '% ' + cy + '%, ' + stops + ')';
        }
    } else {
        return 'linear-gradient(' + dir + ', ' + stops + ')';
    }
}

function updateTextBgRadialPreview() {
    var preview = document.getElementById('text-bg-radial-preview');
    if (!preview) return;

    var c = colorPickerRegistry['textBgColor'];
    if (!c || c.type !== 'gradient') return;

    preview.style.background = buildTextBgGradientCss(c);
}

function syncTextBgRadialPanel() {
    var c = colorPickerRegistry['textBgColor'];
    var panel = document.getElementById('text-bg-radial-settings');
    if (!panel || !c) return;

    var isRadial = c.type === 'gradient' && (c.direction === 'circle' || c.direction === 'radial');
    panel.style.display = isRadial ? 'block' : 'none';
}

// ★★★ 包装 cpToggleType 联动径向面板 ★★★
var _origCpToggleType = cpToggleType;
cpToggleType = function(key) {
    _origCpToggleType(key);
    if (key === 'textBgColor') {
        syncTextBgRadialPanel();
    }
};

// ★★★ 包装 cpUpdateGradient 联动径向面板 ★★★
var _origCpUpdateGradient = cpUpdateGradient;
cpUpdateGradient = function(key) {
    _origCpUpdateGradient(key);
    if (key === 'textBgColor') {
        syncTextBgRadialPanel();
        updateTextBgRadialPreview();
    }
};

// ★★★ 覆盖 cpGetCssValue，让 textBgColor 使用高级径向渐变 ★★★
var _origCpGetCssValue = cpGetCssValue;
cpGetCssValue = function(key) {
    if (key === 'textBgColor') {
        var c = colorPickerRegistry[key];
        if (!c) return '#333333';

        if (c.type === 'solid') {
            if (c.opacity < 100) {
                var r = parseInt(c.color.slice(1, 3), 16);
                var g = parseInt(c.color.slice(3, 5), 16);
                var b = parseInt(c.color.slice(5, 7), 16);
                return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + (c.opacity / 100) + ')';
            }
            return c.color;
        } else {
            return buildTextBgGradientCss(c);
        }
    }
    return _origCpGetCssValue(key);
};

setTimeout(function() {
    syncTextBgRadialPanel();
}, 100);

function getAbsoluteReplyHtml(isSent, positionMode) {
    const bc = bubbleConfig;
    const fontFamStyle = bc.replyFontFamily ? "font-family: '" + bc.replyFontFamily + "', sans-serif;" : '';
    const showSender = bc.replyShowSender !== false;
const showTime = bc.replyShowTime !== false;
const outerJumpDecoHtml = (() => {
    if (bc.replyJumpBtnType === 'none' || !bc.replyJumpBtnExternal) return '';
    
    // 读取面板上的专属配置
    const extBg = colorPickerRegistry['replyJumpExtBg'] ? cpGetCssValue('replyJumpExtBg') : 'linear-gradient(135deg, #7B68EE, #4A90D9)';
    const extTextColor = colorPickerRegistry['replyJumpExtText'] ? cpGetCssValue('replyJumpExtText') : '#FFFFFF';
    const isExtTextGrad = colorPickerRegistry['replyJumpExtText'] && cpIsGradient('replyJumpExtText');
    const extText = bc.replyJumpBtnExternalText || '跳转';
    const extPos = bc.replyJumpBtnExternalPos || 'right';
const extGap = bc.replyJumpBtnExternalGap !== undefined ? bc.replyJumpBtnExternalGap : 6;
const extFS = bc.replyJumpBtnExternalFontSize !== undefined ? bc.replyJumpBtnExternalFontSize : 11;
const extR = bc.replyJumpBtnExternalRadius !== undefined ? bc.replyJumpBtnExternalRadius : 4;
const extPX = bc.replyJumpBtnExternalPadX !== undefined ? bc.replyJumpBtnExternalPadX : 10;
const extPY = bc.replyJumpBtnExternalPadY !== undefined ? bc.replyJumpBtnExternalPadY : 3;

    // 根据四面方位计算定位
    let posStyle = 'position:absolute;';
    if (extPos === 'right') {
        posStyle += `top:50%;left:100%;transform:translateY(-50%);margin-left:${extGap}px;`;
    } else if (extPos === 'left') {
        posStyle += `top:50%;right:100%;transform:translateY(-50%);margin-right:${extGap}px;`;
    } else if (extPos === 'top') {
        posStyle += `bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:${extGap}px;`;
    } else if (extPos === 'bottom') {
        posStyle += `top:100%;left:50%;transform:translateX(-50%);margin-top:${extGap}px;`;
    }

    // 文字渐变处理
    let textStyle = '';
    if (isExtTextGrad) {
        textStyle = `color:transparent;background:${extTextColor};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;`;
    } else {
        textStyle = `color:${extTextColor};-webkit-text-fill-color:${extTextColor};`;
    }

    // 渲染真正的自定义DOM
    return `<span style="
        ${posStyle}
        padding:${extPY}px ${extPX}px;
        font-size:${extFS}px;
        font-weight:600;
        background:${extBg};
        -webkit-background-clip:padding-box;
        background-clip:padding-box;
        border-radius:${extR}px;
        white-space:nowrap;
        pointer-events:none;
        z-index:51;
        display:flex;align-items:center;justify-content:center;
        ${textStyle}
    ">${extText}</span>`;
})();

    // 背景
    let bgStyle = '';
    if (bc.replyBgUrl) {
        bgStyle = "background: url('" + bc.replyBgUrl + "') center/cover no-repeat;";
    } else {
        const bgColorVal = colorPickerRegistry['replyBgColor'] ? cpGetCssValue('replyBgColor') : '#F7F7F7';
        const isBgGrad = colorPickerRegistry['replyBgColor'] && cpIsGradient('replyBgColor');
        bgStyle = isBgGrad ? 'background: ' + bgColorVal + ';' : 'background-color: ' + bgColorVal + ';';
    }

    // 定位方向
    const posCSS = positionMode === 'above'
        ? 'top: 0; bottom: auto; transform: translateY(calc(-100% - 6px));'
        : 'bottom: 0; top: auto; transform: translateY(calc(100% + 6px));';

    // 对齐
    const alignCSS = isSent ? 'right: 0; left: auto;' : 'left: 0; right: auto;';

    // ========== 前缀（竖条/图标）==========
    let prefixHtml = '';
    const barPlacement = bc.replyBarPlacement || 'inside';
    const barOffX = parseInt(bc.replyBarOffsetX) || 0;
    const barOffY = parseInt(bc.replyBarOffsetY) || 0;
    const barColor = colorPickerRegistry['replyBarColor'] ? cpGetCssValue('replyBarColor') : (bc.replyBarColor || '#007AFF');
    const isBarGrad = colorPickerRegistry['replyBarColor'] && cpIsGradient('replyBarColor');

    if (bc.replyBarStyle === 'line') {
        const barBgCss = isBarGrad
            ? 'background: ' + barColor + ';'
            : 'background-color: ' + barColor + ';';

        const lineEl = '<div style="width:' + (bc.replyBarWidth || 3) + 'px;' + barBgCss + 'border-radius:' + ((bc.replyBarWidth || 3) / 2) + 'px;align-self:stretch;flex-shrink:0;min-height:100%;"></div>';

        if (barPlacement === 'inside') {
            prefixHtml = '<div style="margin-right:8px;flex-shrink:0;display:flex;align-items:stretch;align-self:stretch;transform:translate(' + barOffX + 'px,' + barOffY + 'px);">' + lineEl + '</div>';
        } else {
            prefixHtml = '<div style="position:absolute;right:100%;left:auto;top:0;bottom:0;margin-right:6px;display:flex;align-items:stretch;transform:translate(' + (-barOffX) + 'px,' + barOffY + 'px);">' + lineEl + '</div>';
        }
    } else if (bc.replyBarStyle === 'icon') {
        let iconContent = '';
        if (bc.replyPrefixIconUrl) {
            iconContent = '<img src="' + bc.replyPrefixIconUrl + '" style="width:14px;height:14px;object-fit:contain;">';
        } else {
            iconContent = '<span class="iconify" data-icon="' + (bc.replyPrefixIconNav || 'ri-chat-quote-fill') + '"></span>';
        }

        let iconColorStyle = '';
        if (isBarGrad) {
            iconColorStyle = 'background-image:' + barColor + ';-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;';
        } else {
            iconColorStyle = 'color:' + barColor + ';';
        }

        const iconInner = '<span style="' + iconColorStyle + 'display:flex;align-items:center;">' + iconContent + '</span>';

        if (barPlacement === 'inside') {
            prefixHtml = '<div style="margin-right:6px;display:flex;align-items:center;transform:translate(' + barOffX + 'px,' + barOffY + 'px);">' + iconInner + '</div>';
        } else {
            prefixHtml = '<div style="position:absolute;right:100%;left:auto;top:50%;margin-right:6px;display:flex;align-items:center;transform:translate(' + (-barOffX) + 'px,calc(-50% + ' + barOffY + 'px));">' + iconInner + '</div>';
        }
    }

    
let jumpBtnHtml = '';
if (bc.replyJumpBtnType && bc.replyJumpBtnType !== 'none') {
    jumpBtnHtml = '<button style="'
        + 'position:absolute;'
        + 'top:0;left:0;right:0;bottom:0;'
        + 'width:100%;height:100%;'
        + 'opacity:0;'
        + 'cursor:pointer;'
        + 'z-index:10;'
        + 'background:transparent;'
        + 'border:none;'
        + 'padding:0;margin:0;'
        + 'font-size:0;line-height:0;overflow:hidden;'
        + '"></button>';
}
    if (bc.replyJumpBtnExternal) {
        jumpBtnHtml = '<button style="position:absolute!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100%!important;height:100%!important;opacity:0!important;cursor:pointer!important;z-index:10!important;background:transparent!important;border:none!important;padding:0!important;margin:0!important;font-size:0!important;line-height:0!important;overflow:hidden!important;"></button>';
    } else {
        const jumpColor = colorPickerRegistry['replyJumpColor'] ? cpGetCssValue('replyJumpColor') : (bc.replyJumpBtnColor || '#BCBCBC');
        const jumpBg = colorPickerRegistry['replyJumpBg'] ? cpGetCssValue('replyJumpBg') : (bc.replyJumpBtnBg || 'transparent');
        const isFgGrad = colorPickerRegistry['replyJumpColor'] && cpIsGradient('replyJumpColor');
        const fgStyle = isFgGrad
            ? 'background-image:' + jumpColor + ';-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;display:inline-block;'
            : 'color:' + jumpColor + ';';

        let btnContent = '';
        if (bc.replyJumpBtnType === 'icon') {
            btnContent = '<span class="iconify" data-icon="' + (bc.replyJumpBtnIcon || 'mdi:arrow-collapse-up') + '" style="font-size:' + bc.replyJumpBtnSize + 'px;' + fgStyle + '"></span>';
        } else if (bc.replyJumpBtnType === 'image' && bc.replyJumpBtnUrl) {
            btnContent = '<img src="' + bc.replyJumpBtnUrl + '" style="width:100%;height:100%;object-fit:contain;">';
        } else if (bc.replyJumpBtnType === 'text') {
            btnContent = '<span style="font-size:' + bc.replyJumpBtnSize + 'px;line-height:1;font-weight:bold;' + fgStyle + '">' + (bc.replyJumpBtnText || '↑') + '</span>';
        }

        const jumpPlacement = bc.replyJumpBtnPlacement || 'inside';
        const jumpOffX = parseInt(bc.replyJumpBtnOffsetX) || 0;
        const jumpOffY = parseInt(bc.replyJumpBtnOffsetY) || 0;

        let jumpPosStyle = '';
        if (jumpPlacement === 'inside') {
            jumpPosStyle = 'position:absolute;right:8px;left:auto;top:50%;transform:translate(' + jumpOffX + 'px,calc(-50% + ' + jumpOffY + 'px));';
        } else {
            jumpPosStyle = 'position:absolute;left:100%;right:auto;top:50%;transform:translate(' + (4 + jumpOffX) + 'px,calc(-50% + ' + jumpOffY + 'px));';
        }

        const isBgGrad = colorPickerRegistry['replyJumpBg'] && cpIsGradient('replyJumpBg');
        const bgCss = isBgGrad ? 'background:' + jumpBg + ';' : 'background-color:' + jumpBg + ';';

        jumpBtnHtml = '<button style="width:' + (bc.replyJumpBtnWidth || 24) + 'px;height:' + (bc.replyJumpBtnHeight || 24) + 'px;' + bgCss + 'border-radius:' + (bc.replyJumpBtnRadius || 0) + '%;padding:4px;display:flex;align-items:center;justify-content:center;border:none;z-index:10;cursor:pointer;' + jumpPosStyle + '">' + btnContent + '</button>';
    }
    const senderStyle = getGradientTextStyleForReply('replySenderColor', bc.replySenderColor || '#727272');
    const msgStyle = getGradientTextStyleForReply('replyMsgColor', bc.replyMsgColor || '#727272');
    const timeStyle = getGradientTextStyleForReply('replyTimeColor', bc.replyTimeColor || '#999');

    const senderName = isSent ? 'EVEChat' : '用户';
    const msgText = isSent ? '你好呀' : '你好';
    const hasJumpInside = jumpBtnHtml && (bc.replyJumpBtnPlacement || 'inside') === 'inside';
    const containerBase = 'position:absolute;' + posCSS + alignCSS
        + 'z-index:50;margin:0;'
        + 'padding:' + (bc.replyPadding || 7) + 'px ' + ((bc.replyPadding || 7) + 4) + 'px;'
        + bgStyle
        + 'border:' + (bc.replyBorderWidth || 0.7) + 'px solid ' + (bc.replyBorderColor || '#E6E6E6') + ';'
        + 'border-radius:' + (bc.replyBgRadius || 3) + 'px;'
        + 'max-width:280px;width:max-content;cursor:pointer;'
        + 'box-sizing:border-box;font-size:' + (bc.replyFontSize || 12) + 'px;'
        + fontFamStyle
        + 'overflow:visible;';
        
    if (bc.replyBarStyle === 'sender') {
        let senderPrefixContent = '';
        if (showSender) {
            senderPrefixContent += '<span style="' + senderStyle + 'font-weight:600;">' + senderName + '：</span>';
        }
        senderPrefixContent += '<span style="' + msgStyle + '">' + msgText + '</span>';
        if (showTime) {
            senderPrefixContent += '<span style="margin-left:8px;font-size:' + Math.max(9, (bc.replyFontSize || 12) - 2) + 'px;flex-shrink:0;' + timeStyle + '">10:00</span>';
        }

        return '<div style="' + containerBase + 'display:flex;align-items:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
            + senderPrefixContent
            + jumpBtnHtml
    + outerJumpDecoHtml
    + '</div>';
    }

    const hasHeader = showSender || showTime;

if (hasHeader) {
    let headerHtml = '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;white-space:nowrap;overflow:hidden;">';
    
    if (showSender) {
        headerHtml += '<span style="font-weight:600;font-size:' + Math.max(10, (bc.replyFontSize || 12) - 1) + 'px;flex-shrink:0;'
            + 'padding-right:60px;margin-right:-60px;overflow:hidden;'
            + 'word-spacing:-9999px;'
            + senderStyle + '">' + senderName + '</span>';
    }
    
    if (showTime) {
        headerHtml += '<span style="font-size:0;line-height:0;width:0;height:0;overflow:hidden;position:absolute;left:-9999px;opacity:0;'
            + timeStyle + '">10:00</span>';
    }
    headerHtml += '</div>';

    const msgHtml = '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:' + (bc.replyFontSize || 12) + 'px;line-height:1.3;' + msgStyle + '">' + msgText + '</div>';

    return '<div style="' + containerBase + 'min-width:120px;display:flex;align-items:stretch;">'
        + prefixHtml
        + '<div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;' + (hasJumpInside ? 'padding-right:28px;' : '') + '">'
        + headerHtml
        + msgHtml
        + '</div>'
        + jumpBtnHtml
        + outerJumpDecoHtml
        + '</div>';
}

    return '<div style="' + containerBase + 'display:flex;align-items:stretch;min-height:30px;">'
        + prefixHtml
        + '<div style="flex:1;min-width:0;display:flex;align-items:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;' + (hasJumpInside ? 'padding-right:28px;' : '') + '">'
        + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-size:' + (bc.replyFontSize || 12) + 'px;' + msgStyle + '">' + msgText + '</span>'
        + '</div>'
        + jumpBtnHtml
    + outerJumpDecoHtml
    + '</div>';
}

renderBubbleDecoList();
_initPhase = false;
updateContent();
updatePreview();
setTimeout(function() {
    captureInitialExportStates();
    _lastSavedState = getGlobalState();
}, 200);