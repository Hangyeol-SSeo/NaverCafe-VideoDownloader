let responseData = null;

//clearCacheForSpecificSite();

chrome.webRequest.onCompleted.addListener(
    function(details) {
        if (details.url.startsWith("https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/")) {
            // responseData를 업데이트합니다.
            responseData = details.responseData;
        }
    },
    {urls: ["https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/*"]}
);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "getResponseData") {
            sendResponse(responseData);
        }
    }
);

