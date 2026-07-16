const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const readline = require('readline');

// Parse CLI Arguments
const args = process.argv.slice(2);
const params = {
    name: null,
    ides: null,
    structure: null,
    folders: null,
    mcp: null,
    gitFlow: null,
    force: false
};

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i+1]) params.name = args[++i];
    else if (args[i] === '--ides' && args[i+1]) params.ides = args[++i];
    else if (args[i] === '--structure' && args[i+1]) params.structure = args[++i];
    else if (args[i] === '--folders' && args[i+1]) params.folders = args[++i];
    else if (args[i] === '--mcp' && args[i+1]) params.mcp = args[++i];
    else if (args[i] === '--git-flow' && args[i+1]) params.gitFlow = args[++i];
    else if (args[i] === '--force') params.force = true;
}

const isNonInteractive = params.name !== null || params.structure !== null;

// Title Configuration
if (!isNonInteractive) {
    console.clear();
}
console.log('\x1b[36m=========================================================\x1b[0m');
console.log('\x1b[36m\x1b[1m       WIZARD THIET LAP AGENT CHO DU AN DA NEN TANG      \x1b[0m');
console.log('\x1b[36m=========================================================\x1b[0m');
console.log('\x1b[90m   * Giup tu dong thiet lap phan vai Agent va quy tac\x1b[0m');
console.log('\x1b[90m   * Tuong thich: Antigravity IDE, Cline, OpenCode/Cursor\x1b[0m');
console.log('\x1b[36m=========================================================\x1b[0m');

const targetRoot = __dirname;
const defaultProjectName = path.basename(targetRoot);

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

function writeSafe(filePath, content) {
    if (fs.existsSync(filePath) && !params.force) {
        console.log(`\n\x1b[33m[!] Canh bao: File da ton tai tai: ${filePath}\x1b[0m`);
        return askQuestion("Ban muon lam gi? [1] Ghi de (Overwrite) | [2] Sao luu roi ghi de (Backup & Overwrite) | [3] Bo qua (Skip) [Mac dinh: 2]: ")
            .then(choice => {
                const finalChoice = choice.trim() || "2";
                if (finalChoice === "1") {
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log("  -> Da ghi de file.");
                } else if (finalChoice === "2") {
                    const backupPath = filePath + ".bak_" + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
                    fs.copyFileSync(filePath, backupPath);
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`  -> Da tao ban sao luu tai ${path.basename(backupPath)} va ghi de file.`);
                } else {
                    console.log("  -> Da bo qua khong ghi de.");
                }
            });
    } else {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content, 'utf8');
        return Promise.resolve();
    }
}

