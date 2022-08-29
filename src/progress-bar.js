let p_bar = document.getElementById('progress-bar');
let progress = document.getElementById('progress');
let p_label = document.getElementById('label');
p_bar.hidden = true;
p_label.hidden = true;
progress.hidden = true;
window.myApi.handleProgress((event, _progress, _max,callback) => {
  p_bar.hidden = false;
  p_label.hidden = false;
  progress.hidden = false;
  progress.max = _max - 1;
  progress.value = _progress;
  p_label.innerHTML = callback;
})