
const vscode = require('vscode');
const axios = require('axios');




/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	const res = await axios.get('https://blog.webdevsimplified.com/rss.xml');
	console.log(res.data);

	
	console.log('Congratulations, your extension "demodemo" is now active!');

	
	let disposable = vscode.commands.registerCommand('demodemo.newworld', function () {
		
		vscode.window.showInformationMessage('new world from jkj laxmi cement ');
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
