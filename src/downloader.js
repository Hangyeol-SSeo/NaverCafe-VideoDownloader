const observer = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const iframe = getIframe();
            if (iframe) {
                handleIframe(iframe);
                observer.disconnect();  // iframe을 찾았으므로 Observer를 중지합니다.
            }
        }
    }
});

function handleIframe(iframe) {
    iframe.addEventListener('load', function() {
        getIframeDocument(iframe)
            .then((iframeDoc) => {
                console.log("afdfaslfjsdalflksajklfsj");
                for (let targetElement of iframeDoc.getElementsByClassName('se-media-meta-info-wrap')) {
                    button = createButton();
                    const textElements = targetElement.getElementsByClassName('se-media-meta-info-title-text');
                    if (textElements.length > 0) {
                        if (!textElements[0].querySelector('button')) {
                            textElements[0].appendChild(button);
                            console.log('button added');
                        }
                    }
                }
            })
            .catch(error => console.error(error));
    });
}

// Observer 설정
observer.observe(document.body, { childList: true, subtree: true });


