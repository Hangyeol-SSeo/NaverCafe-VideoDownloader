document.addEventListener('DOMContentLoaded', function() {
    // 팝업이 로드될 때 저장된 해상도 값을 불러옴
    chrome.storage.local.get('selectedQuality', function(data) {
        const comboBox = document.getElementById('qualitySelect');
        if (data.selectedQuality) {
            comboBox.value = data.selectedQuality;
        } else {
            comboBox.value = '1080p'; // 기본값
        }
    });

    // 콤보 박스의 값이 변경될 때마다 해당 값을 저장
    document.getElementById('qualitySelect').addEventListener('change', function() {
        var selectedValue = this.value;
        chrome.storage.local.set({ 'selectedQuality': selectedValue });
    });
});


function displayVideoSources(videoSources) {
    /*
     * 제목이 같은 경우는???
     * 팝업을 닫아도 선택한 화질이 변경되지 않도록...
     * 광고추가
     * 파일 이름 수정
     */
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
    //console.log(matchedVideo);

    // 일치하는 항목의 source를 사용하여 동영상을 다운로드합니다.
    if (matchedVideo) {
        chrome.downloads.download({ url: matchedVideo.source });
    }
    if (matchedVideo === undefined) {
        showToast('선택한 화질이 없습니다');
    }
}

// 팝업이 로드될 때 저장된 정보를 화면에 표시
document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        let tab = String(tabs[0].id);
        chrome.storage.local.get(tab, (result) => {
            if (result[tab]) {
                displayVideoSources(result[tab]);
            }
        });
    });
});

function showToast(message, duration = 2000) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function() {
        toast.classList.remove("show");
    }, duration);
}
