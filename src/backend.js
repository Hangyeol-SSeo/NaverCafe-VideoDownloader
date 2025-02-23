const tabDataMap = new Map(); // key: tabId, value: { videoSources: [], detectedUrls: Set() }

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        // 요청이 탭과 관련이 없는 경우(-1) 무시
        // 해당 요청이 브라우저 탭과 연결되지 않은 경우 tabid == -1
        if (details.tabId < 0) return;
        processVideoRequest(details).catch((err) => console.error(err));
        console.log(tabDataMap.get(details.tabId));
    },
    { urls: ["https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/*"] }
);

async function processVideoRequest(details) {
    const tabId = details.tabId;

    if (!tabDataMap.has(tabId)) {
        tabDataMap.set(tabId, { videoSources: [], detectedUrls: new Set() });
    }
    const tabData = tabDataMap.get(tabId);

    if (tabData.detectedUrls.has(details.url)) return;
    tabData.detectedUrls.add(details.url);

    const videoCode = extractVideoCode(details.url);

    try {
        const response = await fetch(details.url);
        const data = await response.json();

        if (data.videos && data.videos.list) {
            let videoInfoList = data.videos.list.map(video => ({
                encodingName: video.encodingOption.name,
                source: video.source
            }));
            tabData.videoSources.push({
                subject: data.meta.subject,
                code: videoCode,
                videos: videoInfoList
            });
        } else {
            console.log('Unexpected data structure:', data);
        }

        await chrome.storage.local.set({ [String(tabId)]: tabData.videoSources });
        console.log(`Data saved to chrome.storage.local for tab ${tabId}`);
    } catch (error) {
        console.error("Error fetching the URL:", error);
    }
}

function extractVideoCode(url) {
    const urlParts = url.split('/');
    const index = urlParts.findIndex(part => part === 'v2.0');
    if (index !== -1 && urlParts.length > index + 1) {
        const target = urlParts[index + 1];
        const match = target.match(/[A-Z0-9]+/g);
        if (match) {
            return match[0];
        }
    }
    return '';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getActiveTabId") {
        sendResponse({ tabId: sender.tab ? sender.tab.id : null });
    }
});

// 탭 업데이트 시 해당 탭의 데이터와 스토리지 정리
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading') {
        if (tabDataMap.has(tabId)) {
            tabDataMap.delete(tabId);
        }
        chrome.storage.local.get(String(tabId), function (result) {
            if (result[String(tabId)]) {
                chrome.storage.local.remove(String(tabId), function () {
                    console.log(`videoSources data removed from local storage for tab ${tabId} due to page update`);
                });
            }
        });
    }
});

// 탭 제거 시 해당 탭의 데이터와 스토리지 정리
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (tabDataMap.has(tabId)) {
        tabDataMap.delete(tabId);
    }
    chrome.storage.local.get(String(tabId), function (result) {
        if (result[String(tabId)]) {
            chrome.storage.local.remove(String(tabId), function () {
                console.log(`videoSources data removed from local storage for tab ${tabId} due to tab removal`);
            });
        }
    });
});

function getActiveTabs() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            resolve(tabs);
        });
    });
}