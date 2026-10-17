(function () {
  'use strict';
  const reels = window.CMP_REELS;
  const video = document.getElementById('experiment-video');
  const title = document.getElementById('current-task');
  const ended = document.getElementById('ended-label');
  const error = document.getElementById('video-error');
  const navigation = document.getElementById('chapter-nav');
  const switches = Array.from(document.querySelectorAll('[data-stage]'));
  if (!reels || !video) return;
  let stage = 'early', generation = 0, switching = false, pending = null;
  let metadataListener = null;

  function chapterIndex(time, selectedStage) {
    const chapters = reels.stages[selectedStage].chapters;
    const found = chapters.findIndex(chapter => time < chapter.end - 1e-7);
    return found < 0 ? chapters.length - 1 : found;
  }
  function render() {
    const time = switching && pending ? pending.time : video.currentTime;
    const index = chapterIndex(time, stage);
    const chapter = reels.stages[stage].chapters[index];
    title.textContent = chapter.title;
    Array.from(navigation.children).forEach((button, i) =>
      button.setAttribute('aria-current', String(i === index)));
    const relative = time - chapter.start;
    ended.hidden = !(chapter.amp_frames < chapter.frames &&
      relative >= chapter.amp_duration && relative < chapter.duration);
    switches.forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.stage === stage)));
  }
  function position() {
    if (switching && pending) return { ...pending };
    const time = Math.max(0, video.currentTime || 0);
    const index = chapterIndex(time, stage);
    const chapter = reels.stages[stage].chapters[index];
    return { index, fraction: Math.max(0, Math.min(1,
      (time - chapter.start) / chapter.duration)), time, playing: !video.paused && !video.ended };
  }
  function showError() {
    error.textContent = 'Video unavailable. Keep the complete static/videos folder beside index.html.';
    error.hidden = false;
  }
  function seekTask(index) {
    if (!Number.isInteger(index) || index < 0 || index >= reels.stages[stage].chapters.length)
      throw new RangeError('Unknown task index.');
    const target = reels.stages[stage].chapters[index].start;
    if (switching && pending) {
      pending.index = index; pending.fraction = 0; pending.time = target;
    } else video.currentTime = target;
    render();
  }
  function selectStage(next) {
    if (!Object.hasOwn(reels.stages, next)) throw new RangeError('Unknown checkpoint.');
    if (next === stage) return;
    const old = position();
    const chapter = reels.stages[next].chapters[old.index];
    const token = ++generation;
    stage = next; switching = true;
    pending = { index: old.index, fraction: old.fraction, playing: old.playing,
      time: chapter.start + Math.min(old.fraction * chapter.duration,
        Math.max(0, chapter.duration - 1 / reels.fps)) };
    video.pause();
    error.hidden = true;
    if (metadataListener) video.removeEventListener('loadedmetadata', metadataListener);
    metadataListener = function () {
      if (token !== generation) return;
      const target = pending;
      video.currentTime = target.time;
      switching = false; pending = null; metadataListener = null;
      render();
      if (target.playing) video.play().catch(() => {});
    };
    video.addEventListener('loadedmetadata', metadataListener, { once: true });
    video.src = reels.stages[stage].file;
    video.poster = reels.stages[stage].poster;
    video.load();
    render();
  }
  for (const [index, chapter] of reels.stages.early.chapters.entries()) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'chapter-button';
    button.textContent = chapter.title;
    button.addEventListener('click', () => seekTask(index));
    navigation.appendChild(button);
  }
  switches.forEach(button => button.addEventListener('click', () => selectStage(button.dataset.stage)));
  ['timeupdate', 'seeking', 'seeked', 'ended', 'loadedmetadata'].forEach(event =>
    video.addEventListener(event, render));
  video.addEventListener('error', showError);
  render();
  window.CMPExperimentPlayer = Object.freeze({
    selectStage, seekTask,
    getState: () => ({ stage, task: chapterIndex(switching && pending ? pending.time : video.currentTime, stage),
      time: switching && pending ? pending.time : video.currentTime, paused: video.paused, switching })
  });
})();
