render({
  outline,
  pdfDocument
}) {
  if (this._outline) {
    this.reset();
  }

  this._outline = outline || null;
  this._pdfDocument = pdfDocument || null;

  if (!outline) {
    this._dispatchEvent(0);

    return;
  }

  const fragment = document.createDocumentFragment();
  const queue = [{
    parent: fragment,
    items: outline
  }];
  let outlineCount = 0,
      hasAnyNesting = false;

  while (queue.length > 0) {
    const levelData = queue.shift();

    for (const item of levelData.items) {
      const div = document.createElement("div");
      div.className = "treeItem";
      const element = document.createElement("a");

      this._bindLink(element, item);

      this._setStyles(element, item);

      element.textContent = this._normalizeTextContent(item.title);
      div.appendChild(element);

      if (item.items.length > 0) {
        hasAnyNesting = true;

        this._addToggleButton(div, item);

        const itemsDiv = document.createElement("div");
        itemsDiv.className = "treeItems";
        div.appendChild(itemsDiv);
        queue.push({
          parent: itemsDiv,
          items: item.items
        });
      }

      levelData.parent.appendChild(div);
      outlineCount++;
    }
  }

  this._finishRendering(fragment, outlineCount, hasAnyNesting);
}
