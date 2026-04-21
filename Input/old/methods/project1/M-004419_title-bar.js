constructor({ workspace, themes, applicationDelegate }) {
  this.dblclickHandler = this.dblclickHandler.bind(this);
  this.workspace = workspace;
  this.themes = themes;
  this.applicationDelegate = applicationDelegate;
  this.element = document.createElement('div');
  this.element.classList.add('title-bar');

  this.titleElement = document.createElement('div');
  this.titleElement.classList.add('title');
  this.element.appendChild(this.titleElement);

  this.element.addEventListener('dblclick', this.dblclickHandler);

  this.workspace.onDidChangeWindowTitle(() => this.updateTitle());
  this.themes.onDidChangeActiveThemes(() => this.updateWindowSheetOffset());

  this.updateTitle();
  this.updateWindowSheetOffset();
}
