function getContainer() {
    return document.querySelector('body');
}

function getActiveTabId() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getActiveTabId" }, (response) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            if (response && response.tabId !== undefined) {
                resolve(response.tabId);
            } else {
                reject("No tab id received.");
            }
        });
    });
}

// 현재 탭의 videoSources 데이터를 storage에서 가져오는 함수
async function getCurrentTabVideoSources() {
    try {
        const tabId = await getActiveTabId();
        const tabKey = String(tabId);
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(tabKey, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result[tabKey]);
                }
            });
        });
    } catch (error) {
        console.error("Error getting video sources for current tab:", error);
        throw error;
    }
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
        getCurrentTabVideoSources()
            .then(videoSources => {
                console.log("Video sources for current tab:", videoSources);
            })
            .catch(error => {
                console.error("Failed to retrieve video sources:", error);
            });
    };
    button.appendChild(img);
    return button;
}

function insertButtons(doc) {
    const titleContainers = doc.querySelectorAll('.se-media-meta-info-wrap');
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

function handleContent(body) {
    insertButtons(body);

    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                insertButtons(body);
            }
        }
    });
    observer.observe(body, { childList: true, subtree: true });
}

window.onload = () => {
    setTimeout(() => {
        const body = getContainer();
        if (body) {
            insertButtons(body);
        } else {
            console.error('Iframe with id "cafe_main" not found after waiting.');
        }
    }, 500);
};
