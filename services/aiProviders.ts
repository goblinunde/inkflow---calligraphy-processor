/**
 * 多 AI 提供商统一服务接口
 * 💡 支持 Gemini、OpenAI、DeepSeek、Qwen、Groq (LLaMA) 等
 */

// ==================== 类型定义 ====================

export type AIProvider = 'gemini' | 'openai' | 'deepseek' | 'qwen' | 'groq';

export interface AIProviderConfig {
    id: AIProvider;
    name: string;
    description: string;
    supportsImageEdit: boolean;
    baseUrl: string;
    models: string[];
    defaultModel: string;
}

export interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    model?: string;
}

export interface ImageRestoreResult {
    success: boolean;
    imageData?: string; // base64 data URL
    suggestion?: string; // 对于不支持图像编辑的提供商，返回文字建议
    error?: string;
}

// ==================== 提供商配置 ====================

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        description: '支持图像生成/编辑',
        supportsImageEdit: true,
        baseUrl: 'https://generativelanguage.googleapis.com',
        models: ['gemini-2.5-flash-image', 'gemini-2.0-flash', 'gemini-1.5-pro'],
        defaultModel: 'gemini-2.5-flash-image'
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4o 图像理解 + DALL-E 编辑',
        supportsImageEdit: true,
        baseUrl: 'https://api.openai.com',
        models: ['gpt-4o', 'gpt-4o-mini', 'dall-e-3'],
        defaultModel: 'gpt-4o'
    },
    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek',
        description: '仅文本分析（返回处理建议）',
        supportsImageEdit: false,
        baseUrl: 'https://api.deepseek.com',
        models: ['deepseek-chat', 'deepseek-reasoner'],
        defaultModel: 'deepseek-chat'
    },
    qwen: {
        id: 'qwen',
        name: 'Qwen (通义千问)',
        description: '视觉理解为主',
        supportsImageEdit: false,
        baseUrl: 'https://dashscope.aliyuncs.com',
        models: ['qwen-vl-max', 'qwen-vl-plus'],
        defaultModel: 'qwen-vl-max'
    },
    groq: {
        id: 'groq',
        name: 'Groq (LLaMA)',
        description: '仅文本（高速推理）',
        supportsImageEdit: false,
        baseUrl: 'https://api.groq.com',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        defaultModel: 'llama-3.3-70b-versatile'
    }
};

// ==================== Token 管理 ====================

const TOKEN_STORAGE_KEY = 'inkflow-ai-tokens';

export interface StoredTokens {
    [key: string]: string; // provider -> token
}

export const saveToken = (provider: AIProvider, token: string): void => {
    const tokens = loadTokens();
    tokens[provider] = token;
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
};

export const loadTokens = (): StoredTokens => {
    try {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

export const getToken = (provider: AIProvider): string | null => {
    const tokens = loadTokens();
    return tokens[provider] || null;
};

export const removeToken = (provider: AIProvider): void => {
    const tokens = loadTokens();
    delete tokens[provider];
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
};

// ==================== 图像修复 Prompt ====================

const IMAGE_RESTORE_PROMPT = `This is an image of Chinese calligraphy (signatures or characters). 
Please RESTORE this image:
1. Keep the exact shape and style of the text.
2. Make the strokes solid black and high contrast.
3. Remove any paper texture, noise, or watermarks, making the background pure white.
4. Fix any broken or jagged edges in the strokes to make them look like smooth ink.
Return ONLY the restored image.`;

const TEXT_ANALYSIS_PROMPT = `This is an image of Chinese calligraphy. 
Analyze the image quality and provide specific suggestions for:
1. How to improve stroke clarity
2. How to remove background noise
3. Recommended threshold values for binarization
4. Any detected issues with the image
Respond in Chinese.`;

// ==================== Gemini 实现 ====================

async function restoreWithGemini(base64Image: string, apiKey: string, model: string): Promise<ImageRestoreResult> {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const mimeType = base64Image.match(/data:image\/(.*?);base64/)?.[1] || 'png';

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { inlineData: { mimeType: `image/${mimeType}`, data: cleanBase64 } },
                            { text: IMAGE_RESTORE_PROMPT }
                        ]
                    }],
                    generationConfig: {
                        responseModalities: ["image", "text"]
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const candidates = data.candidates;

        if (candidates?.[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    return {
                        success: true,
                        imageData: `data:image/png;base64,${part.inlineData.data}`
                    };
                }
            }
        }

        return { success: false, error: 'AI 未返回图像，可能只返回了文字描述' };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ==================== OpenAI 实现 ====================

