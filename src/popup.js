document.addEventListener("DOMContentLoaded", function () {
  // 팝업이 로드될 때 저장된 해상도 값을 불러옴
  chrome.storage.local.get("selectedQuality", function (data) {
    const comboBox = document.getElementById("qualitySelect");
    if (data.selectedQuality) {
      comboBox.value = data.selectedQuality;
    } else {
      comboBox.value = "1080p"; // 기본값
    }
  });

  // 콤보 박스의 값이 변경될 때마다 해당 값을 저장
  document
    .getElementById("qualitySelect")
    .addEventListener("change", function () {
      var selectedValue = this.value;
      chrome.storage.local.set({ selectedQuality: selectedValue });
    });
});

function displayVideoSources(videoSources) {
  const listElement = document.getElementById("videoList");
  const noVideoMessage = document.getElementById("noVideoMessage");

  if (videoSources.length === 0) {
    noVideoMessage.style.display = "block";
  } else {
    // noVideoMessage.style.display = "none";
    noVideoMessage.innerText = "영상을 클릭하시면 해상도를 고를 수 있습니다.";

    const qualitySelect = document.getElementById("qualitySelect");
    qualitySelect.childNodes.forEach((node) => {
      qualitySelect.removeChild(node);
    });

    videoSources.forEach((videoSource) => {
      const listItem = document.createElement("li");
      listItem.textContent = videoSource.subject;
      //console.log(videoSource.subject);

      // 다운로드 버튼 추가
      const downloadBtn = document.createElement("button");
      downloadBtn.className = "download-btn";
      downloadBtn.addEventListener("click", function () {
        handleDownloadClick(videoSource);
      });
      listItem.appendChild(downloadBtn);

      listElement.appendChild(listItem);

      listItem.addEventListener("click", () => {
        lis = document.getElementsByTagName("li");
        for (let i = 0; i < lis.length; i++) {
          lis[i].style.backgroundColor = "#FFFFFF";
        }

        listItem.style.backgroundColor = "#BFBFBF";

        qualitySelect.innerHTML = "";
        console.log(videoSource.videos);
        let videos = videoSource.videos.sort((a, b) => {
          console.log(a.encodingName, b.encodingName);
          return a.encodingName < b.encodingName ? 1 : -1;
        });
        console.log(videos);
        videos.forEach((video) => {
          const option = document.createElement("option");
          option.value = video.encodingName;
          option.text = video.encodingName;
          qualitySelect.appendChild(option);
        });
      });
    });
  }
}

// 다운로드 버튼 클릭 이벤트 핸들러
function handleDownloadClick(videoSource) {
  // 현재 항목의 콤보박스에서 선택된 값을 가져옵니다.
  const comboBox = document.getElementById("qualitySelect");
  const selectedEncoding = comboBox.value;
  console.log(selectedEncoding);

  // videoSource에서 일치하는 encodingName을 찾습니다.
  const matchedVideo = videoSource.videos.find(
    (video) => video.encodingName === selectedEncoding
  );
  //console.log(matchedVideo);

  // 일치하는 항목의 source를 사용하여 동영상을 다운로드합니다.
  if (matchedVideo) {
    const filename = sanitizeFilename(videoSource.subject);
    // TODO: 파일 이름 에러시 처리
    chrome.downloads.download(
      { url: matchedVideo.source, filename: filename + ".mp4" },
      function (downloadId) {
        if (chrome.runtime.lastError) {
          chrome.downloads.download({ url: matchedVideo.source });
        }
      }
    );
    showToast(videoSource.subject + "  download");
  }
  if (matchedVideo === undefined) {
    showToast("선택한 화질이 없습니다");
  }
}

// 팝업이 로드될 때 저장된 정보를 화면에 표시
document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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

  setTimeout(function () {
    toast.classList.remove("show");
  }, duration);
}

function sanitizeFilename(filename) {
  // 영어 알파벳, 한글, 숫자, 하이픈(-), 언더스코어(_), 공백 및 마침표(.)만을 허용합니다.
  let sanitized = filename.replace(/[^a-zA-Z0-9가-힣\-_.]/g, "_");

  // 파일 이름 끝의 공백과 마침표를 제거합니다
  sanitized = sanitized.replace(/[\s.]+$/g, "");

  return sanitized;
}
