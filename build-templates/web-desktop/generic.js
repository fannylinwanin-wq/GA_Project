function setFaviconToFunta() {
    changeFavicon('./favicon/funta_logo.ico');
}

function setFaviconToDefault() {
    changeFavicon('./favicon/logo.png');
}

function changeFavicon(src) {
    // 尋找 rel 包含 'icon' 的 link 標籤
    let link = document.querySelector("link[rel~='icon']");

    // 如果找不到，就手動建立一個
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }

    // 更改圖片路徑
    link.href = src;
}

function setWebPageTitle(title) {
    document.title = title;
}

window.setFaviconToFunta = setFaviconToFunta;
window.setFaviconToDefault = setFaviconToDefault;
window.setWebPageTitle = setWebPageTitle;
