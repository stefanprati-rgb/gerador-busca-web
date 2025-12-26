/**
 * Gerador de Busca OPERA² - JavaScript
 * Chama Gemini API diretamente do navegador
 */

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const BRAND_ALIASES = {
    "CeraVe": ["CeraVe", "CRV"],
    "Vichy": ["Vichy", "VICHY", "VCY"],
    "La Roche-Posay": ["La Roche-Posay", "LRP", "La Roche"],
    "SkinCeuticals": ["SkinCeuticals", "Skinceuticals", "SKC"],
    "ACD Multibrand": ["ACD", "Multibrand"]
};

// ============================================================================
// ELEMENTOS DOM
// ============================================================================

const elements = {
    product: document.getElementById('product'),
    brand: document.getElementById('brand'),
    mediaType: document.getElementById('mediaType'),
    language: document.getElementById('language'),
    generateBtn: document.getElementById('generateBtn'),
    clearBtn: document.getElementById('clearBtn'),
    results: document.getElementById('results'),
    status: document.getElementById('status'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    apiConfig: document.getElementById('apiConfig'),
    apiKey: document.getElementById('apiKey'),
    saveApiKey: document.getElementById('saveApiKey'),
    toast: document.getElementById('toast')
};

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

function getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
}

function saveApiKey(key) {
    localStorage.setItem('gemini_api_key', key);
    updateStatus();
}

function updateStatus() {
    const hasKey = !!getApiKey();
    elements.statusDot.classList.toggle('online', hasKey);
    elements.statusText.textContent = hasKey ? 'IA ativa' : 'Configure a API Key';
    elements.apiConfig.classList.toggle('hidden', hasKey);
}

// ============================================================================
// TOAST NOTIFICATION
// ============================================================================

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2000);
}

// ============================================================================
// COPY TO CLIPBOARD
// ============================================================================

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓';
        button.classList.add('copied');
        showToast('Copiado!');
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 1500);
    });
}

// ============================================================================
// RENDER RESULTS
// ============================================================================

function renderLoading() {
    elements.results.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <div class="loading-text">Gerando termos otimizados...</div>
        </div>
    `;
}

function renderEmpty() {
    elements.results.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">✨</div>
            <div class="empty-title">Pronto para otimizar</div>
            <div class="empty-text">Preencha o produto e clique em Gerar Termos</div>
        </div>
    `;
}

function renderResults(results, isFallback = false) {
    let html = '';
    
    if (isFallback) {
        html += `
            <div class="warning-box">
                <span>⚠️</span>
                <span><strong>Modo simplificado</strong> — IA indisponível</span>
            </div>
        `;
    }
    
    results.forEach((result, index) => {
        html += `
            <div class="result-card">
                <div class="result-header">
                    <span class="result-num">${index + 1}</span>
                    <span class="result-desc">${result.description}</span>
                </div>
                <div class="result-query-row">
                    <div class="result-query">${result.query}</div>
                    <button class="btn-copy" onclick="copyToClipboard('${result.query.replace(/'/g, "\\'")}', this)">📋</button>
                </div>
                <div class="result-filter">🎯 ${result.filter_instructions}</div>
            </div>
        `;
    });
    
    elements.results.innerHTML = html;
}

function renderError(message) {
    elements.results.innerHTML = `
        <div class="warning-box">
            <span>❌</span>
            <span>${message}</span>
        </div>
    `;
}

// ============================================================================
// BUILD PROMPT
// ============================================================================

function buildPrompt(productInfo, brand, mediaType, language) {
    const brandForPrompt = brand === 'Qualquer' ? 'Não especificada' : brand;
    const mediaForPrompt = mediaType === 'Qualquer' ? 'Qualquer tipo' : mediaType;
    const languageForPrompt = language === 'Qualquer' ? 'Qualquer idioma' : language;
    
    // Build filter instructions
    const filterParts = [];
    if (mediaType !== 'Qualquer') filterParts.push(`Tipo: ${mediaType}`);
    if (language !== 'Qualquer') filterParts.push(`Idioma: ${language}`);
    if (brand !== 'Qualquer') filterParts.push(`Signature: ${brand}`);
    const filterHint = filterParts.length > 0 ? filterParts.join(' | ') : 'Nenhum filtro específico';
    
    const brandRule = brand !== 'Qualquer'
        ? `⚠️ MARCA JÁ SERÁ FILTRADA NA BARRA LATERAL! NÃO inclua '${brand}' ou suas siglas nos termos de busca. Foque APENAS no nome do produto.`
        : 'Nenhuma marca selecionada - pode incluir marca se estiver no texto.';
    
    return `
Você é um especialista em buscas no sistema DAM da L'Oréal chamado 'OPERA²'.
Seu objetivo é gerar 5 termos de busca otimizados para encontrar assets.

INFORMAÇÕES DO PRODUTO:
"${productInfo}"

MARCA SELECIONADA: ${brandForPrompt}
TIPO DE MÍDIA: ${mediaForPrompt}
IDIOMA: ${languageForPrompt}

REGRA CRÍTICA - MARCA VS FILTRO:
${brandRule}

REGRAS TÉCNICAS DO OPERA²:
1. Use AND para conectar termos obrigatórios.
2. EVITE aspas duplas.
3. IGNORE palavras genéricas: "Tônico", "Sérum", "Facial", "Creme", "ml", "g".
4. Se houver EAN ou SKU, inclua como termo separado.
5. IGNORE o nome da marca no texto - ela será filtrada.

Gere 5 buscas diferentes:
1. NOME DISTINTO: Palavra mais característica
2. CÓDIGO: EAN/SKU se houver
3. NOME COMPLETO: Palavras-chave com AND
4. VARIAÇÕES: Escrita diferente (junto/separado)
5. SIMPLIFICADA: Sem acentos

Responda APENAS com JSON válido:
[
  {
    "query": "termo de busca",
    "description": "Estratégia",
    "filter_instructions": "Marque na barra lateral: ${filterHint}"
  }
]
`;
}

