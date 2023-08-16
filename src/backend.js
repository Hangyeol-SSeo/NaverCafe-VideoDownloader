let videoSources = [];
let detectedUrls = new Set(); // 중복 요청을 방지하기 위한 Set

/*
 * onBeforeRequest를 사용해야 할까?
 * webRequest의 생명주기: https://developer.chrome.com/docs/extensions/reference/webRequest/#life_cycle_footnote
 * onBeforeRequest(sync) - 250ms + a
 * onSendHeaders(async) - 500ms - a
 * onBeforeRequest가 가장 빠르게 동작하기 때문에 응답 속도가 가장 빠름
 */
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        //console.log(details);
        if (details.url.startsWith("https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/") && !detectedUrls.has(details.url)) {
            detectedUrls.add(details.url); // 중복 요청 방지를 위해 감지된 URL 추가
            //console.log(details.url);

            // fetch를 사용하여 해당 URL로 GET 요청을 보내기
            fetch(details.url)
                .then(response => response.json())
                .then(data => {
                    let videoInfoList = data.videos.list.map(video => ({
                        encodingName: video.encodingOption.name,
                        source: video.source
                    }));
                    videoSources.push({
                        subject: data.meta.subject,
                        videos: videoInfoList
                    });
                    //console.log(videoSources);
                    // 로컬 스토리지에 저장
                    /*
                     * chrome.storage.local vs sessionStorage vs localStorage
                     * sessionStorage를 사용할 경우 특정 background에서는 특정 탭에 접근할 수 없음.
                     * chrome.storage.local을 사용하여 탭별로 정보 구분
                     */
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        if (tabs && tabs.length > 0) {
                            const tabId = tabs[0].id;
                            chrome.storage.local.set({[String(tabId)]: videoSources}, function() {
                                console.log(`Data saved to chrome.storage.local for tab ${tabId}`);
                                setTimeout(() => {
                                    videoSources = [];
                                    detectedUrls.clear();
                                    //console.log("videoSources removed by timeout");
                                }, 3000);
                            });
                        }
                    });

                })
                .catch(error => {
                    console.error("Error fetching the URL:", error);
                });
        }
    },
    {urls: ["https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/*"]}
);

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