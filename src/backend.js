let videoSources = [];
let detectedUrls = new Set(); // 중복 요청을 방지하기 위한 Set
let detectedApi = '';

/*
 * onBeforeRequest를 사용해야 할까?
 * webRequest의 생명주기: https://developer.chrome.com/docs/extensions/reference/webRequest/#life_cycle_footnote
 * onBeforeRequest(sync) - 250ms + a
 * onSendHeaders(async) - 500ms - a
 * onBeforeRequest가 가장 빠르게 동작하기 때문에 응답 속도가 가장 빠름
 */
chrome.webRequest.onBeforeRequest.addListener(
    async function(details) {
        if(details.url.startsWith("https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/") && !detectedApi) {
            detectedApi = details.url
        }

        if (details.url.startsWith("https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/") && !detectedUrls.has(details.url)) {
            detectedUrls.add(details.url);

            // console.log(details.url);
            const videoCode = extractVideoCode(details.url);
            // console.log(detectedApi);
            const subject = await fetchVideoTitleFromHtml(detectedApi, videoCode);
            console.log(subject);

            try {
                const response = await fetch(details.url);
                const data = await response.json();

                if (data.videos && data.videos.list) {
                    let videoInfoList = data.videos.list.map(video => ({
                        encodingName: video.encodingOption.name,
                        source: video.source
                    }));
                    videoSources.push({
                        subject: subject,
                        code: videoCode,
                        videos: videoInfoList
                    });
                } else {
                    console.log('Unexpected data structure:', data);
                }

                const tabs = await getActiveTabs();
                if (tabs.length > 0) {
                    const tabId = tabs[0].id;
                    await chrome.storage.local.set({[String(tabId)]: videoSources});
                    console.log(`Data saved to chrome.storage.local for tab ${tabId}`);
                    setTimeout(() => {
                        videoSources = [];
                        detectedUrls.clear();
                        detectedApi = '';
                    }, 3000);
                }
            } catch (error) {
                console.error("Error fetching the URL:", error);
            }
        }
    },
    {urls: ["https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/*", "https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/*"]}
);


async function fetchVideoTitleFromHtml(apiUrl, videoCode) {
    const cafeApiUrl = apiUrl;
    const vidRegex = /\b[A-Z0-9]{36}\b/g;
    const rawTitleRegex = /"title"\s*:\s*"([^"]+)"/g;
    const titleRegex = /"title":"([^"]+)"/;
    // const scriptRegex = /<script type="text\/data" class="__se_module_data" data-module='({[^}]+})'><\/script>/g;
    // const vidRegex = /"vid"\s*:\s*"([A-Z0-9]{36})"/;
    // const vidTitleRegex = /"vid"\s*:\s*"([A-Z0-9]{36})".*"title"\s*:\s*"([^"]+)"/;

    try {
        const response = await fetch(cafeApiUrl);
        const jsonData = await response.json();
        const contentHtml = jsonData.result.article.contentHtml;

        // console.log(contentHtml);
        const vid = contentHtml.match(vidRegex);
        const rawTitle = contentHtml.match(rawTitleRegex);
        const pureTitle = rawTitle.map(rawTitle => {
            const match = titleRegex.exec(rawTitle);
            return match ? match[1] : null;
        });
        // console.log(vid, pureTitle);
        // console.log(videoCode);

        const index = vid.findIndex(vid => vid === videoCode);
        // console.log(pureTitle[index]);
        return pureTitle[index];
    } catch (error) {
        console.log("Error fetching video title from HTML:", error);
        return '';
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

/*
 * changeInfo.status === 'complete'를 사용할 경우 data가 save되는 동시에 삭제되는 오류 발생
 *
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading') {
        chrome.storage.local.get(String(tabId), function(result) {
            // 해당 탭에 데이터가 있으면 삭제합니다.
            if (result[String(tabId)]) {
                chrome.storage.local.remove(String(tabId), function() {
                    console.log(`videoSources data removed from local storage for tab ${tabId} due to page update`);
                });
            }
        });
    }
});

/*
 * 다른 탭을 삭제해도 없어지는 오류 수정해야 함
 */
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    chrome.storage.local.get(String(tabId), function(result) {
        // 해당 탭에 데이터가 있으면 삭제합니다.
        if (result[String(tabId)]) {
            chrome.storage.local.remove(String(tabId), function() {
                console.log(`videoSources data removed from local storage for tab ${tabId} due to tab removal`);
            });
        }
    });
});

function getActiveTabs() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            resolve(tabs);
        });
    });
}