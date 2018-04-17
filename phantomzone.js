(function phantomzone(global) {
  const { document, window, navigator, Image, XMLHttpRequest } = global;

  const bg = document.querySelector('.bg');
  const bgButton = document.querySelector('.button__bg');
  const credit = document.querySelector('.credit');
  const interval = 1000 / 60;
  const phantom = document.querySelector('.phantom');
  const space = document.querySelector('.space');
  const unsplash =
    'https://api.unsplash.com/photos/random?collections=766908&client_id=94d06293992d3e99b67bbba490dff95dd8c5274b540c8460846c41d9f00b0beb';
  const videos = document.querySelectorAll('.zone__loop');
  const zone = document.querySelector('.zone');
  const zoneButton = document.querySelector('.button__zone');
  const zoneH = 300;
  const zoneW = 400;
  let animating = false;
  let bounds = null;
  let elapsed = 0;
  let landscape = true;
  let mediaStream = null;
  let now = 0;
  let pointerX = 0;
  let pointerY = 0;
  let rotateX = 0;
  let rotateY = 0;
  let scale = 1;
  let then = 0;
  let x = 0;
  let y = 0;

  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  function updatePosition() {
    const distX = pointerX - bounds.width * 0.5;
    const distY = pointerY - bounds.height * 0.5;

    rotateY = (rotateY + distX * 0.005 / scale) % 360;
    rotateX = (rotateX - distY * 0.005 / scale) % 360;

    x += -distX * 0.0005;
    y += -distY * 0.0005;

    if (x > bounds.width * 0.5) x = bounds.width * 0.5;
    if (x < bounds.width * -0.5) x = bounds.width * -0.5;
    if (y > bounds.height * 0.5) y = bounds.height * 0.5;
    if (y < bounds.height * -0.5) y = bounds.height * -0.5;

    zone.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    phantom.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }

  function animate() {
    window.requestAnimationFrame(animate);

    now = Date.now();
    animating = false;
    elapsed = now - then;

    if (elapsed > interval) {
      animating = true;
      then = now - elapsed % interval;
      updatePosition();
    }
  }

  function mediaStreamConnected(stream) {
    mediaStream = stream;

    videos.forEach(el => {
      const video = el;
      video.srcObject = mediaStream;
    });

    zoneButton.classList.add('button--active');
  }

  function mediaStreamError(e) {
    // eslint-disable-next-line
    console.error(e);
  }

  function mediaStreamStart() {
    if (navigator.getUserMedia) {
      navigator.getUserMedia(
        { video: true },
        mediaStreamConnected,
        mediaStreamError
      );
    }
  }

  function mediaStreamStop() {
    const tracks = mediaStream.getVideoTracks();

    tracks.forEach(el => {
      const track = el;
      track.stop();
      mediaStream.removeTrack(track);
    });

    mediaStream = null;

    videos.forEach(el => {
      const video = el;
      video.srcObject = null;
      video.play();
    });

    zoneButton.classList.remove('button--active');
  }

  function onBgTransitionEnd(e) {
    space.style.backgroundImage = e.target.style.backgroundImage;
    space.style.opacity = 1;

    bg.removeEventListener('transitionend', onBgTransitionEnd);
    bg.style.backgroundImage = '';
    bg.style.opacity = '';
  }

  function updateBackgroundImage(url) {
    const img = new Image();

    bg.style.backgroundImage = `url(${url})`;
    bg.addEventListener('transitionend', onBgTransitionEnd);

    img.onload = () => {
      bg.style.opacity = 1;
    };

    img.src = url;
  }

  function updateBackgroundAttributes(user) {
    credit.innerHTML = user.username
      ? `/ <a href="https://unsplash.com/@${
          user.username
        }?utm_source=phantomzone&utm_medium=referral&utm_campaign=api-credit" target="_blank" rel="noopener noreferrer">Photo by ${
          user.name
        }</a> / <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>`
      : `/ Photo by ${user.name}`;
  }

  function onGetBackgroundError() {
    updateBackgroundImage('bg.jpg');
    updateBackgroundAttributes({ name: 'NASA' });
  }

  function onGetBackgroundComplete(e) {
    if (!e.target.response || e.target.response.errors) {
      return onGetBackgroundError();
    }

    updateBackgroundImage(e.target.response.urls.regular);
    return updateBackgroundAttributes(e.target.response.user);
  }

  function getBackground() {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('GET', unsplash);
    xhr.addEventListener('load', onGetBackgroundComplete);
    xhr.addEventListener('error', onGetBackgroundError);
    xhr.send();
  }

  function updateBounds() {
    bounds = space.getBoundingClientRect();
    pointerX = bounds.width * 0.55;
    pointerY = bounds.height * 0.53;
    landscape = bounds.width > bounds.height;
    scale = (landscape ? bounds.height / zoneH : bounds.width / zoneW) * 0.5;

    x = bounds.width * 0.5 - zoneW * 0.5;
    y = bounds.height * 0.5 - zoneH * 0.5;
  }

  function onClickBgButton() {
    getBackground();
  }

  function onClickZoneButton() {
    return mediaStream != null ? mediaStreamStop() : mediaStreamStart();
  }

  function onMouseOverButton(e) {
    e.target.classList.add('button--hover');
  }

  function onMouseOutButton(e) {
    e.target.classList.remove('button--hover');
  }

  function onPointerMove(e) {
    e.preventDefault();

    if (animating) {
      if (!e.touches) {
        pointerX = e.pageX;
        pointerY = e.pageY;
      } else {
        pointerX = e.touches[0].pageX;
        pointerY = e.touches[0].pageY;
      }
    }
  }

  if (navigator.getUserMedia) {
    zoneButton.classList.remove('button--hidden');
    zoneButton.addEventListener('click', onClickZoneButton);
    zoneButton.addEventListener('touchstart', onMouseOverButton);
    zoneButton.addEventListener('touchend', onMouseOutButton);
    zoneButton.addEventListener('mousedown', onMouseOverButton);
    zoneButton.addEventListener('mouseleave', onMouseOutButton);
    zoneButton.addEventListener('mouseover', onMouseOverButton);
    zoneButton.addEventListener('mouseup', onMouseOutButton);
  }

  bgButton.addEventListener('click', onClickBgButton);
  bgButton.addEventListener('touchstart', onMouseOverButton);
  bgButton.addEventListener('touchend', onMouseOutButton);
  bgButton.addEventListener('mousedown', onMouseOverButton);
  bgButton.addEventListener('mouseleave', onMouseOutButton);
  bgButton.addEventListener('mouseover', onMouseOverButton);
  bgButton.addEventListener('mouseup', onMouseOutButton);

  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('touchmove', onPointerMove);
  window.addEventListener('resize', updateBounds);

  getBackground();
  updateBounds();
  animate();
})(this);
