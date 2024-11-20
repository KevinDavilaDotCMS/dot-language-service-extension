const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let translations = {};
let outputChannel;
let fileWatcher;
let decorationType;

// Create output channel
function createOutputChannel() {
    outputChannel = vscode.window.createOutputChannel("My Local Extension");
    return outputChannel;
}

// Custom logger
function log(message) {
    if (!outputChannel) {
        createOutputChannel();
    }
    const timestamp = new Date().toISOString();
    outputChannel.appendLine(`[${timestamp}] ${message}`);
}

// Get the file path for Language.properties
function getTranslationsFilePath() {
    // Get workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        throw new Error('No workspace folder found');
    }

    // Get configuration
    const config = vscode.workspace.getConfiguration('dotcmsTranslations');
    const relativePath = config.get('propertiesPath', 'dotCMS/src/main/webapp/WEB-INF/messages/Language.properties');

    // Join workspace path with configured relative path
    const filePath = path.join(workspaceFolders[0].uri.fsPath, relativePath);
    log(`Resolved translations file path: ${filePath}`);
    return filePath;
}

// Load translations from Language.properties
function loadTranslations() {
    console.log('Loading translations');
    try {
        // This get the file from the workspace
        const filePath = getTranslationsFilePath();

        // This get the file on debug
        // const filePath = path.join(__dirname, '../../dotCMS/src/main/webapp/WEB-INF/messages/Language.properties');
        
        if (!fs.existsSync(filePath)) {
            const errorMsg = 'File not found: ' + filePath;
            console.log(errorMsg);
            vscode.window.showErrorMessage(errorMsg);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        console.log('Content: ' + content);
        let count = 0;
        translations = {}; // Reset translations object
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                translations[key.trim()] = value.trim();
                count++;
            }
        });
        
        log(`Successfully loaded ${count} translations`);
        vscode.window.showInformationMessage(`Loaded ${count} translations successfully`);

        // Update decorations in all visible editors
        updateAllEditorDecorations();
    } catch (error) {
        const errorMsg = 'Error loading translations: ' + error.message;
        log(errorMsg);
        vscode.window.showErrorMessage(errorMsg);
    }
}

// Setup file watcher
function setupFileWatcher(context) {
    // Dispose of existing watcher if it exists
    if (fileWatcher) {
        fileWatcher.dispose();
    }
    
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder found');
        }

        const config = vscode.workspace.getConfiguration('dotcmsTranslations');
        const relativePath = config.get('propertiesPath', 'dotCMS/src/main/webapp/WEB-INF/messages/Language.properties');

        // Create new file system watcher using workspace relative pattern
        fileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolders[0], relativePath)
        );

        // Watch for file changes
        fileWatcher.onDidChange(() => {
            log('Language.properties file changed. Reloading translations...');
            loadTranslations();
        });

        // Watch for file deletion
        fileWatcher.onDidDelete(() => {
            log('Language.properties file was deleted');
            translations = {};
            vscode.window.showWarningMessage('Translation file was deleted');
            updateAllEditorDecorations();
        });

        // Watch for file creation
        fileWatcher.onDidCreate(() => {
            log('Language.properties file was created. Loading translations...');
            loadTranslations();
        });

        // Add to subscriptions for cleanup
        context.subscriptions.push(fileWatcher);
        
        log('File watcher setup successfully');
    } catch (error) {
        log('Error setting up file watcher: ' + error.message);
        vscode.window.showErrorMessage('Failed to setup file watcher: ' + error.message);
    }
}

// Update decorations in all visible editors
function updateAllEditorDecorations() {
    vscode.window.visibleTextEditors.forEach(editor => {
        if (editor.document.languageId === 'html') {
            updateDecorations(editor);
        }
    });
}

// Update decorations in a specific editor
function updateDecorations(editor) {
    const text = editor.document.getText();
    const regex = /'([^']*)'\s*\|\s*dm/g;
    const decorationsArray = [];

    let match;
    while ((match = regex.exec(text)) !== null) {
        const key = match[1];
        if (translations[key]) continue;

        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);

        const decoration = {
            range: new vscode.Range(startPos, endPos),
            renderOptions: {
                borderWidth: '0 0 1px 0',
                borderStyle: 'solid',
                borderColor: 'red',
                light: {
                    borderColor: 'red'
                },
                dark: {
                    borderColor: 'red'
                }
            }
        };
        decorationsArray.push(decoration);
    }

    editor.setDecorations(decorationType, decorationsArray);
}

// Provide hover information
function provideHover(document, position) {
    console.log('Providing hover', translations);
    try {
        log('Hover triggered at position: ' + position.line + ':' + position.character);
        
        const range = document.getWordRangeAtPosition(position, /'[^']*'\s*\|\s*dm/);
        if (!range) {
            log('No matching range found');
            return null;
        }

        const text = document.getText(range);
        log('Found text: ' + text);

        const match = text.match(/'([^']*)'/);
        if (match) {
            const key = match[1];
            log('Looking up translation for key: ' + key);
            
            if (translations[key]) {
                log('Found translation: ' + translations[key]);
                return new vscode.Hover(`Translation: ${translations[key]}`);
            } else {
                log('No translation found for key: ' + key);
                return new vscode.Hover(`No translation found for key: ${key}`);
            }
        }
    } catch (error) {
        log('Error in provideHover: ' + error.message);
        return null;
    }
    return null;
}

function activate(context) {
    console.log('Activating extension');
    // Create output channel first thing
    createOutputChannel();
    log('Extension is being activated');

    // Create decoration type with updated styling
    decorationType = vscode.window.createTextEditorDecorationType({
        borderWidth: '0 0 1px 0',
        borderStyle: 'solid',
        borderColor: 'red',
        light: {
            borderColor: 'red'
        },
        dark: {
            borderColor: 'red'
        }
    });
    
    // Register a command to manually reload translations
    let reloadCommand = vscode.commands.registerCommand('dotcms-language-services.reloadTranslations', () => {
        log('Reload translations command triggered');
        loadTranslations();
    });
    context.subscriptions.push(reloadCommand);

    // Setup file watcher
    setupFileWatcher(context);

    // Load translations initially
    loadTranslations();

    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider('html', {
        provideHover
    });
    context.subscriptions.push(hoverProvider);

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'html') {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);

    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document && editor.document.languageId === 'html') {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);

    log('Extension successfully activated');
}

function deactivate() {
    log('Extension is being deactivated');
    if (outputChannel) {
        outputChannel.dispose();
    }
    if (fileWatcher) {
        fileWatcher.dispose();
    }
    if (decorationType) {
        decorationType.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};