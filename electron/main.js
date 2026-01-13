const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// 开发模式检测
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'InkFlow - 书法处理器',
        icon: path.join(__dirname, '../public/icon-512.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        },
        // 现代无边框风格
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 12, y: 12 },
        backgroundColor: '#0f0f14'
    });

    // 加载应用
    if (isDev) {
        // 开发模式：加载本地服务器
        mainWindow.loadURL('http://localhost:9999');
        mainWindow.webContents.openDevTools();
    } else {
        // 生产模式：加载打包后的文件
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // 在默认浏览器中打开外部链接
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// 创建菜单
function createMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                { label: '打开图片...', accelerator: 'CmdOrCtrl+O', click: () => { } },
                { type: 'separator' },
                { label: '导出...', accelerator: 'CmdOrCtrl+Shift+E', click: () => { } },
                { type: 'separator' },
                { role: 'quit', label: '退出' }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { role: 'undo', label: '撤销' },
                { role: 'redo', label: '重做' },
                { type: 'separator' },
                { role: 'cut', label: '剪切' },
                { role: 'copy', label: '复制' },
                { role: 'paste', label: '粘贴' }
            ]
        },
        {
            label: '视图',
            submenu: [
                { role: 'reload', label: '刷新' },
                { role: 'toggleDevTools', label: '开发者工具' },
                { type: 'separator' },
                { role: 'resetZoom', label: '重置缩放' },
                { role: 'zoomIn', label: '放大' },
                { role: 'zoomOut', label: '缩小' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: '全屏' }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于 InkFlow',
                    click: async () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox({
                            type: 'info',
                            title: '关于 InkFlow',
                            message: 'InkFlow - 书法处理器',
                            detail: '版本 1.0.0\n专业书法图像处理工具\n墨迹提取 | 印章分离 | AI 修复'
                        });
                    }
                },
                {
                    label: 'GitHub',
                    click: () => shell.openExternal('https://github.com')
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// 应用就绪
app.whenReady().then(() => {
    createMenu();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
