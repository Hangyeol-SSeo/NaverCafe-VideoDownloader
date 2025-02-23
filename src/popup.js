document.addEventListener('DOMContentLoaded', () => {
    setupQualitySelect();
    loadVideoSources();
});

// 해상도 콤보박스 초기화 및 이벤트 등록
function setupQualitySelect() {
    const comboBox = document.getElementById('qualitySelect');
    chrome.storage.local.get('selectedQuality', (data) => {
        comboBox.value = data.selectedQuality || '1080p';
    });

    comboBox.addEventListener('change', function() {
        const selectedValue = this.value;
        chrome.storage.local.set({ 'selectedQuality': selectedValue });
    });
}

// 현재 활성 탭의 비디오 소스 데이터를 불러와 표시
function loadVideoSources() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            const tabKey = String(tabs[0].id);
            chrome.storage.local.get(tabKey, (result) => {
                if (result[tabKey]) {
                    displayVideoSources(result[tabKey]);
                }
            });
        }
    });
}

// 비디오 소스 데이터를 화면에 리스트로 표시합니다.
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
            downloadBtn.setAttribute('aria-label', `Download ${videoSource.subject}`); // (NEW) 접근성 개선
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
    // 현재 항목의 콤보박스에서 선택된 값을 가져옴
    const comboBox = document.getElementById('qualitySelect');
    const selectedEncoding = comboBox.value;
    console.log(selectedEncoding);

    // videoSource에서 선택한 인코딩에 일치하는 항목 찾기
    const matchedVideo = videoSource.videos.find(video => video.encodingName === selectedEncoding);

    if (matchedVideo) {
        const filename = sanitizeFilename(videoSource.subject);
        chrome.downloads.download({ url: matchedVideo.source, filename: filename + ".mp4" }, function(downloadId) {
            if (chrome.runtime.lastError) {
                // 다운로드 실패 시 재시도
                chrome.downloads.download({ url: matchedVideo.source });
            }
        });
        showToast(videoSource.subject + ' download');
    } else {
        showToast('선택한 화질이 없습니다');
    }
}

// 토스트 메시지 표시 함수
function showToast(message, duration = 2000) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function() {
        toast.classList.remove("show");
    }, duration);
}

// 파일명에서 허용되지 않는 문자를 치환하는 함수
function sanitizeFilename(filename) {
    let sanitized = filename.replace(/[^a-zA-Z0-9가-힣\-_.]/g, '_');
    sanitized = sanitized.replace(/[\s.]+$/g, '');
    return sanitized;
}