export type Language = 'en' | 'zh';

export const translations = {
    en: {
        appTitle: 'InkFlow',
        appSubtitle: 'Calligraphy Studio',
        uploadNew: 'Upload New',
        downloadPng: 'Download',
        format: 'Format',
        svg: 'Vector (SVG)',
        png: 'Image (PNG)',

        // AI Section
        aiRestore: 'AI Restore',
        aiDesc: 'Smartly reconstruct strokes and clean artifacts using Gemini AI.',
        autoRepair: 'Auto-Repair',
        restoring: 'Restoring...',

        // Modes
        inkMode: 'Ink Mode',
        photoMode: 'Photo Mode',

        // Sections
        adjustments: 'Adjustments',
        inkExtraction: 'Ink Extraction',
        enhance: 'Enhance',
        resolution: 'Output Size',

        // Controls
        brightness: 'Brightness',
        saturation: 'Saturation',
        saturationMono: 'Saturation (Mono -100)',
        contrast: 'Contrast',
        bgThreshold: 'Background Threshold',
        adaptiveThreshold: 'Adaptive Threshold',
        strokeWeight: 'Stroke Weight',
        inkDensity: 'Ink Density',
        originalColor: 'Original Color',
        blackInk: 'Black Ink',
        edgeBoost: 'Edge Boost',

        sharpness: 'Sharpness',
        denoise: 'Denoise',

        // Background Processing (Phase 4)
        bgProcessing: 'Background & Export',
        bgColor: 'Background Color',
        bgTexture: 'Paper Texture',
        none: 'None',
        rice: 'Rice Paper',
        xuan: 'Antique Xuan',
        parchment: 'Vintage Parchment',
        bamboo: 'Bamboo Fiber',
        gold: 'Gold Flecked',
        silk: 'Silk Mounting',
        transparent: 'Transparent',
        smoothing: 'Smoothing',

        // Watermarks
        watermarks: 'Watermarks',
        imageWatermark: 'Image Watermark',
        uploadWatermark: 'Upload Image',
        supportedFormats: 'Support PNG, JPEG, SVG',
        textWatermark: 'Text Watermark',
        enterWatermarkText: 'Enter watermark text...',
        fontSize: 'Font Size',
        textColor: 'Color',
        addTextWatermark: 'Add Text Watermark',

        reset: 'Reset Parameters',

        // Canvas
        uploadArtwork: 'Upload Artwork',
        dragDrop: 'Drag and drop or select a file to begin processing.',
        selectImage: 'Select Image',
        original: 'Original',
        processedResult: 'Processed Result',
        processing: 'Running Algorithms...',

        // Modals
        help: 'Help',
        about: 'About',
        close: 'Close',

        helpContent: {
            title: 'How to use InkFlow',
            step1: '1. Select Mode',
            step1Desc: 'Use "Ink Mode" to extract strokes from paper. Use "Photo Mode" for regular photo editing.',
            step2: '2. Adjust',
            step2Desc: 'Use sliders to refine the result. "Ink Density" makes text darker. "Saturation -100" creates B&W photos.',
            step3: '3. AI Repair',
            step3Desc: 'If text is damaged, try "Auto-Repair" to reconstruct it using AI.',
            step4: '4. Download',
            step4Desc: 'Save your high-resolution result as PNG.'
        },

        aboutContent: {
            title: 'About InkFlow',
            desc: 'InkFlow is a specialized tool for digitizing Chinese Calligraphy.',
            techTitle: 'Tech Stack',
            techStack: [
                'React 19 (Frontend Framework)',
                'Vite (Build Tool)',
                'TailwindCSS (Styling)',
                'Canvas API (Image Processing)',
                'Google Gemini (AI Restoration)'
            ],
            linksTitle: 'Connect',
            links: [
                { label: 'GitHub', url: 'https://github.com' }, // Placeholder based on user request "my personal links"
                { label: 'Portfolio', url: '#' }
            ],
            version: 'Version 1.2.0',
        }
    },

    zh: {
        appTitle: 'InkFlow',
        appSubtitle: '专业书法处理台',
        uploadNew: '上传图片',
        downloadPng: '下载',
        format: '格式',
        svg: '矢量图 (SVG)',
        png: '位图 (PNG)',

        // AI Section
        aiRestore: 'AI 智能修复',
        aiDesc: '使用 Gemini AI 智能重建笔画并清除瑕疵。',
        autoRepair: '一键修复',
        restoring: '正在修复...',

        // Modes
        inkMode: '水墨模式',
        photoMode: '照片模式',

        // Sections
        adjustments: '基础调整',
        inkExtraction: '水墨提取',
        enhance: '画质增强',
        resolution: '输出尺寸',

        // Controls
        brightness: '亮度',
        saturation: '饱和度',
        saturationMono: '饱和度 (黑白 -100)',
        contrast: '对比度',
        bgThreshold: '背景阈值',
        adaptiveThreshold: '自适应阈值',
        strokeWeight: '笔画粗细',
        inkDensity: '墨色浓度',
        originalColor: '保留原色',
        blackInk: '纯黑水墨',
        edgeBoost: '边缘修补',

        sharpness: '锐化',
        denoise: '降噪',

        // Background Processing
        bgProcessing: '背景处理',
        bgColor: '背景颜色',
        bgTexture: '纸张纹理',
        none: '无',
        rice: '米纸',
        xuan: '仿古宣纸',
        parchment: '复古羊皮纸',
        bamboo: '竹纤维纸',
        gold: '洒金红纸',
        silk: '绫罗装裱',
        transparent: '透明背景',
        smoothing: '边缘平滑',

        // Watermarks
        watermarks: '水印系统',
        imageWatermark: '图片水印',
        uploadWatermark: '上传水印图片',
        supportedFormats: '支持 PNG, JPEG, SVG',
        textWatermark: '文字水印',
        enterWatermarkText: '输入水印文字...',
        fontSize: '字号',
        textColor: '颜色',
        addTextWatermark: '添加文字水印',

        reset: '重置参数',

        // Canvas
        uploadArtwork: '上传书法作品',
        dragDrop: '将图片拖入此处，或点击按钮选择文件。',
        selectImage: '选择图片',
        original: '原图',
        processedResult: '处理结果',
        processing: '正在处理...',

        // Modals
        help: '帮助',
        about: '关于',
        close: '关闭',

        helpContent: {
            title: '使用指南',
            step1: '1. 选择模式',
            step1Desc: '“水墨模式”用于去除背景提取字迹；“照片模式”用于常规修图。',
            step2: '2. 调整参数',
            step2Desc: '调节滑块优化效果。“墨色浓度”可让字迹更黑更实。“饱和度 -100”可转为黑白照片。',
            step3: '3. AI 修复',
            step3Desc: '如果字迹残缺不清，点击“一键修复”利用 AI 进行重绘。',
            step4: '4. 下载结果',
            step4Desc: '将处理好的高清图片保存为 PNG 格式。'
        },

        aboutContent: {
            title: '关于 InkFlow',
            desc: 'InkFlow 是专为书法数字化设计的专业工具。',
            techTitle: '技术栈',
            techStack: [
                'React 19 (前端框架)',
                'Vite (构建工具)',
                'TailwindCSS (样式与毛玻璃)',
                'Canvas API (核心图像算法)',
                'Google Gemini (AI 修复支持)'
            ],
            linksTitle: '个人链接',
            links: [
                { label: 'GitHub', url: 'https://github.com' },
                { label: '个人主页', url: '#' }
            ],
            version: '当前版本 1.2.0',
        }
    }
};
