const hamburgerHandler = async (e) => {
  e.preventDefault();

  let body = document.getElementById('body')
  let slider = document.getElementById('m-nav-opened');
  let isOpen = slider.classList.contains('slide-in');

  if(isOpen) {
    body.setAttribute('style', 'overflow: auto');
    slider.setAttribute('class', 'slide-out');
  } else if(e.target .id != 'm-nav-name' && e.target .id != 'm-nav-title') {
    body.setAttribute('style', 'overflow: hidden');
    slider.setAttribute('style','display: block');
    slider.setAttribute('class', 'slide-in');
  }
}

export default hamburgerHandler;