async function restoreWithOpenAI(base64Image: string, apiKey: string, model: string): Promise<ImageRestoreResult> {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const mimeType = base64Image.match(/data:image\/(.*?);base64/)?.[1] || 'png';

    try {
        // 💡 GPT-4o 支持图像理解，但不直接生成图像
        // 我们先获取分析建议，然后可以调用 DALL-E 或返回建议
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/${mimeType};base64,${cleanBase64}` }
                        },
                        { type: 'text', text: TEXT_ANALYSIS_PROMPT }
                    ]
                }],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
            return {
                success: true,
                suggestion: content
            };
        }

        return { success: false, error: 'OpenAI 未返回有效响应' };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ==================== DeepSeek 实现 ====================

async function analyzeWithDeepSeek(base64Image: string, apiKey: string, model: string): Promise<ImageRestoreResult> {
    try {
        // 💡 DeepSeek 不支持图像输入，只能提供通用建议
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{
                    role: 'user',
                    content: '我有一张中国书法图片需要处理，请提供以下建议：\n1. 如何提高笔画清晰度\n2. 如何去除背景噪声\n3. 推荐的二值化阈值范围\n4. 常见的图像处理技巧'
                }],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
            return {
                success: true,
                suggestion: content
            };
        }

        return { success: false, error: 'DeepSeek 未返回有效响应' };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ==================== Qwen 实现 ====================

async function analyzeWithQwen(base64Image: string, apiKey: string, model: string): Promise<ImageRestoreResult> {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    try {
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: `data:image/png;base64,${cleanBase64}` } },
                        { type: 'text', text: TEXT_ANALYSIS_PROMPT }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
            return {
                success: true,
                suggestion: content
            };
        }

        return { success: false, error: 'Qwen 未返回有效响应' };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ==================== Groq (LLaMA) 实现 ====================

async function analyzeWithGroq(base64Image: string, apiKey: string, model: string): Promise<ImageRestoreResult> {
    try {
        // 💡 Groq 不支持图像输入，只能提供通用建议
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{
                    role: 'user',
                    content: '我有一张中国书法图片需要处理，请提供以下建议：\n1. 如何提高笔画清晰度\n2. 如何去除背景噪声\n3. 推荐的二值化阈值范围\n4. 常见的图像处理技巧'
                }],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
            return {
                success: true,
                suggestion: content
            };
        }

        return { success: false, error: 'Groq 未返回有效响应' };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ==================== 统一调用接口 ====================

export async function restoreImageWithAI(
    base64Image: string,
    config: AIConfig
): Promise<ImageRestoreResult> {
    const { provider, apiKey, model } = config;
    const providerConfig = AI_PROVIDERS[provider];
    const selectedModel = model || providerConfig.defaultModel;

    if (!apiKey) {
        return { success: false, error: '请先配置 API Token' };
    }

    switch (provider) {
        case 'gemini':
            return restoreWithGemini(base64Image, apiKey, selectedModel);
        case 'openai':
            return restoreWithOpenAI(base64Image, apiKey, selectedModel);
        case 'deepseek':
            return analyzeWithDeepSeek(base64Image, apiKey, selectedModel);
        case 'qwen':
            return analyzeWithQwen(base64Image, apiKey, selectedModel);
        case 'groq':
            return analyzeWithGroq(base64Image, apiKey, selectedModel);
        default:
            return { success: false, error: '不支持的 AI 提供商' };
    }
}

// ==================== Token 验证 ====================

export async function validateToken(provider: AIProvider, apiKey: string): Promise<boolean> {
    try {
        switch (provider) {
            case 'gemini': {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
                );
                return response.ok;
            }
            case 'openai': {
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                return response.ok;
            }
            case 'deepseek': {
                const response = await fetch('https://api.deepseek.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                return response.ok;
            }
            case 'qwen': {
                // Qwen API 需要实际调用才能验证
                return apiKey.length > 10;
            }
            case 'groq': {
                const response = await fetch('https://api.groq.com/openai/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                return response.ok;
            }
            default:
                return false;
        }
    } catch {
        return false;
    }
}
