import * as vscode from "vscode";

enum Step {
  EnterPrompt,
  SelectFiles,
}

interface State {
  step: Step;
  prompt: string;
  selectedFiles: vscode.QuickPickItem[];
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "my-vscode-extension.showPrompt",
    async () => {
      const state: State = {
        step: Step.EnterPrompt,
        prompt: "",
        selectedFiles: [],
      };

      const quickPick = vscode.window.createQuickPick();

      const updateQuickPick = async () => {
        switch (state.step) {
          case Step.EnterPrompt:
            quickPick.title = "Enter your prompt";
            quickPick.placeholder = "Enter your prompt";
            quickPick.items = [];
            quickPick.value = state.prompt;
            quickPick.canSelectMany = false;
            quickPick.buttons = [];
            break;
          case Step.SelectFiles:
            quickPick.title = `Prompt: "${state.prompt}" - Select files (optional)`;
            quickPick.placeholder = "Search files to include";
            quickPick.items = await getRecentFiles();
            quickPick.selectedItems = state.selectedFiles;
            quickPick.canSelectMany = true;
            quickPick.buttons = [vscode.QuickInputButtons.Back];
            quickPick.value = ""; // Clear the input field
            break;
        }
      };

      quickPick.onDidChangeValue((value) => {
        if (state.step === Step.EnterPrompt) {
          state.prompt = value;
        }
      });

      quickPick.onDidChangeSelection((items) => {
        if (state.step === Step.SelectFiles) {
          state.selectedFiles = [...items];
        }
      });

      quickPick.onDidTriggerButton((button) => {
        if (button === vscode.QuickInputButtons.Back) {
          state.step = Step.EnterPrompt;
          updateQuickPick();
        }
      });

      quickPick.onDidAccept(async () => {
        if (state.step === Step.EnterPrompt) {
          if (state.prompt.trim()) {
            state.step = Step.SelectFiles;
            updateQuickPick();
          } else {
            vscode.window.showWarningMessage(
              "Please enter a prompt before proceeding."
            );
          }
        } else {
          let message = `Prompt: ${state.prompt}\n`;
          message += `Selected files: ${state.selectedFiles
            .map((item) => item.label)
            .join(", ")}`;
          vscode.window.showInformationMessage(message);
          console.log(message); // This will log to the Debug Console
          quickPick.hide();
        }
      });

      updateQuickPick();
      quickPick.show();
    }
  );

  context.subscriptions.push(disposable);
}

async function getRecentFiles(): Promise<vscode.QuickPickItem[]> {
  const recentFiles = await vscode.workspace.findFiles("**/*", null, 10);
  const currentFile = vscode.window.activeTextEditor?.document.uri;

  return recentFiles.map((file) => ({
    label: vscode.workspace.asRelativePath(file),
    description: "Recently opened file",
    picked: file.fsPath === currentFile?.fsPath,
  }));
}

export function deactivate() {}
