const tabDataMap = new Map(); // key: tabId, value: { videoSources: [], detectedUrls: Set() }


chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (details.tabId < 0) return;
        processVideoRequest(details).catch((err) => console.error(err));
    },
    { urls: ["https://apis.naver.com/neonplayer/vodplay/v3/playback/*"] }
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
        const response = await fetch(details.url, {
            headers: {
                'Accept': 'application/xml, text/xml, */*'
            }
        });
        const xmlText = await response.text();

        // XML 파싱 (Regex 사용)
        const subjectMatch = xmlText.match(/<nvod:Title>(.*?)<\/nvod:Title>/);
        const subject = subjectMatch ? subjectMatch[1] : "Unknown Title";

        // Representation 블록 추출
        const representations = [];
        const repRegex = /<Representation([\s\S]*?)<\/Representation>/g;
        let match;

        while ((match = repRegex.exec(xmlText)) !== null) {
            const content = match[1];
            
            // 해상도 추출 (Label 또는 속성에서)
            let resolution = "Unknown";
            const resMatch = content.match(/<nvod:Label kind="resolution">(\d+)<\/nvod:Label>/);
            if (resMatch) {
                resolution = resMatch[1] + "p";
            } else {
                 const heightMatch = content.match(/height="(\d+)"/);
                 if (heightMatch) resolution = heightMatch[1] + "p";
            }

            // BaseURL 추출
            const busUrlMatch = content.match(/<BaseURL>(.*?)<\/BaseURL>/);
            if (busUrlMatch) {
                // XML 엔티티 디코딩 (&amp; -> &)
                const source = busUrlMatch[1].replace(/&amp;/g, '&');
                representations.push({
                    encodingName: resolution,
                    source: source
                });
            }
        }

        if (representations.length > 0) {
            tabData.videoSources.push({
                subject: subject,
                code: videoCode,
                videos: representations
            });
            
            await chrome.storage.local.set({ [String(tabId)]: tabData.videoSources });
            console.log(`Data saved to chrome.storage.local for tab ${tabId}`, tabData.videoSources);
        } else {
            console.log('No video representations found in XML.');
        }

    } catch (error) {
        console.error("Error fetching or parsing the URL:", error);
    }
}

function extractVideoCode(url) {
    const urlParts = url.split('/');
    // v3/playback/{VIDEO_ID}?key=...
    const index = urlParts.findIndex(part => part === 'playback');
    if (index !== -1 && urlParts.length > index + 1) {
        // ID might be followed by query params if split logic usually separates by /, 
        // but here the ID is a path segment.
        // However, url acts on the full string. 
        // Let's grab the segment after 'playback'
        let idSegment = urlParts[index + 1];
        // Remove query parameters if present in this segment (though usually split by / handles path)
        if (idSegment.includes('?')) {
            idSegment = idSegment.split('?')[0];
        }
        return idSegment;
    }
    return '';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getActiveTabId") {
        sendResponse({ tabId: sender.tab ? sender.tab.id : null });
    } else if (message.action === "download") {
        chrome.downloads.download({
            url: message.url,
            filename: message.filename
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("Download failed:", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, downloadId: downloadId });
            }
        });
        return true; // Keep the message channel open for async response
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