let videoSources = [];
let detectedUrls = new Set(); // 중복 요청을 방지하기 위한 Set

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.url.startsWith("https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/") && !detectedUrls.has(details.url)) {
            detectedUrls.add(details.url); // 중복 요청 방지를 위해 감지된 URL
            //console.log(details.url);

            // fetch를 사용하여 해당 URL로 GET 요청을 보냅니다.
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
                    chrome.storage.local.set({videoSources: videoSources}, function() {
                        console.log('Data saved to chrome.storage.local');
                    });
                })
                .catch(error => {
                    console.error("Error fetching the URL:", error);
                });
        }
    },
    {urls: ["https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/*"]}
);

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('cafe.naver.com')) {
        // 페이지 로드가 완료되면 videoSources와 detectedUrls를 초기화합니다.
        videoSources = [];
        detectedUrls.clear();
        if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove('videoSources', () => {
                console.log('videoSources data removed from local storage.');
            });
        }
    }
});

/*
 * 다른 탭을 삭제해도 없어지는 오류 수정해야 함
 */
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    // 탭이 종료되면 videoSources와 detectedUrls를 초기화합니다.
    videoSources = [];
    detectedUrls.clear();
    if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove('videoSources', () => {
            console.log('videoSources data removed from local storage on tab close.');
        });
    }
});