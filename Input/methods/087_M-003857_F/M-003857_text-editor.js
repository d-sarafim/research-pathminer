static didUpdateStyles() {
  if (TextEditorComponent == null) {
    TextEditorComponent = require('./text-editor-component');
  }
  return TextEditorComponent.didUpdateStyles();
}
