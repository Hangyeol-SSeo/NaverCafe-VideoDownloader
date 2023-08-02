// popup.js

// 데이터를 화면에 표시하는 함수
function displayVideoSources(videoSources) {
    const listElement = document.getElementById('videoList');
    videoSources.forEach(videoSource => {
        const listItem = document.createElement('li');
        listItem.textContent = videoSource.subject;
        listElement.appendChild(listItem);
    });
}

// 팝업이 로드될 때 저장된 정보를 화면에 표시
document.addEventListener('DOMContentLoaded', () => {
    const videoSources = JSON.parse(localStorage.getItem('videoSources') || '[]');
    if (videoSources) {
        displayVideoSources(videoSources);
    }
    chrome.storage.local.get('videoSources', (result) => {
        console.log(result);
        if (result.videoSources) {
            displayVideoSources(result.videoSources);
        }
    });
});
