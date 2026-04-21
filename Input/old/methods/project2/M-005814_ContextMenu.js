_createMenuUI(menu) { // Builds DOM elements for a menu

    const groups = menu.groups;
    const html = [];

    html.push('<div class="xeokit-context-menu ' + menu.id + '" style="z-index:300000; position: absolute;">');

    html.push('<ul>');

    if (groups) {

        for (let i = 0, len = groups.length; i < len; i++) {

            const group = groups[i];
            const groupIdx = i;
            const groupLen = len;
            const groupItems = group.items;

            if (groupItems) {

                for (let j = 0, lenj = groupItems.length; j < lenj; j++) {

                    const item = groupItems[j];
                    const itemSubMenu = item.subMenu;
                    const actionTitle = item.title || "";

                    if (itemSubMenu) {

                        html.push(
                            '<li id="' + item.id + '" class="xeokit-context-menu-item" style="' +
                            ((groupIdx === groupLen - 1) || ((j < lenj - 1)) ? 'border-bottom: 0' : 'border-bottom: 1px solid black') +
                            '">' +
                            actionTitle +
                            ' [MORE]' +
                            '</li>');

                    } else {

                        html.push(
                            '<li id="' + item.id + '" class="xeokit-context-menu-item" style="' +
                            ((groupIdx === groupLen - 1) || ((j < lenj - 1)) ? 'border-bottom: 0' : 'border-bottom: 1px solid black') +
                            '">' +
                            actionTitle +
                            '</li>');
                    }
                }
            }
        }
    }

    html.push('</ul>');
    html.push('</div>');

    const htmlString = html.join("");

    document.body.insertAdjacentHTML('beforeend', htmlString);

    const menuElement = document.querySelector("." + menu.id);

    menu.menuElement = menuElement;

    menuElement.style["border-radius"] = 4 + "px";
    menuElement.style.display = 'none';
    menuElement.style["z-index"] = 300000;
    menuElement.style.background = "white";
    menuElement.style.border = "1px solid black";
    menuElement.style["box-shadow"] = "0 4px 5px 0 gray";
    menuElement.oncontextmenu = (e) => {
        e.preventDefault();
    };

    // Bind event handlers

    const self = this;

    let lastSubMenu = null;

    if (groups) {

        for (let i = 0, len = groups.length; i < len; i++) {

            const group = groups[i];
            const groupItems = group.items;

            if (groupItems) {

                for (let j = 0, lenj = groupItems.length; j < lenj; j++) {

                    const item = groupItems[j];
                    const itemSubMenu = item.subMenu;

                    item.itemElement = document.getElementById(item.id);

                    if (!item.itemElement) {
                        console.error("ContextMenu item element not found: " + item.id);
                        continue;
                    }

                    item.itemElement.addEventListener("mouseenter", (event) => {
                        event.preventDefault();

                        const subMenu = item.subMenu;
                        if (!subMenu) {
                            if (lastSubMenu) {
                                self._hideMenu(lastSubMenu.id);
                                lastSubMenu = null;
                            }
                            return;
                        }
                        if (lastSubMenu && (lastSubMenu.id !== subMenu.id)) {
                            self._hideMenu(lastSubMenu.id);
                            lastSubMenu = null;
                        }

                        if (item.enabled === false) {
                            return;
                        }

                        const itemElement = item.itemElement;
                        const subMenuElement = subMenu.menuElement;

                        const itemRect = itemElement.getBoundingClientRect();
                        const menuRect = subMenuElement.getBoundingClientRect();

                        const subMenuWidth = 200; // TODO
                        const showOnLeft = ((itemRect.right + subMenuWidth) > window.innerWidth);

                        if (showOnLeft) {
                            self._showMenu(subMenu.id, itemRect.left - subMenuWidth, itemRect.top - 1);
                        } else {
                            self._showMenu(subMenu.id, itemRect.right - 5, itemRect.top - 1);
                        }

                        lastSubMenu = subMenu;
                    });

                    if (!itemSubMenu) {

                        // Item without sub-menu
                        // clicking item fires the item's action callback

                        item.itemElement.addEventListener("click", (event) => {
                            event.preventDefault();
                            if (!self._context) {
                                return;
                            }
                            if (item.enabled === false) {
                                return;
                            }
                            if (item.doAction) {
                                item.doAction(self._context);
                            }
                            if (this._hideOnAction) {
                                self.hide();
                            } else {
                                self._updateItemsTitles();
                                self._updateItemsEnabledStatus();
                            }
                        });
                        item.itemElement.addEventListener("mouseenter", (event) => {
                            event.preventDefault();
                            if (item.enabled === false) {
                                return;
                            }
                            if (item.doHover) {
                                item.doHover(self._context);
                            }
                        });

                    }
                }
            }
        }
    }
}
