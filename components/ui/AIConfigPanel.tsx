import React, { useState, useEffect } from 'react';
import { Key, Check, X, ChevronDown, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';
import {
    AIProvider,
    AI_PROVIDERS,
    saveToken,
    getToken,
    removeToken,
    validateToken
} from '../../services/aiProviders';

interface AIConfigPanelProps {
    selectedProvider: AIProvider;
    onProviderChange: (provider: AIProvider) => void;
    onConfigured: (hasValidToken: boolean) => void;
    t: any;
}

/**
 * AI 配置面板组件 - 管理多个 AI 提供商的 Token
 */
export const AIConfigPanel: React.FC<AIConfigPanelProps> = ({
    selectedProvider,
    onProviderChange,
    onConfigured,
    t
}) => {
    const [tokenInput, setTokenInput] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'none' | 'valid' | 'invalid'>('none');
    const [savedTokens, setSavedTokens] = useState<Record<string, boolean>>({});

    const providerConfig = AI_PROVIDERS[selectedProvider];

    // 加载已保存的 Token 状态
    useEffect(() => {
        const checkSavedTokens = async () => {
            const statuses: Record<string, boolean> = {};
            for (const provider of Object.keys(AI_PROVIDERS) as AIProvider[]) {
                const token = getToken(provider);
                statuses[provider] = !!token;
            }
            setSavedTokens(statuses);

            // 检查当前选中提供商是否已配置
            const currentToken = getToken(selectedProvider);
            if (currentToken) {
                setTokenInput('••••••••' + currentToken.slice(-4));
                setValidationStatus('valid');
                onConfigured(true);
            } else {
                setTokenInput('');
                setValidationStatus('none');
                onConfigured(false);
            }
        };
        checkSavedTokens();
    }, [selectedProvider, onConfigured]);

    const handleSaveToken = async () => {
        if (!tokenInput || tokenInput.startsWith('••••')) return;

        setIsValidating(true);
        setValidationStatus('none');

        try {
            const isValid = await validateToken(selectedProvider, tokenInput);

            if (isValid) {
                saveToken(selectedProvider, tokenInput);
                setValidationStatus('valid');
                setSavedTokens(prev => ({ ...prev, [selectedProvider]: true }));
                setTokenInput('••••••••' + tokenInput.slice(-4));
                onConfigured(true);
            } else {
                setValidationStatus('invalid');
                onConfigured(false);
            }
        } catch {
            setValidationStatus('invalid');
            onConfigured(false);
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemoveToken = () => {
        removeToken(selectedProvider);
        setTokenInput('');
        setValidationStatus('none');
        setSavedTokens(prev => ({ ...prev, [selectedProvider]: false }));
        onConfigured(false);
    };

    const handleInputChange = (value: string) => {
        if (value.startsWith('••••')) {
            // 用户开始编辑已保存的 token，清空
            setTokenInput('');
        } else {
            setTokenInput(value);
        }
        setValidationStatus('none');
    };

    return (
        <div className="space-y-4">
            {/* 提供商选择 */}
            <div>
                <label className="text-[10px] text-[var(--fg-muted)] block mb-1.5">
                    {t.selectProvider || '选择 AI 提供商'}
                </label>
                <div className="relative">
                    <select
                        value={selectedProvider}
                        onChange={(e) => onProviderChange(e.target.value as AIProvider)}
                        className="w-full appearance-none bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer transition-all"
                    >
                        {Object.values(AI_PROVIDERS).map(provider => (
                            <option key={provider.id} value={provider.id}>
                                {provider.name} {savedTokens[provider.id] ? '✓' : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-muted)] pointer-events-none" />
                </div>
                <p className="text-[10px] text-[var(--fg-muted)] mt-1">
                    {providerConfig.description}
                    {!providerConfig.supportsImageEdit && (
                        <span className="text-yellow-500 ml-1">⚠️ 仅返回建议</span>
                    )}
                </p>
            </div>

            {/* Token 输入 */}
            <div>
                <label className="text-[10px] text-[var(--fg-muted)] block mb-1.5">
                    API Token
                </label>
                <div className="relative">
                    <input
                        type={showToken ? 'text' : 'password'}
                        value={tokenInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={`输入 ${providerConfig.name} API Key...`}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg pl-3 pr-20 py-2 text-sm text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent-primary)] placeholder-[var(--fg-muted)] transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                            onClick={() => setShowToken(!showToken)}
                            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-all"
                            title={showToken ? '隐藏' : '显示'}
                        >
                            {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {savedTokens[selectedProvider] && (
                            <button
                                onClick={handleRemoveToken}
                                className="p-1 rounded hover:bg-red-500/20 text-[var(--fg-muted)] hover:text-red-400 transition-all"
                                title="删除 Token"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 保存按钮 */}
            <button
                onClick={handleSaveToken}
                disabled={!tokenInput || tokenInput.startsWith('••••') || isValidating}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${validationStatus === 'valid'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : validationStatus === 'invalid'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-[var(--accent-primary)] text-white hover:opacity-90 disabled:opacity-50'
                    }`}
            >
                {isValidating ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        验证中...
                    </>
                ) : validationStatus === 'valid' ? (
                    <>
                        <Check className="w-4 h-4" />
                        已保存
                    </>
                ) : validationStatus === 'invalid' ? (
                    <>
                        <X className="w-4 h-4" />
                        Token 无效
                    </>
                ) : (
                    <>
                        <Key className="w-4 h-4" />
                        保存并验证
                    </>
                )}
            </button>

            {/* 已配置提供商列表 */}
            {Object.values(savedTokens).some(v => v) && (
                <div className="pt-3 border-t border-[var(--border-default)]">
                    <p className="text-[10px] text-[var(--fg-muted)] mb-2">已配置的提供商：</p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(savedTokens)
                            .filter(([, hasToken]) => hasToken)
                            .map(([provider]) => (
                                <span
                                    key={provider}
                                    className={`px-2 py-0.5 rounded text-[10px] ${provider === selectedProvider
                                            ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                            : 'bg-[var(--bg-tertiary)] text-[var(--fg-muted)]'
                                        }`}
                                >
                                    {AI_PROVIDERS[provider as AIProvider].name}
                                </span>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIConfigPanel;
