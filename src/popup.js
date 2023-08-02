function displayVideoSources(videoSources) {
    const listElement = document.getElementById('videoList');
    const noVideoMessage = document.getElementById('noVideoMessage');

    if (videoSources.length === 0) {
        noVideoMessage.style.display = 'block';
    } else {
        noVideoMessage.style.display = 'none';
        videoSources.forEach(videoSource => {
            const listItem = document.createElement('li');
            listItem.textContent = videoSource.subject;

            // 다운로드 버튼 추가
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            listItem.appendChild(downloadBtn);

            listElement.appendChild(listItem);
        });
    }
}

// 팝업이 로드될 때 저장된 정보를 화면에 표시
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('videoSources', (result) => {
        //console.log(result);
        if (result.videoSources) {
            displayVideoSources(result.videoSources);
        }
    });
});
