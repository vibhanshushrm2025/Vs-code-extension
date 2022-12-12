// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HelloWorldPanel } from './HelloWorldPanel';
import { SidebarProvider } from './SidebarProvider';


export function activate(context: vscode.ExtensionContext) {


	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"LiveQD-sidebar",
			sidebarProvider
		)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("LQD.RefreshWebviews",()=>{
			HelloWorldPanel.kill();
			HelloWorldPanel.createOrShow(context.extensionUri);
			setTimeout(()=>{
				vscode.commands.executeCommand(
					"workbench.action.webview.openDeveloperTools"
				);
			},500);
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand('LQD.helloWorld', () => {
		HelloWorldPanel.createOrShow(context.extensionUri);
	})
	);
}

export function deactivate() { }