function detectMcpServers() {
    const mcpServers = {};
    const pathsToSearch = [];
    
    // Determine paths based on OS
    if (process.platform === 'win32') {
        if (process.env.USERPROFILE) {
            pathsToSearch.push(path.join(process.env.USERPROFILE, '.gemini', 'config', 'mcp_config.json'));
            pathsToSearch.push(path.join(process.env.USERPROFILE, '.gemini', 'settings.json'));
        }
        if (process.env.APPDATA) {
            pathsToSearch.push(path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json'));
            pathsToSearch.push(path.join(process.env.APPDATA, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'mcp_settings.json'));
        }
    } else {
        const home = os.homedir();
        pathsToSearch.push(path.join(home, '.gemini', 'config', 'mcp_config.json'));
        pathsToSearch.push(path.join(home, '.gemini', 'settings.json'));
        if (process.platform === 'darwin') {
            pathsToSearch.push(path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'));
            pathsToSearch.push(path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'mcp_settings.json'));
        } else {
            pathsToSearch.push(path.join(home, '.config', 'Claude', 'claude_desktop_config.json'));
            pathsToSearch.push(path.join(home, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'mcp_settings.json'));
        }
    }

    pathsToSearch.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const servers = data.mcpServers || data.mcp_servers;
                if (servers) {
                    Object.keys(servers).forEach(key => {
                        mcpServers[key] = servers[key];
                    });
                } else if (data && typeof data === 'object') {
                    Object.keys(data).forEach(key => {
                        if (data[key] && (data[key].command || data[key].args)) {
                            mcpServers[key] = data[key];
                        }
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    });

    return mcpServers;
}

function updateGitignore() {
    const gitignorePath = path.join(targetRoot, '.gitignore');
    const rulesToAdd = [
        '.antigravity/cache/',
        'antigravity_config_backup.zip',
        '*.bak_*'
    ];

    let content = '';
    if (fs.existsSync(gitignorePath)) {
        content = fs.readFileSync(gitignorePath, 'utf8');
        const lines = content.split('\n').map(l => l.trim());
        const missingRules = rulesToAdd.filter(rule => {
            return !lines.includes(rule) && !lines.includes('/' + rule);
        });
        
        if (missingRules.length > 0) {
            content += '\n\n# Antigravity Configurations Added by Setup\n' + missingRules.join('\n') + '\n';
            fs.writeFileSync(gitignorePath, content, 'utf8');
            console.log('  -> Updated .gitignore with Antigravity exclusion rules.');
        }
    } else {
        content = '# Gitignore generated for Antigravity\n' + rulesToAdd.join('\n') + '\n';
        fs.writeFileSync(gitignorePath, content, 'utf8');
        console.log('  -> Created new .gitignore with Antigravity exclusion rules.');
    }
}

// Embedded Scripts Code Text
const syncRulesScriptText = `const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, '..', '..');
const agentsJsonPath = path.join(rootPath, '.antigravity', 'agents.json');
const agentsMdPath = path.join(rootPath, '.agents', 'AGENTS.md');

function run() {
    console.log('Starting rules synchronization...');

    if (!fs.existsSync(agentsJsonPath)) {
        console.error('Error: Cannot find agents.json at ' + agentsJsonPath);
        process.exit(1);
    }

    let agentsData;
    try {
        const rawData = fs.readFileSync(agentsJsonPath, 'utf8');
        agentsData = JSON.parse(rawData);
    } catch (e) {
        console.error('Error parsing agents.json:', e.message);
        process.exit(1);
    }

    let workflowText = '';
    if (fs.existsSync(agentsMdPath)) {
        workflowText = fs.readFileSync(agentsMdPath, 'utf8');
    }

    let agentsListText = '';
    if (agentsData.agents && Array.isArray(agentsData.agents)) {
        agentsData.agents.forEach(agent => {
            const scopes = Array.isArray(agent.allowed_scopes) ? agent.allowed_scopes.join(', ') : '';
            const caps = Array.isArray(agent.capabilities) ? agent.capabilities.join(', ') : '';
            agentsListText += '#### Role: ' + agent.role + ' (ID: @' + agent.id + ')\\n';
            agentsListText += '* **Allowed Scopes**: \`' + scopes + '\`\\n';
            agentsListText += '* **Capabilities**: \`' + caps + '\`\\n';
            agentsListText += '* **Instructions**: ' + agent.instruction + '\\n\\n';
        });
    }

    const rulesContent = '# Global & Project AI Rules (Auto-generated)\\n# Day la file cau hinh quy tac dong bo cho da IDE (Cline, OpenCode, Antigravity)\\n\\n' + 
                          workflowText + 
                          '\\n\\n---\\n\\n## He Thong Vai Tro & Phan Vung Hoat Dong (Agent Roles)\\n' + 
                          agentsListText;

    const targets = ['.clinerules', '.cursorrules', '.opencoderules'];
    targets.forEach(target => {
        const targetPath = path.join(rootPath, target);
        try {
            fs.writeFileSync(targetPath, rulesContent, 'utf8');
            console.log('  -> Synchronized ' + target);
        } catch (e) {
            console.error('Error writing to ' + target + ':', e.message);
        }
    });

    // Sync Cursor MDC
    const cursorRulesDir = path.join(rootPath, '.cursor', 'rules');
    if (!fs.existsSync(cursorRulesDir)) {
        try {
            fs.mkdirSync(cursorRulesDir, { recursive: true });
        } catch (e) {}
    }

    if (fs.existsSync(cursorRulesDir)) {
        const reportMdcPath = path.join(cursorRulesDir, 'reports.mdc');
        const reportSection = extractSection(workflowText, '## Quy chuan Bao cao va Thong bao');
        const reportMdcContent = '---\\ndescription: Rules for generating reports (Jira tasks, PR descriptions, test cases, daily checkout)\\nglobs: *\\n---\\n# Reporting & Notification Guidelines\\n\\n' + (reportSection || 'Please refer to main AGENTS.md for reporting guidelines.');
        fs.writeFileSync(reportMdcPath, reportMdcContent, 'utf8');
        console.log('  -> Created/Updated .cursor/rules/reports.mdc');

        const gitMdcPath = path.join(cursorRulesDir, 'git.mdc');
        const gitRules = extractGitRules(workflowText);
        const gitMdcContent = '---\\ndescription: Git workflow rules (branch naming, commit messages, PRs)\\nglobs: *\\n---\\n# Git Workflow Guidelines\\n\\n' + (gitRules || 'Please refer to main AGENTS.md for Git guidelines.');
        fs.writeFileSync(gitMdcPath, gitMdcContent, 'utf8');
        console.log('  -> Created/Updated .cursor/rules/git.mdc');
    }

    console.log('Synchronization complete!');
}

function extractSection(text, headerText) {
    const lines = text.split('\\n');
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(headerText)) {
            startIndex = i;
            break;
        }
    }
    if (startIndex === -1) return null;
    
    const resultLines = [];
    resultLines.push(lines[startIndex]);
    for (let i = startIndex + 1; i < lines.length; i++) {
        if (lines[i].startsWith('## ') && !lines[i].startsWith(headerText)) {
            break;
        }
        resultLines.push(lines[i]);
    }
    return resultLines.join('\\n');
}

function extractGitRules(text) {
    const lines = text.split('\\n');
    let gitRules = [];
    let capturing = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('Git Branch') || line.includes('Git Commit') || line.includes('viet PR') || line.includes('Git Worktree')) {
            capturing = true;
        }
        if (capturing) {
            gitRules.push(line);
            if (line.startsWith('## ') && gitRules.length > 5) {
                gitRules.pop();
                break;
            }
        }
    }
    return gitRules.join('\\n');
}

run();
`;

const backupScriptText = `const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const rootPath = path.join(__dirname, '..', '..');
const backupDir = path.join(__dirname, '..', 'backup_data');
const localBackup = path.join(backupDir, 'project_config');
const zipPath = path.join(rootPath, 'antigravity_config_backup.zip');

function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function copyFileSafe(src, dest) {
    if (fs.existsSync(src)) {
        try {
            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            fs.copyFileSync(src, dest);
            console.log('  -> Copied ' + path.basename(src));
        } catch (e) {
            console.error('Error copying ' + src + ' to ' + dest + ':', e.message);
        }
    }
}

function run() {
    console.log('Starting backup process...');
    cleanDir(backupDir);
    fs.mkdirSync(localBackup, { recursive: true });

    copyFileSafe(path.join(rootPath, '.antigravity', 'agents.json'), path.join(localBackup, 'agents.json'));
    copyFileSafe(path.join(rootPath, '.antigravity', 'workspaces.json'), path.join(localBackup, 'workspaces.json'));
    copyFileSafe(path.join(rootPath, '.antigravityignore'), path.join(localBackup, '.antigravityignore'));

    const mcpConfigPath = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json');
    copyFileSafe(mcpConfigPath, path.join(backupDir, 'mcp_config.json'));

    let userSettingsPath = '';
    if (process.platform === 'win32') {
        if (process.env.APPDATA) {
            userSettingsPath = path.join(process.env.APPDATA, 'Antigravity IDE', 'User', 'settings.json');
        }
    } else if (process.platform === 'darwin') {
        userSettingsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity IDE', 'User', 'settings.json');
    } else {
        userSettingsPath = path.join(os.homedir(), '.config', 'Antigravity IDE', 'User', 'settings.json');
    }
    copyFileSafe(userSettingsPath, path.join(backupDir, 'settings.json'));

    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }

    try {
        if (process.platform === 'win32') {
            console.log('Compressing backup using PowerShell on Windows...');
            const powershellCommand = 'powershell -NoProfile -Command "Compress-Archive -Path \\'' + backupDir + '\\' -DestinationPath \\'' + zipPath + '\\' -Force"';
            execSync(powershellCommand, { stdio: 'inherit' });
        } else {
            console.log('Compressing backup using zip on macOS/Linux...');
            execSync('zip -r "' + zipPath + '" .', { cwd: backupDir, stdio: 'inherit' });
        }
        console.log('Backup completed successfully! Saved to: ' + zipPath);
    } catch (e) {
        console.error('Error during compression:', e.message);
    } finally {
        cleanDir(backupDir);
    }
}

run();
`;

const restoreScriptText = `const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const rootPath = path.join(__dirname, '..', '..');
const zipPath = path.join(rootPath, 'antigravity_config_backup.zip');
const tempDir = path.join(__dirname, '..', 'restore_temp');

function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function copyFileSafe(src, dest) {
    if (fs.existsSync(src)) {
        try {
            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            fs.copyFileSync(src, dest);
            console.log('  -> Restored ' + path.basename(dest));
        } catch (e) {
            console.error('Error restoring ' + src + ' to ' + dest + ':', e.message);
        }
    }
}

function run() {
    console.log('Starting restore process...');

    if (!fs.existsSync(zipPath)) {
        console.error('Error: Backup file not found at ' + zipPath);
        process.exit(1);
    }

    cleanDir(tempDir);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
        if (process.platform === 'win32') {
            console.log('Decompressing backup using PowerShell on Windows...');
            const powershellCommand = 'powershell -NoProfile -Command "Expand-Archive -Path \\'' + zipPath + '\\' -DestinationPath \\'' + tempDir + '\\' -Force"';
            execSync(powershellCommand, { stdio: 'inherit' });
        } else {
            console.log('Decompressing backup using unzip on macOS/Linux...');
            execSync('unzip -o "' + zipPath + '" -d "' + tempDir + '"', { stdio: 'inherit' });
        }
    } catch (e) {
        console.error('Error during decompression:', e.message);
        cleanDir(tempDir);
        process.exit(1);
    }

    const projectConfigDir = path.join(tempDir, 'project_config');
    if (fs.existsSync(projectConfigDir)) {
        copyFileSafe(path.join(projectConfigDir, 'agents.json'), path.join(rootPath, '.antigravity', 'agents.json'));
        copyFileSafe(path.join(projectConfigDir, 'workspaces.json'), path.join(rootPath, '.antigravity', 'workspaces.json'));
        copyFileSafe(path.join(projectConfigDir, '.antigravityignore'), path.join(rootPath, '.antigravityignore'));
    }

    const mcpBackupPath = path.join(tempDir, 'mcp_config.json');
    if (fs.existsSync(mcpBackupPath)) {
        const mcpConfigDest = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json');
        copyFileSafe(mcpBackupPath, mcpConfigDest);
    }

    const settingsBackupPath = path.join(tempDir, 'settings.json');
    if (fs.existsSync(settingsBackupPath)) {
        let settingsDest = '';
        if (process.platform === 'win32') {
            if (process.env.APPDATA) {
                settingsDest = path.join(process.env.APPDATA, 'Antigravity IDE', 'User', 'settings.json');
            }
        } else if (process.platform === 'darwin') {
            settingsDest = path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity IDE', 'User', 'settings.json');
        } else {
            settingsDest = path.join(os.homedir(), '.config', 'Antigravity IDE', 'User', 'settings.json');
        }

        if (settingsDest) {
            copyFileSafe(settingsBackupPath, settingsDest);
        }
    }

    cleanDir(tempDir);
    console.log('Restore process completed successfully!');
}

run();
`;

async function main() {
    const CURRENT_VERSION = '1.9.1';
    const antiDir = path.join(targetRoot, '.antigravity');
    const versionPath = path.join(antiDir, 'version.json');
    let isUpgrade = false;
    let existingVersion = '0.0.0';

    let projectName = defaultProjectName;
    let selectedIdes = ["1", "2", "3"];
    let structureChoice = "1";
    let subFolders = [];
    let gitFlow = "branch";
    const availableMcps = detectMcpServers();
    const mcpKeys = Object.keys(availableMcps);
    const selectedMcps = [];

    if (fs.existsSync(antiDir)) {
        if (fs.existsSync(versionPath)) {
            try {
                const verData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
                existingVersion = verData.version || '1.0.0';
            } catch (e) {
                existingVersion = '1.0.0';
            }
        } else {
            existingVersion = '1.0.0';
        }
        
        if (existingVersion !== CURRENT_VERSION) {
            isUpgrade = true;
            params.force = true; // Auto-force overwrite on upgrades to prevent interactive prompts
        } else if (!params.force) {
            console.log(`\n\x1b[32m[!] Du an da o phien ban moi nhat (${CURRENT_VERSION}). Khong can cap nhat.\x1b[0m`);
            console.log(`Su dung tham so --force neu muon bat buoc khoi tao lai tu dau.\n`);
            return;
        }
    }

    if (isUpgrade) {
        console.log(`\n\x1b[36m[Upgrade] Phat hien phien ban thiet lap cu: ${existingVersion}.\x1b[0m`);
        console.log(`\x1b[36m          Tu dong nang cap len phien ban moi nhat: ${CURRENT_VERSION}...\x1b[0m`);
        
        // Auto-detect project name
        const agentsJsonPath = path.join(antiDir, 'agents.json');
        if (fs.existsSync(agentsJsonPath)) {
            try {
                const agentsData = JSON.parse(fs.readFileSync(agentsJsonPath, 'utf8'));
                if (agentsData.system_boundary) {
                    projectName = agentsData.system_boundary.replace('-root', '');
                }
            } catch (e) {}
        }
        
        // Auto-detect structure and sub-folders
        const workspacesJsonPath = path.join(antiDir, 'workspaces.json');
        if (fs.existsSync(workspacesJsonPath)) {
            try {
                const wsData = JSON.parse(fs.readFileSync(workspacesJsonPath, 'utf8'));
                if (wsData.workspaces && wsData.workspaces.length > 0) {
                    if (wsData.workspaces.length === 1 && wsData.workspaces[0].path === './') {
                        structureChoice = "1";
                    } else {
                        structureChoice = "2";
                        subFolders = wsData.workspaces.map(w => w.path);
                    }
                }
            } catch (e) {}
        }
        
        // Auto-detect git flow
        const handoffDir = path.join(antiDir, 'handoff');
        if (fs.existsSync(handoffDir)) {
            gitFlow = 'worktree';
        } else {
            gitFlow = 'branch';
        }
    } else {
        if (isNonInteractive) {
            // CLI arguments mode
            projectName = params.name || defaultProjectName;
            if (params.ides) {
                selectedIdes = params.ides.split(',').map(s => s.trim());
            }
            structureChoice = params.structure || "1";
            if (structureChoice === "2" && params.folders) {
                subFolders = params.folders.split(',').map(s => s.trim()).filter(s => s !== "");
            }
            if (params.mcp === 'all') {
                selectedMcps.push(...mcpKeys);
            } else if (params.mcp && params.mcp !== 'none') {
                params.mcp.split(',').map(s => s.trim()).forEach(key => {
                    if (availableMcps[key]) selectedMcps.push(key);
                });
            }
            gitFlow = params.gitFlow || "branch";
            console.log(`Running in CLI mode: Name=${projectName}, Structure=${structureChoice}, GitFlow=${gitFlow}, Force=${params.force}`);
        } else {
        // Interactive readline mode
        console.log('\n\x1b[36m=========================================================\x1b[0m');
        console.log('\x1b[36m                BUOC 1: THU THAP THONG TIN               \x1b[0m');
        console.log('\x1b[36m=========================================================\x1b[0m');

        let inputName = await askQuestion(`1. Nhap ten du an (Mac dinh: ${defaultProjectName}): `);
        projectName = inputName.trim() || defaultProjectName;

        let idesInput = await askQuestion(`2. Ban muon tich hop vao nhung IDE nao? \n   [1] Antigravity IDE (agents.json, workspaces.json, AGENTS.md)\n   [2] Cline / Roo-Cline (.clinerules)\n   [3] OpenCode / Cursor (.cursorrules & .opencoderules)\n   Nhap lua chon, cach nhau boi dau phay (Mac dinh: 1,2,3): `);
        idesInput = idesInput.trim() || "1,2,3";
        selectedIdes = idesInput.split(',').map(s => s.trim());

        console.log(`\n3. Cau truc thu muc cua du an nhu the nao?`);
        console.log(`   [1] Du an Don / Flat Project (Tat ca code nam o root, khong chia folder he thong)`);
        console.log(`   [2] Du an Da he thong / Monorepo (Chia cac folder con nhu server, cms, plugin...)`);
        let inputStruct = await askQuestion(`   Nhap lua chon [1 hoac 2] (Mac dinh: 1): `);
        structureChoice = inputStruct.trim() || "1";

        if (structureChoice === "2") {
            let foldersInput = await askQuestion(`\n   Nhap ten cac thu muc con, cach nhau bang dau phay (Vd: server, cms, plugin): `);
            if (foldersInput.trim()) {
                subFolders = foldersInput.split(',').map(s => s.trim()).filter(s => s !== "");
            } else {
                console.log("   (!) Khong co thu muc nao duoc nhap, chuyen ve cau truc Du an Don.");
                structureChoice = "1";
            }
        }

        console.log(`\n4. Lua chon luong lam viec Git (Git Workflow) phu hop cho Agent:`);
        console.log(`   [1] Git Branch truyen thong (Phu hop cho dev tuan tu, don gian)`);
        console.log(`   [2] Git Worktree co lap (Phu hop cho Monorepo, nhieu Agent song song)`);
        let inputGitFlow = await askQuestion(`   Nhap lua chon [1 hoac 2] (Mac dinh: 1): `);
        let gitFlowChoice = inputGitFlow.trim() || "1";
        gitFlow = gitFlowChoice === "2" ? "worktree" : "branch";

        console.log('\n\x1b[36m=========================================================\x1b[0m');
        console.log('\x1b[36m           BUOC 2: PHAT HIEN MCP SERVERS CO SAN          \x1b[0m');
        console.log('\x1b[36m=========================================================\x1b[0m');

        if (mcpKeys.length > 0) {
            console.log("Phat hien cac MCP Server sau tren may cua ban:");
            mcpKeys.forEach((key, index) => {
                console.log(`   [${index + 1}] ${key} (${availableMcps[key].command})`);
            });
            let mcpChoice = await askQuestion(`\nChon cac MCP muon tich hop vao agent (Nhap so, cach nhau bang dau phay, enter de bo qua): `);
            if (mcpChoice.trim()) {
                mcpChoice.split(',').map(s => parseInt(s.trim()) - 1).forEach(idx => {
                    if (idx >= 0 && idx < mcpKeys.length) {
                        selectedMcps.push(mcpKeys[idx]);
                    }
                });
            }
        } else {
            console.log("Khong phat hien thay MCP Server nao hoat dong toan cuc.");
        }
    }
    }

    console.log('\nDang khoi tao cau hinh...');
    const scriptsDir = path.join(antiDir, 'scripts');
    const agentsDir = path.join(targetRoot, '.agents');

    if (selectedIdes.includes("1")) {
        fs.mkdirSync(antiDir, { recursive: true });
        fs.mkdirSync(scriptsDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });
    }

    // Create Handoff folder if using Git Worktree
    if (selectedIdes.includes("1") && gitFlow === "worktree") {
        const handoffDir = path.join(antiDir, 'handoff');
        fs.mkdirSync(handoffDir, { recursive: true });
        fs.writeFileSync(path.join(handoffDir, 'README.md'), '# Handoff Directory\nNoi luu tru thong tin ban giao cong viec giua cac Agent de tranh xung dot.\n', 'utf8');
        console.log('  -> Created .antigravity/handoff/ directory.');
    }

    // 2.1. Generate workspaces.json
    if (selectedIdes.includes("1")) {
        let workspacesJson = '';
        if (structureChoice === "2") {
            const workspaces = subFolders.map(folder => {
                return `        {
            "name": "${folder.toUpperCase()} Module",
            "path": "${folder}",
            "tags": ["${folder}", "sub-system"]
        }`;
            });
            workspacesJson = `{\n    "version": "1.0",\n    "root_path": "./",\n    "workspaces": [\n${workspaces.join(',\n')}\n    ]\n}`;
        } else {
            workspacesJson = `{\n    "version": "1.0",\n    "root_path": "./",\n    "workspaces": [\n        {\n            "name": "${projectName} Core",\n            "path": "./",\n            "tags": ["core", "root"]\n        }\n    ]\n}`;
        }
        await writeSafe(path.join(antiDir, 'workspaces.json'), workspacesJson);
    }

    // 2.2. Generate agents.json
    if (selectedIdes.includes("1")) {
        const agents = [];
        agents.push(`        {
            "id": "ai_pm",
            "role": "Project Manager",
            "allowed_scopes": ["/"],
            "capabilities": ["read_structure", "write_backlog", "delegate_tasks"],
            "instruction": "Bạn là PM của dự án \${projectName}. Nhiệm vụ chính là phân tích yêu cầu từ Owner, chia nhỏ thành các micro-tasks. Bạn chịu trách nhiệm điều phối công việc giữa các Agent, quản lý thư mục backlog (.antigravity/backlog) và duy trì file INDEX.md luôn đồng bộ. Hãy luôn yêu cầu xác nhận tạo Task TEST với Owner trước khi bắt đầu nhiệm vụ mới. Khi nghiên cứu, phân tích kỹ thuật, bạn bắt buộc phải thảo luận với @ai_arch và nhận phản biện cần thiết để tối ưu. Lưu ý: Ngay từ câu trả lời đầu tiên, bạn phải khai báo rõ danh tính là @ai_pm."
        }`,
        `        {
            "id": "ai_arch",
            "role": "Software Architect",
            "allowed_scopes": ["/"],
            "capabilities": ["read_all_code", "write_docs"],
            "instruction": "Bạn là Software Architect của dự án \${projectName}. Nhiệm vụ của bạn là thiết kế luồng dữ liệu (System Flow) và thiết kế API Contracts. Hãy thiết kế các module sạch sẽ, đảm bảo tính tái sử dụng và tránh chồng chéo cấu trúc dữ liệu. Khi xem xét nghiệp vụ, bạn phải phản biện kỹ thuật cần thiết để tối ưu hóa giải pháp với @ai_pm. Lưu ý: Ngay từ câu trả lời đầu tiên, bạn phải khai báo rõ danh tính là @ai_arch."
        }`,
        `        {
            "id": "ai_devops",
            "role": "DevOps Engineer",
            "allowed_scopes": ["/.antigravity"],
            "capabilities": ["write_files", "execute_terminal_commands"],
            "instruction": "Bạn là DevOps Engineer. Quản lý cấu hình hạ tầng, scripts tự động hóa (backup, restore), và Docker. Khi có sự thay đổi về quy tắc phát triển trong AGENTS.md hoặc agents.json, bạn chịu trách nhiệm chạy script sync_rules.js để đồng bộ quy tắc ra các file cấu hình IDE. Lưu ý: Ngay từ câu trả lời đầu tiên, bạn phải khai báo rõ danh tính là @ai_devops."
        }`,
        `        {
            "id": "ai_db",
            "role": "Database Specialist",
            "allowed_scopes": ["/"],
            "capabilities": ["read_all_code", "write_files", "execute_terminal_commands"],
            "instruction": "Bạn là Database Specialist của dự án \${projectName}. Nhiệm vụ của bạn là quản trị, thiết kế, tối ưu hóa cơ sở dữ liệu và đánh giá rủi ro hệ thống (thang điểm 0-5). Khi có bất kỳ đề xuất/hành động nào can thiệp database từ @ai_arch hoặc @ai_backend, bạn phải thảo luận và đánh giá mức độ an toàn (fallback, scale up, bảo toàn dữ liệu). Nếu rủi ro quá cao (điểm 4-5), bạn phải đưa ra quyết định dừng lại (stop) và báo cáo chi tiết để xin ý kiến từ Owner. Lưu ý: Ngay từ câu trả lời đầu tiên, bạn phải khai báo rõ danh tính là @ai_db."
        }`);

        if (structureChoice === "2") {
            subFolders.forEach(folder => {
                const fName = folder.toLowerCase();
                const cName = folder.toUpperCase();
                let extraInstruction = "";
                if (fName === "frontend") {
                    extraInstruction = " Trước và sau khi làm việc, bạn luôn phải hỏi @ai_design về cấu trúc, bố cục... xem dự án đã đạt yêu cầu thiết kế chưa.";
                } else if (fName === "backend") {
                    extraInstruction = " Khi có task cần làm việc với API, bạn bắt buộc phải chuyển giao đầy đủ và chính xác thông tin API endpoint cho @ai_frontend để tránh các phiên làm việc sửa lỗi API sau này.";
                }
                agents.push(`        {
            "id": "ai_${fName}",
            "role": "${cName} Developer",
            "allowed_scopes": ["/${folder}"],
            "capabilities": ["write_files"],
            "instruction": "Bạn là Developer chuyên trách code thư mục /${folder} của dự án \${projectName}. Hãy tuân thủ nghiêm ngặt các quy tắc phát triển: Không sửa code nằm ngoài folder /${folder} này, không dùng kiểu 'any', chỉ dùng đường dẫn tương đối, và đảm bảo sạch lỗi linter/compiler.${extraInstruction} Lưu ý: Ngay từ câu trả lời đầu tiên, bạn phải khai báo rõ danh tính là @ai_\${fName}."
        }`);
            });

            // QA/Tester with corrected allowed_scopes
            agents.push(`        {
            "id": "ai_tester",
            "role": "QA/Tester",
            "allowed_scopes": ["/tests", "/.antigravity/backlog"],
            "capabilities": ["execute_terminal_commands", "write_files", "read_all_code"],
            "instruction": "Bạn là QA/Tester của dự án \${projectName}. Bạn được phép đọc mã nguồn toàn hệ thống để hiểu nghiệp vụ, nhưng chỉ được ghi vào các thư mục kiểm thử hoặc backlog. Khi kiểm tra phát hiện lỗi, bạn tuyệt đối không được phép tự sửa lỗi mà phải tổng hợp báo cáo về cho @ai_pm đánh giá. Khi được Owner phê duyệt, bạn có nhiệm vụ thiết lập kịch bản kiểm thử tự động, chạy build và lint trước khi commit, đồng thời báo cáo kết quả kiểm tra rõ ràng cho Owner. Lưu ý: Ngay từ câu trả lời đầu tiên, bạn phải khai báo rõ danh tính là @ai_tester."
        }`);
        } else {
            agents.push(`        {
            "id": "ai_dev",
            "role": "Core Developer",
            "allowed_scopes": ["/"],
            "capabilities": ["write_files"],
            "instruction": "Bạn là Core Developer duy nhất của dự án ${projectName}. Bạn có toàn quyền phát triển mã nguồn ở thư mục gốc. Hãy tuân thủ nghiêm ngặt các quy tắc phát triển: Không dùng kiểu 'any' (thay bằng 'unknown' hoặc kiểu custom), chỉ dùng đường dẫn tương đối, và đảm bảo sạch lỗi linter/compiler. Lưu ý: Ngay từ câu trả lời đầu tiên, bạn phải khai báo rõ danh tính là @ai_dev."
        }`,
        `        {
            "id": "ai_tester",
            "role": "QA/Tester",
            "allowed_scopes": ["/tests", "/.antigravity/backlog"],
            "capabilities": ["execute_terminal_commands", "write_files", "read_all_code"],
            "instruction": "Bạn là QA/Tester của dự án \${projectName}. Bạn được phép đọc mã nguồn toàn hệ thống để viết test cases, nhưng chỉ được phép chỉnh sửa/ghi trong thư mục /tests và file backlog. Khi kiểm tra phát hiện lỗi, bạn tuyệt đối không được phép tự sửa lỗi mà phải tổng hợp báo cáo về cho @ai_pm đánh giá. Khi được phê duyệt, bạn có nhiệm vụ thiết lập kịch bản kiểm thử tự động, chạy lint/build, báo cáo kết quả cho Owner. Lưu ý: Ngay từ câu trả lời đầu tiên, bạn phải khai báo rõ danh tính là @ai_tester."
        }`);
        }

        const agentsJson = `{\n    "version": "1.0",\n    "system_boundary": "${projectName}-root",\n    "agents": [\n${agents.join(',\n')}\n    ]\n}`;
        await writeSafe(path.join(antiDir, 'agents.json'), agentsJson);
    }

    // 2.3. Generate .antigravityignore
    const ignoreContent = `**/node_modules/\n**/dist/\n**/build/\n**/.git/\n**/.antigravity/cache/\n**/*.log\n`;
    await writeSafe(path.join(targetRoot, '.antigravityignore'), ignoreContent);

    // 2.4. Generate AGENTS.md
    let gitFlowSection = '';
    if (gitFlow === 'worktree') {
        gitFlowSection = `## Quy dinh ve Git Worktree va Tu dong don dep (Worktree Workflow)
Khi duoc phan cong thuc hien cong viec tren mot Git Worktree, Agent bat buoc phai thuc hien theo quy trinh 2 cau hoi doc lap:
1. **Cau hoi 1 - Merge ve thu muc goc**: Ngay sau khi commit thanh cong, Agent phai hoi Owner:
   > "Tôi đã hoàn thành task và commit thành công lên nhánh [Tên_Nhánh]. Bạn có muốn tôi thực hiện tự động merge nhánh này vào thư mục gốc chính (main) không?"
   *Neu Owner dong y*: Agent phai chay lenh chuyen ve thu muc goc va thuc hien merge: \`git merge [Tên_Nhánh]\`.
2. **Cau hoi 2 - Xoa Worktree con**: Tiep theo, Agent phai hoi Owner cau hoi thu hai:
   > "Bạn có muốn tôi tự động xóa thư mục worktree hiện tại để dọn dẹp đĩa cứng không?"
   *Neu Owner dong y*: Agent phai chay lenh: \`git worktree remove [duong_dan_worktree] --force\`.

## Quy trinh Giao tiep giua cac Agent qua file Banh giao (Handoff Files)
* Khi lam viec tren cac worktree doc lap, de tranh xung dot logic, cac Agent phai ghi lai thong tin ban giao duoi dang Markdown vao thu muc \`.antigravity/handoff/\`.
* Developer Agent tiep theo phai vao thu muc nay doc file de hieu update truoc khi lam.`;
    } else {
        gitFlowSection = `## Quy dinh ve Git Branch
1. Quy dinh Git Branch: Agent phai hoi Owner truoc khi tao branch rieng biet de phat trien. Tuyet doi khong tu y commit truc tiep len nhanh chinh.
2. Thao tac an toan: Sau khi tao nhanh, Agent phai chuyen doi sang nhanh do bang \`git checkout\` truoc khi bat dau viet code.`;
    }

    const agentsMdContent = `# Rules for Project

## Chat Session Naming Convention
Moi khi bat dau hoac luu thong tin tieu de cuoc tro chuyen (chat title), ban phai luon tuan thu dinh dang dat ten sau:
\`[${projectName}]_[Tieu de mieu ta noi dung chinh cuoc tro chuyen]_[DD/MM/YYYY_hh:mm]\`
*Luu y: Tieu de thuc te khong chua dau ngoac vuong [] xung quanh toan bo chuoi.*

## Quy trinh lam viec va Phat trien (Development Workflow Rules)
${gitFlowSection}
3. Xac nhan tao Task TEST: PM phai hoi Owner truoc khi giao viec cho Tester.
4. Quy trinh viet PR: PR phai duoc format theo dinh dang markdown va wrap lai trong khoi code block de co the copy de dang, co bang chi tiet file thay doi va phan tich anh huong, tuyet doi khong tao link den cac file.
5. Cap nhat va Tra cuu Backlog (Master Task Index): File .antigravity/backlog/INDEX.md la noi quan ly task tong. Moi khi bat dau phien lam viec hoac can tra cuu thong tin nhiem vu, Agent phai doc file INDEX.md nay de tim kiem nhanh ma khong can doc toan bo file JSON con. Khi khoi tao/cap nhat task, Agent phai cap nhat dong tuong ung trong INDEX.md va chen link markdown lien ket cot ID toi file JSON tuong ung trong thu muc tasks/ (vd: |[task_001](tasks/task_001.json)|...|).
6. Quy dinh coding: Luon tuan thu chat che cac quy tac ESLint/Linter va tuyet doi khong su dung kieu du lieu 'any'. Truong hop chua xac dinh ro kieu phai su dung 'unknown' hoac kieu custom tuong thich.
7. Quy dinh Git Commit: Thong diep commit (commit message) khong duoc vuot qua 90 ky tu.
8. Quy dinh Kiem thu: Chi thuc hien run build va run lint khi nguoi dung yeu cau commit.
9. Quy dinh ve Duong dan: Chi su dung duong dan tuong doi trong du an, tranh ghi duong dan tuyet doi.
10. Quy dinh thiet ke UI/UX: Tat ca giao dien phai tuan thu cac token va triet ly thiet ke duoc quy dinh trong DESIGN.md tai thu muc goc.
11. Quy dinh phan quyen: Viêt bat ky modules hoac feature nao cung phai map voi bang phan vai (roles) va quyen han (permissions) trong he thong.
12. Quy dinh ve Phan tich va Tra cuu thong tin: Khi co yeu cau cap nhat tinh nang hoac sua loi, Agent bat buoc phai phan tich, bien luan ky thuat ro rang tren co so ma nguon thuc te, tuyet doi khong tu bia dat thong tin (khong tu bia ten file, bien, hoac cac thong so khong ton tai). Agent co quyen su dung cong cu search internet de tra cuu tai lieu nghien cuu khi can thiet, nhung BAT BUOC PHAI HOI y kien Owner va duoc su dong y truoc khi thuc hien lenh search internet.
13. Quy dinh ve Khai bao Danh tinh Agent: Ngay khi bat dau phan hoi dau tien trong phien tro chuyen, Agent bat buoc phai tu gioi thieu ro danh tinh cua minh (Agent ID va Vai tro - Vi du: "Toi la @ai_dev, dong vai tro Core Developer"). Dieu nay giup Owner de dang xac dinh va giam san hoat dong cua dung Agent chuyen trach.
14. Quy dinh ve De xuat va Khoi tao Task: Moi khi Owner yeu cau Agent de xuat mot van de, giai phap hoac y tuong nao do, sau khi Agent da giai thich/trinh bay phan tich, Agent bat buoc phai hoi Owner cau hoi: 'Bạn có muốn tôi tạo task lưu trữ thông tin này để có thể truy vấn hoặc liên kết trong tương lai không?'. Neu Owner dong y, Agent phai tu dong tao 1 file JSON task trong thu muc \`.antigravity/backlog/tasks/\` co ten file theo dinh dang \`YYYYMMDDHHMMSS_task_[id]_[status]_[assignee]_[slug].json\` (trong do YYYYMMDDHHMMSS la thoi gian hien tai, slug la tieu de task viet thuong khong dau cach nhau boi gach ngang) va cap nhat thong tin vao file \`.antigravity/backlog/INDEX.md\` bang cach chen link markdown tu cot ID toi file JSON vua tao de co the truy van hoac lien ket trong tuong lai.
15. Quy dinh ve danh gia rui ro he thong (Risk Assessment Rules): Moi khi Owner de xuat hoac yeu cau sua doi co tac dong den co so du lieu (database), van hanh he thong (system operations), hoac Docker, Agent bat buoc phai thuc hien:
- Đưa ra bảng so sánh chi tiết giữa phương án cũ và phương án đề xuất.
- Chỉ rõ các nguy cơ tiềm ẩn có khả năng gây sập hệ thống hoặc gián đoạn dịch vụ.
- Đánh giá mức độ rủi ro theo thang điểm từ 0 đến 5, kèm theo màu sắc biểu thị mức độ nguy hiểm:
  + Điểm 0 - 1: {green}(Thấp - Ít ảnh hưởng)
  + Điểm 2 - 3: {yellow}(Trung bình - Cần cẩn trọng)
  + Điểm 4 - 5: {red}(Cao - Cực kỳ nguy hiểm)
- Đưa ra lời khuyên cụ thể hoặc biện pháp phòng ngừa rủi ro.
16. Quy dinh ve Quan ly Phien ban va Nang cap (Version Control and Upgrades): Khi co bat ky cap nhat, sua doi nao lien quan den rule, setup, hoac agent trong he thong, phai thuc hien tang phien ban (CURRENT_VERSION) trong file setup.js. Phai tao/cap nhat nhat ky phien ban trong \`VERSIONS.md\` de nguoi dung theo doi cac thay doi. Script setup.js phai tu dong kiem tra phien ban hien tai trong \`.antigravity/version.json\` va thuc hien cac logic upgrade can thiet khi phat hien phien ban thap hon.
17. Quy dinh ve Thao luan Technical giua PM va Arch: Khi @ai_pm nghien cuu, phan tich, danh gia bat ky van de nao lien quan den technical thi phai thao luan voi @ai_arch, va @ai_arch cung phai xem xet ro rang trong nghiep vu va dua ra nhung phan bien can thiet de toi uu.
18. Quy dinh ve Giao tiep giua Frontend va Design: Truoc va sau khi @ai_frontend lam viec thi luon phai hoi @ai_design ve cau truc, bo cuc, ... xem hien tai cua du an da dat yeu cau, dung voi ngon ngu thiet ke va quy tac de ra hay chua.
19. Quy dinh ve Bao cao loi cua QC: @ai_qc khi kiem tra thay loi khong duoc phep tu sua loi, ma phai tong hop va chuyen thong tin ve cho @ai_pm danh gia.
20. Quy dinh ve Ngat vong lap (Infinite Loop Interruption): Neu phien lam viec cua bat ky agent nao di vao vong lap (loop) qua 3 lan phai dung lai (stop) va dua ra bao cao nguyen nhan.
21. Quy dinh ve Chuyen giao API: Khi co task can lam viec voi api thi @ai_backend phai chuyen giao du thong tin api endpoint cho @ai_frontend. Phai dam bao thong tin chuyen giao chinh xac, de @ai_frontend hoan thien chuc nang, khong phai them cac phien lam viec khac de giai quyet loi do api.
22. Quy dinh ve Tuong tac Database: Bat ky khi nao @ai_arch hoac @ai_backend de xuat, hoac co hanh dong can thiep thiet lap database thi bat buoc phai thao luan voi @ai_db. Chi khi nao @ai_db danh gia an toan tuyet doi, co kha nang fallback, scale up, va khong gay mat/hu hong du lieu thi moi duoc phep thuc thi. Quyet dinh cua @ai_db la cuoi cung; neu danh gia rui ro qua cao (diem 4-5), @ai_db phai dua ra quyet dinh stop va bao cao chi tiet de xin y kien Owner.


## Quy chuan Bao cao va Thong bao (Reporting Guidelines)
Khi duoc yeu cau tao cac bao cao va thong bao, ban phai tuyet doi tuan thu theo cac kieu va dinh dang duoi day:

### 1. Tao task jira
* Tieu de phai tom tat hanh dong va phan he can thiep.
* Noi dung phai uu tien dung bang bieu de ke khai cong viec:
| Hang muc | Chi tiet cong viec | Ket qua dat duoc |
| :--- | :--- | :--- |
| ... | ... | ... |

### 2. Tao PR (Pull Request)
* Tao noi dung ve cac cap nhat trong code.
* Uu tien dung bang de liet ke va phan tich anh huong:
| Thay doi | File thay doi | Mo ta chi tiet | Muc do anh huong |
| :--- | :--- | :--- | :--- |
| ... | ... | ... | ... |
* PR phai duoc wrap trong block code markdown (fenced code block) de nguoi dung de dang copy.

### 3. Tao Test-Case end-user
* Tao noi dung kịch bản kiem thu thu cong danh cho end-user (nguoi khong biet code, khong phai coder).
* Chi dan tung buoc: "Buoc 1: ...", "Buoc 2: ...", "Ket qua ky vong: ...", khong dung thuat ngu ky thuat hay doan code nao.

### 4. Tao thong bao update server
📢 **THONG BAO UPDATE SERVER ${projectName.toUpperCase()}**

**Update time**: [DD/MM/YYYY hh:mm]
**Tinh trang**: Da cap nhat
**Tinh nang**:
- ...

**Luu y**:
- ...

### 5. Tao thong bao release
📢 **THONG BAO RELEASE PLUGIN ${projectName.toUpperCase()}**

**Release time**: [DD/MM/YYYY hh:mm]
**Version**: [x.y.z]
**Tinh nang**:
- ...

**Luu y**:
- ...

FYI: ...

### 6. Tao Check Out daily
**CHECK OUT [MM/DD/YYYY]**

**I. DONE**

{blue}(**Giftcode**)
1. ...

{blue}(**Livechat**)
1. ...

**II. DOING**

{blue}(**Giftcode**)
1. ...

{blue}(**LiveChat**)
1. ...

{blue}(**Uni-Portal**)
1. ...
`;
    if (selectedIdes.includes("1")) {
        await writeSafe(path.join(agentsDir, 'AGENTS.md'), agentsMdContent);
    }

    // 2.5. Generate GUIDE.md
    let guideContent = `# Hướng dẫn Thiết lập và Vận hành Dự án trên Antigravity IDE\n\n`;
    if (structureChoice === "2") {
        guideContent += `Tài liệu hướng dẫn chi tiết dự án đa hệ thống gồm các modules: **${subFolders.join(', ')}**\n\n`;
    } else {
        guideContent += `Tài liệu hướng dẫn chi tiết cho dự án đơn lẻ ${projectName}\n\n`;
    }
    
    // Custom Git Flow documentation in GUIDE.md
    guideContent += `## Quy trinh lam viec Git cua du an: ${gitFlow.toUpperCase()}\n`;
    if (gitFlow === 'worktree') {
        guideContent += `Dự án này sử dụng cơ chế **Git Worktree** để cô lập công việc của từng Agent.\n\n`;
        guideContent += `### Cách khởi tạo thư mục Worktree con cho lập trình viên hoặc Agent:\n`;
        guideContent += `Khi cần phát triển một nhánh mới, chạy lệnh từ thư mục gốc:\n`;
        guideContent += `\`\`\`bash\n`;
        guideContent += `git worktree add ../app-server-work feature/server-api\n`;
        guideContent += `\`\`\`\n`;
        guideContent += `Sau đó mở thư mục \`../app-server-work\` bằng IDE để phát triển.\n\n`;
        guideContent += `### Cách Agent trao đổi thông tin để tránh xung đột (Conflict):\n`;
        guideContent += `*   Các Agent giao tiếp gián tiếp bằng các tệp tin trong thư mục [\`handoff/\`](file:///${targetRoot.replace(/\\/g, '/')}/.antigravity/handoff/).\n`;
        guideContent += `*   Khi hoàn thành, Agent sẽ lần lượt hỏi Owner **2 câu hỏi độc lập**:\n`;
        guideContent += `    1. *Có tự động merge nhánh vào thư mục gốc không?*\n`;
        guideContent += `    2. *Có tự động xóa thư mục worktree con để giải phóng ổ đĩa không?*\n\n`;
    } else {
        guideContent += `Dự án này sử dụng cơ chế **Git Branch** truyền thống.\n\n`;
        guideContent += `*   Mỗi khi phát triển tính năng, Agent phải yêu cầu checkout sang nhánh mới trước khi code.\n`;
        guideContent += `*   Tất cả thao tác commit sẽ diễn ra trên cùng một thư mục làm việc vật lý này.\n\n`;
    }

    if (selectedMcps.length > 0) {
        guideContent += `## MCP Servers duoc tich hop trong du an\n`;
        selectedMcps.forEach(mcp => {
            guideContent += `*   **${mcp}**: (${availableMcps[mcp].command} ${availableMcps[mcp].args ? availableMcps[mcp].args.join(' ') : ''})\n`;
        });
        guideContent += `\n`;
    }

    guideContent += `## Quy trinh dong bo hoa va van hanh\n`;
    guideContent += `Chay script \`node .antigravity/scripts/sync_rules.js\` moi khi thay doi file \`AGENTS.md\` de tu dong cap nhat sang cac IDE.\n`;
    
    if (selectedIdes.includes("1")) {
        await writeSafe(path.join(antiDir, 'GUIDE.md'), guideContent);
    }

    // 2.6. Generate taste-dashboard-saas SKILL.md
    if (selectedIdes.includes("1")) {
        const tasteSkillContent = `# SYSTEM_SKILL: HIGH_AGENCY_UI_DESIGN_SPEC

## Metadata
name: high-agency-ui-design-spec
version: 2.1.0-optimized
author: AI System Architect
description: Mandatory system prompt and constraint set for AI Coding Agents working on Frontend, Web, Mobile, and Desktop Applications. Merges Google's structured DESIGN.md visual token identity specification with Taste-Skill's high-agency anti-slop dynamic design system control dials.

---

## 1. MỤC TIÊU & NGUYÊN TẮC CỐT LÕI (ANTI-TEMPLATED SLOP)

Các Agent **BẮT BUỘC** phải tuân thủ nghiêm ngặt tài liệu này nhằm triệt tiêu hoàn toàn trạng thái "AI Slop" (giao diện rập khuôn, các thẻ bo góc vô hồn xếp chồng chéo, layout căn giữa nhàm chán). Mọi sản phẩm Frontend tạo ra phải đạt chất lượng sản xuất cao (Production-Ready), sở hữu tư duy thẩm mỹ (Design Taste) và tính nhất quán tuyệt đối về mặt kỹ thuật.

### 4 Không của Agent:
1. **KHÔNG** tự tạo mã màu ngẫu nhiên hoặc các class CSS "bọc trong bọc" vô nghĩa.
2. **KHÔNG** lạm dụng căn giữa (\`flex items-center justify-center\`) cho mọi loại card/giao diện.
3. **KHÔNG** bỏ qua độ tương phản WCAG (Accessibility) và khả năng responsive của thiết bị di động.
4. **KHÔNG** viết cứng (hardcode) các giá trị visual; toàn bộ phải tham chiếu từ cấu trúc Tokens.

---

## 2. KHUNG ĐỊNH NGHĨA TOKENS (Theo chuẩn Google DESIGN.md)

Tất cả các dự án phải sở hữu một file cấu hình định danh thị giác (\`DESIGN.md\`) nằm tại thư mục gốc dưới định dạng YAML front matter kết hợp với Markdown xuôi. Agent phải đọc và xuất dữ liệu tuân theo cấu trúc nghiêm ngặt dưới đây:

\`\`\`yaml
---
name: "Visual Identity System"
colors:
  primary: "#1A1C1E"
  primary-hover: "#2F3133"
  secondary: "#0061A4"
  background: "#FAF8F5"
  surface: "#FFFFFF"
  text-main: "#1A1C1E"
  text-muted: "#606265"
  error: "#BA1A1A"
typography:
  fontFamily: "Public Sans, sans-serif"
  fontSize-sm: "12px"
  fontSize-base: "14px"
  fontSize-lg: "18px"
  fontWeight-normal: "400"
  fontWeight-bold: "700"
  lineHeight-base: "1.5"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
shapes:
  rounded-sm: "4px"
  rounded-md: "8px"
  rounded-lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    padding: "{spacing.sm} {spacing.md}"
    rounded: "{shapes.rounded-sm}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---
\`\`\`

### Quy tắc biên dịch Tokens của Agent:

* **Tham chiếu chéo:** Sử dụng cú pháp \`{path.to.token}\` (Ví dụ: \`{colors.primary}\`) trong phần \`components\`. Nghiêm cấm viết lại mã Hex.


* **Tính thực tế:** Khi chuyển đổi sang code, Agent phải tự động mapping các token này thành CSS Variables hoặc Tailwind Configuration (\`tailwind.config.js\`).



---

## 3. BA BÁNH RĂNG ĐIỀU CHỈNH THẨM MỸ (Theo chuẩn Leonxlnx Taste-Skill)

Khi nhận được bản brief thiết kế (Design Brief) từ người dùng hoặc hệ thống, Agent phải ngay lập tức xác định ngữ cảnh ứng dụng dựa trên **3 Dials (Thang đo từ 1 đến 10)** để tinh chỉnh mã nguồn giao diện:

### ⚙️ Thang 1: DESIGN_VARIANCE (Độ tùy biến bố cục)

*Mức độ thử nghiệm cấu trúc hình khối và layout.*

* **1 - 4 (Centered / Clean):** Dành cho ứng dụng doanh nghiệp (Enterprise B2B), SaaS Dashboard, ứng dụng Y tế/Tài chính. Ưu tiên cấu trúc lưới (Grid) chuẩn mực, đối xứng, trực quan.


* **5 - 7 (Asymmetric / Modern):** Dành cho Web Landing Page, Portfolio, Mobile E-commerce. Cho phép đặt lệch tiêu đề, đan xen khối bất đối xứng để tạo nhịp điệu thị giác.


* **8 - 10 (Avant-garde / High-Agency):** Web Agency sáng tạo, chiến dịch tiếp thị (Campaign). Phá vỡ hoàn toàn grid truyền thống, ứng dụng text khổ lớn, bóp méo hình khối nghệ thuật.



### ⚙️ Thang 2: MOTION_INTENSITY (Cường độ hiệu ứng chuyển động)

*Độ sâu và tần suất của Animation/Transition.*

* **1 - 3 (Static / Hover-only):** Click & Hover cơ bản (\`duration-150\`). Không làm xao nhãng người dùng. Phù hợp cho Data-dense Dashboard và Mobile App tài chính.


* **4 - 7 (Micro-interactions & Smooth Scroll):** Hiệu ứng chuyển cảnh trang mượt mà, Skeleton loading mượt, các nút bấm có độ lún vật lý (Feedback), Bottom Sheet trượt êm ái trên Mobile.


* **8 - 10 (Immersive / Magnetic):** Kỹ thuật Scroll-driven animation, hiệu ứng chuột nam thanh (Magnetic elements), WebGL, Canvas transition. Chỉ áp dụng khi có phần cứng xử lý tốt và phục vụ nghệ thuật kể chuyện (Storytelling UI).



### ⚙️ Thang 3: VISUAL_DENSITY (Mật độ thông tin trên màn hình)

*Lượng thông tin hiển thị trong một khung nhìn (Viewport).*

* **1 - 3 (Spacious / Editorial):** Tạp chí điện tử, Blog cao cấp, trang thanh toán tối giản. Khoảng trống (Whitespace) cực lớn để tạo cảm giác sang trọng.


* **4 - 6 (Balanced / Consumer):** Mobile App thông thường (Grab, Shopee, Facebook), trang Product Detail. Tỷ lệ cân bằng giữa hình ảnh, text và nút hành động.


* **7 - 10 (Data-Dense Dashboard):** Bảng điều khiển admin, sàn giao dịch tài chính (Trading platform), công cụ quản trị hệ thống phức tạp. Tối đa hóa dữ liệu trên một viewport, thu nhỏ padding và font size xuống mức tối thiểu an toàn.



---

## 4. QUY TRÌNH TRIỂN KHAI BẮT BUỘC (STEP-BY-STEP AGENT WORKFLOW)

Khi Agent được giao nhiệm vụ dựng giao diện (Frontend/Mobile), quy trình xử lý nội bộ phải tuân thủ đúng 5 bước sau:

\`\`\`
[BƯỚC 1: Phân tích Brief & Xác định 3 Dials]
                   │
                   ▼
[BƯỚC 2: Khởi tạo/Đọc cấu trúc DESIGN.md Tokens]
                   │
                   ▼
[BƯỚC 3: Kiểm tra Contrast & WCAG Compliance]
                   │
                   ▼
[BƯỚC 4: Xuất bản Layout thích ứng (Web/Mobile)]
                   │
                   ▼
[BƯỚC 5: Tích hợp Vi-tương tác & Clean Code Code-Review]
\`\`\`

### Chi tiết các bước hành động:

1. **Bước 1 (Phân tích):** Phân tích ngữ cảnh ứng dụng. Thiết lập chỉ số cho \`DESIGN_VARIANCE\`, \`MOTION_INTENSITY\`, \`VISUAL_DENSITY\`.


2. **Bước 2 (Khởi tạo):** Đọc file \`DESIGN.md\` hiện có hoặc tạo mới. Đảm bảo toàn bộ hệ màu và typography được gom vào YAML.


3. **Bước 3 (Kiểm tra tỷ lệ tương phản):** Thực hiện tính toán tự động độ tương phản giữa màu chữ (\`textColor\`) và màu nền (\`backgroundColor\`). Tỷ lệ AA phải đạt \`>= 4.5:1\` cho văn bản thường và \`>= 3:1\` cho văn bản lớn/nút bấm.


4. **Bước 4 (Xuất bản Layout):** Tiến hành gen code HTML/CSS/React Native. Phải sử dụng Semantic Tags (\`<main>\`, \`<section>\`, \`<nav>\`, \`<aside>\`).


5. **Bước 5 (Vi-tương tác):** Thêm thắt các thuộc tính trạng thái \`:hover\`, \`:active\`, \`:focus-visible\`, \`disabled\` cho mọi thành phần tương tác.



---

## 5. NGUYÊN TẮC THIẾT KẾ ĐẶC THÙ CHO TỪNG NỀN TẢNG

### 📱 Nền tảng Di động (Mobile App - iOS/Android)

* **Vùng an toàn (Safe Area):** Mọi layout phải được bọc trong các thẻ xử lý Safe Area (Ví dụ: \`SafeAreaView\` trong React Native, \`safeAreaPadding\` trong Flutter).


* **Kích thước vùng chạm (Tap Targets):** Tất cả các thành phần có thể click (Nút, Link, Icon) phải đạt kích thước tối thiểu \`44x44 pt\` (iOS) hoặc \`48x48 dp\` (Android) để tránh bấm nhầm.


* **Thao tác một tay (Thumb Zone):** Đặt các nút hành động chính (CTA - Call to Action) ở nửa dưới màn hình. Các tác vụ nguy hiểm (Xóa, Hủy) phải yêu cầu xác nhận qua Bottom Sheet hoặc Dialog nằm giữa.


* **Tránh giật lag:** Tuyệt đối không dùng các hiệu ứng tính toán đắt đỏ thời gian thực gây tụt FPS trên mobile. Sử dụng Native Driver cho animation nếu có thể.



### 💻 Nền tảng Web ứng dụng (Web Application & Dashboard)

* **Cố định cấu trúc layout chính:** Phần Header và Sidebar điều hướng phải được cố định (\`position: sticky\` hoặc \`fixed\`) khi cuộn trang, giúp người dùng không bị mất phương hướng trong các trang dữ liệu dài.


* **Trạng thái rỗng & Tải dữ liệu (Empty/Loading states):** Luôn đi kèm thiết kế cho màn hình trống (\`No Data\`) và hiệu ứng Skeleton load tương ứng với cấu hình cấu trúc của trang, thay vì dùng một vòng xoay spinner chung chung.


* **Hỗ trợ phím tắt:** Dashboard chuyên nghiệp phải hỗ trợ focus trạng thái qua phím Tab và các hành động nhanh bằng tổ hợp phím.



---

## 6. TIÊU CHUẨN ĐÁNH GIÁ (LINTING & QUALITY GATE)

Mã nguồn do Agent tạo ra sẽ bị coi là **Thất bại (Failed)** nếu vi phạm bất kỳ điều nào sau đây:

* ❌ Tồn tại các chuỗi màu thô (Hex/RGB) nằm rải rác ngoài file \`DESIGN.md\`.


* ❌ Heading cấp dưới (h3, h4) xuất hiện trước heading cấp trên (h2) phá vỡ tính tuần tự cấu trúc tài liệu HTML.


* ❌ Nút bấm không có hiệu ứng chỉ thị trực quan khi hover hoặc focus.


* ❌ Thiết kế bị tràn khung (Overflow horizontally) trên màn hình thiết bị di động chuẩn (375px - 430px width).



---

*Mọi Agent khi thực thi tác vụ lập trình giao diện phải nhúng chỉ thị này vào System Prompt lớp trên để kiểm soát hành vi xuất mã nguồn.*`;
        await writeSafe(path.join(agentsDir, 'skills', 'taste-dashboard-saas', 'SKILL.md'), tasteSkillContent);
    }

    // 2.7. Write Helper Scripts to .antigravity/scripts
    if (selectedIdes.includes("1")) {
        await writeSafe(path.join(scriptsDir, 'sync_rules.js'), syncRulesScriptText);
        await writeSafe(path.join(scriptsDir, 'backup.js'), backupScriptText);
        await writeSafe(path.join(scriptsDir, 'restore.js'), restoreScriptText);
    }

    // 2.10. Standardize and rename old task files to self-describing format
    if (selectedIdes.includes("1")) {
        const tasksDir = path.join(antiDir, 'backlog', 'tasks');
        if (fs.existsSync(tasksDir)) {
            const files = fs.readdirSync(tasksDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const filePath = path.join(tasksDir, file);
                    try {
                        const taskContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        const taskId = taskContent.id;
                        const status = taskContent.status || 'backlog';
                        const assignee = taskContent.assigned_to || 'unassigned';
                        
                        const timestamp = file.match(/^\d{14}/) ? file.slice(0, 14) : new Date().toISOString().replace(/[-T:]/g, '').slice(0, 14);
                        
                        let slug = 'untitled';
                        if (taskContent.title) {
                            slug = taskContent.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 50);
                        }
                        
                        const cleanTaskId = taskId.startsWith('task_') ? taskId : 'task_' + taskId;
                        const newFilename = `${timestamp}_${cleanTaskId}_${status}_${assignee}_${slug}.json`;
                        const newFilePath = path.join(tasksDir, newFilename);
                        
                        if (filePath !== newFilePath) {
                            if (fs.existsSync(newFilePath)) {
                                fs.unlinkSync(newFilePath);
                            }
                            fs.renameSync(filePath, newFilePath);
                            console.log(`  -> Standardized task filename: ${file} -> ${newFilename}`);
                        }
                    } catch (e) {
                        console.error(`Error standardizing task file ${file}:`, e.message);
                    }
                }
            });
        }
    }

    // 2.9. Write Version File
    if (selectedIdes.includes("1")) {
        await writeSafe(versionPath, JSON.stringify({ version: CURRENT_VERSION }, null, 2));
        console.log(`  -> Ghi file phien ban setup: ${CURRENT_VERSION}`);
    }

    // 2.8. Update or create root .gitignore
    try {
        updateGitignore();
    } catch (e) {
        console.error('Failed to update .gitignore:', e.message);
    }

    // 3. Trigger Sync Rules automatically
    if (selectedIdes.includes("1")) {
        try {
            console.log('Running sync_rules.js automatically...');
            const syncScriptPath = path.join(scriptsDir, 'sync_rules.js');
            execSync(`node "${syncScriptPath}"`, { stdio: 'inherit' });
        } catch (e) {
            console.error('Failed to auto-sync rules:', e.message);
        }
    }

    console.log('\n\x1b[32m=========================================================\x1b[0m');
    console.log(`\x1b[32m\x1b[1m        KHOI TAO THANH CONG CHO DU AN: ${projectName}      \x1b[0m`);
    console.log('\x1b[32m=========================================================\x1b[0m');
    console.log('Da tao cac file cau hinh va dong bo quy tac da IDE.');
    console.log('---------------------------------------------------------');
    console.log('\n\x1b[33m[!] HUONG DAN SAU KHI THIET LAP (POST-SETUP):\x1b[0m');
    console.log(' 1. Hay khoi dong lai IDE de ap dung workspaces va agents moi.');
    console.log(' 2. Cac Agent se tu dong tuan thu cac quy tac tao PR, Jira Task, Checkout theo dung format bieu mau da dang ky.');
    console.log(' 3. De dong bo lai moi khi co thay doi rule, chay: \x1b[36mnode .antigravity/scripts/sync_rules.js\x1b[0m');
    console.log('=========================================================');
}

main();
