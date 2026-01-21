/**
 * config_manager.js - 手动管理配置文件工具
 * 
 * 用于在无法访问 Web 面板时，手动查看、解密、修改和加密配置文件。
 * 
 * 使用方法 / Usage:
 * 
 * 1. 查看配置 (View Config):
 *    node config_manager.js view
 *    -> 直接在控制台打印解密后的当前配置。
 * 
 * 2. 导出配置 (Export Config):
 *    node config_manager.js export
 *    -> 将解密后的配置保存到 config_plain.json 文件中，方便您编辑。
 * 
 * 3. 导入配置 (Import Config):
 *    node config_manager.js import config_plain.json
 *    -> 读取 config_plain.json，加密后覆盖写入 data/config.json，并重启服务生效。
 * 
 * 4. 恢复默认 (Reset Config):
 *    node config_manager.js reset
 *    -> 谨慎！将删除现有的配置文件。
 */

const fs = require('fs');
const path = require('path');

// 密钥定义 (与 index.js 保持一致)
const XOR_KEY_B64 = 'bWluZWJvdC10b29sYm94LXhvci1rZXktMjAyNA==';
const XOR_KEY = Buffer.from(XOR_KEY_B64, 'base64').toString();

// 文件路径
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const PLAIN_FILE = 'config_plain.json'; // 导出文件名

// 解密函数
const xorDecrypt = (encoded) => {
    try {
        const text = Buffer.from(encoded, 'base64').toString();
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
        }
        return result;
    } catch { return ''; }
};

// 加密函数
const xorEncrypt = (text) => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
    }
    return Buffer.from(result).toString('base64');
};

const action = process.argv[2];
const arg = process.argv[3];

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('--- Config Manager Tools ---\n');

switch (action) {
    case 'view':
        if (fs.existsSync(CONFIG_FILE)) {
            const content = fs.readFileSync(CONFIG_FILE, 'utf8');
            const decrypted = xorDecrypt(content);
            try {
                // 格式化输出
                const json = JSON.parse(decrypted);
                console.log(JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('解密后的内容非 JSON，可能文件已损坏或密钥不匹配:');
                console.log(decrypted);
            }
        } else {
            console.log('配置文件 (data/config.json) 不存在。');
        }
        break;

    case 'export':
        if (fs.existsSync(CONFIG_FILE)) {
            const content = fs.readFileSync(CONFIG_FILE, 'utf8');
            const decrypted = xorDecrypt(content);
            try {
                const json = JSON.parse(decrypted);
                fs.writeFileSync(PLAIN_FILE, JSON.stringify(json, null, 2), 'utf8');
                console.log(`\u2705 导出成功！\n请编辑当前目录下的 [${PLAIN_FILE}] 文件。`);
                console.log(`编辑完成后，运行 "node config_manager.js import ${PLAIN_FILE}" 写回。`);
            } catch (e) {
                console.error('\u274c 导出失败：配置文件格式错误或解密失败。');
            }
        } else {
            console.log('配置文件 (data/config.json) 不存在。无需导出。');
        }
        break;

    case 'import':
        const importFile = arg || PLAIN_FILE;
        if (fs.existsSync(importFile)) {
            try {
                const content = fs.readFileSync(importFile, 'utf8');
                // 校验是否为合法 JSON
                JSON.parse(content);
                const encrypted = xorEncrypt(content);
                fs.writeFileSync(CONFIG_FILE, encrypted, 'utf8');
                console.log(`\u2705 导入成功！\n配置已加密并写入 [config.json]。\n请重启主程序以应用更改。`);
            } catch (e) {
                console.error(`\u274c 导入失败：[${importFile}] 不是有效的 JSON 文件。`);
            }
        } else {
            console.error(`\u274c 文件 [${importFile}] 不存在。`);
        }
        break;

    case 'reset':
        if (fs.existsSync(CONFIG_FILE)) {
            fs.unlinkSync(CONFIG_FILE);
            console.log('\u2705 配置文件已删除。下次启动时将生成默认配置。');
        } else {
            console.log('配置文件不存在。');
        }
        break;

    default:
        console.log('请指定操作: view, export, import, reset');
        console.log('示例:');
        console.log('  node config_manager.js export   (导出配置编辑)');
        console.log('  node config_manager.js import   (导入编辑好的配置)');
        break;
}
console.log('\n----------------------------');
