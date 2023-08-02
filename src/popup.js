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

            // // 콤보박스 추가
            // const comboBox = document.createElement('select');
            // comboBox.id = 'qualitySelect';
            // ['270p', '480p', '720p', '1080p'].forEach(optionValue => {
            //     const option = document.createElement('option');
            //     option.value = optionValue;
            //     option.textContent = optionValue;
            //     comboBox.appendChild(option);
            // });
            // listItem.appendChild(comboBox);

            // 다운로드 버튼 추가
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.addEventListener('click', function() {
                handleDownloadClick(videoSource);
            });
            listItem.appendChild(downloadBtn);

            listElement.appendChild(listItem);
        });
    }
}

// 다운로드 버튼 클릭 이벤트 핸들러
function handleDownloadClick(videoSource) {
    // 현재 항목의 콤보박스에서 선택된 값을 가져옵니다.
    const comboBox = document.getElementById('qualitySelect');
    const selectedEncoding = comboBox.value;
    console.log(selectedEncoding);

    // videoSource에서 일치하는 encodingName을 찾습니다.
    const matchedVideo = videoSource.videos.find(video => video.encodingName === selectedEncoding);
    console.log(matchedVideo);

    // 일치하는 항목의 source를 사용하여 동영상을 다운로드합니다.
    if (matchedVideo) {
        chrome.downloads.download({ url: matchedVideo.source });
    }
}

// 팝업이 로드될 때 저장된 정보를 화면에 표시
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('videoSources', (result) => {
        if (result.videoSources) {
            displayVideoSources(result.videoSources);
        }
    });
});
