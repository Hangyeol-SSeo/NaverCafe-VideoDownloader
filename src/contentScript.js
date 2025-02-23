function getIframe() {
    // console.log(document.body);
    // console.log(document.querySelector('.ArticleContentBox'));
    // console.log(document.querySelector('.se-media-meta-info-title-text'));
    return document.querySelector('body');
}

function getIframeDocument(iframe) {
    return new Promise((resolve, reject) => {
        if (iframe) {
            resolve(iframe.contentWindow.document);
        } else {
            reject('Iframe not found.');
        }
    });
}

function createButton() {
    const button = document.createElement('button');
    button.style.marginLeft = "10px";
    button.style.width = "24px";
    button.style.height = "24px";

    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/download_button.png');
    img.style.width = "24px";
    img.style.height = "24px";

    button.classList.add('download-btn');
    button.onclick = function () {
        alert('Button clicked!');
    };
    button.appendChild(img);
    return button;
}

function insertButtons(iframeDoc) {
    const titleContainers = iframeDoc.querySelectorAll('.se-media-meta-info-wrap');
    console.log(titleContainers);
    titleContainers.forEach(container => {
        const titleElementContainer = container.querySelector('.se-media-meta-info-title-only');
        titleElementContainer.style.display = "flex";
        container.style.alignItems = "center";

        const titleElement = container.querySelector('.se-media-meta-info-title-text');
        if (titleElement && !titleElement.querySelector('.download-btn')) {

            const button = createButton();
            titleElement.insertAdjacentElement('afterend', button);
            console.log('Button inserted next to title:', titleElement.textContent);
        }
    });
}

function handleIframe(iframe) {
    insertButtons(iframe);

    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                insertButtons(iframe);
            }
        }
    });
    observer.observe(iframeDoc.body, { childList: true, subtree: true });
}

window.onload = () => {
    setTimeout(() => {
        const iframe = getIframe();
        if (iframe) {
            handleIframe(iframe);
        } else {
            console.error('Iframe with id "cafe_main" not found after waiting.');
        }
    }, 500);
};