// ============================================================================
// FALLBACK (sem IA)
// ============================================================================

function generateFallback(productInfo, brand, mediaType, language) {
    let words = productInfo.replace(/[,\.]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !/^\d+$/.test(w));
    
    // Build filter instructions
    const filterParts = [];
    if (mediaType !== 'Qualquer') filterParts.push(`Tipo: ${mediaType}`);
    if (language !== 'Qualquer') filterParts.push(`Idioma: ${language}`);
    if (brand !== 'Qualquer') filterParts.push(`Signature: ${brand}`);
    const filterInstructions = filterParts.length > 0 
        ? `Marque na barra lateral: ${filterParts.join(' | ')}`
        : 'Nenhum filtro específico';
    
    // Remove brand from words if selected
    if (brand !== 'Qualquer') {
        const brandLower = brand.toLowerCase();
        const brandTerms = ['skinceuticals', 'cerave', 'vichy', 'lrp', 'skc', 'crv', 'vcy', 'la', 'roche', 'posay'];
        words = words.filter(w => !brandTerms.includes(w.toLowerCase()) && w.toLowerCase() !== brandLower);
    }
    
    const results = [];
    
    // 1. First distinctive word
    if (words.length > 0) {
        results.push({
            query: words[0],
            description: 'Nome distinto: palavra característica',
            filter_instructions: filterInstructions
        });
    }
    
    // 2. Code (if exists)
    const codes = productInfo.split(/\s+/).filter(w => w.length >= 8 && /\d/.test(w));
    if (codes.length > 0) {
        results.push({
            query: codes[0],
            description: 'Código: EAN ou SKU',
            filter_instructions: filterInstructions
        });
    }
    
    // 3. Multiple words with AND
    if (words.length >= 2) {
        results.push({
            query: words.slice(0, 4).join(' AND '),
            description: 'Nome completo: todas as palavras',
            filter_instructions: filterInstructions
        });
    }
    
    // 4. Original text
    results.push({
        query: productInfo.trim(),
        description: 'Busca direta: texto original',
        filter_instructions: filterInstructions
    });
    
    // 5. Main words
    if (words.length >= 2) {
        results.push({
            query: words.slice(0, 3).join(' '),
            description: 'Palavras principais',
            filter_instructions: filterInstructions
        });
    }
    
    return results.slice(0, 5);
}

// ============================================================================
// CALL GEMINI API
// ============================================================================

async function callGeminiAPI(prompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API Key não configurada');
    }
    
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro na API');
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Resposta inválida');
    }
    
    return JSON.parse(jsonMatch[0]);
}

// ============================================================================
// GENERATE
// ============================================================================

async function generate() {
    const productInfo = elements.product.value.trim();
    if (!productInfo) {
        showToast('Informe o produto');
        return;
    }
    
    const brand = elements.brand.value;
    const mediaType = elements.mediaType.value;
    const language = elements.language.value;
    
    elements.generateBtn.disabled = true;
    renderLoading();
    
    try {
        const apiKey = getApiKey();
        
        if (apiKey) {
            // Try Gemini API
            const prompt = buildPrompt(productInfo, brand, mediaType, language);
            const results = await callGeminiAPI(prompt);
            renderResults(results, false);
        } else {
            // Fallback
            const results = generateFallback(productInfo, brand, mediaType, language);
            renderResults(results, true);
        }
    } catch (error) {
        console.error('Error:', error);
        // Use fallback on error
        const results = generateFallback(productInfo, brand, mediaType, language);
        renderResults(results, true);
    } finally {
        elements.generateBtn.disabled = false;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

elements.generateBtn.addEventListener('click', generate);

elements.clearBtn.addEventListener('click', () => {
    elements.product.value = '';
    renderEmpty();
});

elements.saveApiKey.addEventListener('click', () => {
    const key = elements.apiKey.value.trim();
    if (key) {
        saveApiKey(key);
        elements.apiKey.value = '';
        showToast('API Key salva!');
    }
});

// Enter to submit
elements.product.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        generate();
    }
});

// ============================================================================
// INIT
// ============================================================================

updateStatus();
