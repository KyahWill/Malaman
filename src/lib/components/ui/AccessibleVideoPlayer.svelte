<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { accessibilityPreferences, screenReader } from '$lib/services/accessibility';
  import { Button } from '$lib/components/ui';
  
  export let src: string;
  export let poster: string = '';
  export let title: string = '';
  export let description: string = '';
  export let captions: { src: string; label: string; language: string }[] = [];
  export let audioDescription: string = '';
  export let autoplay: boolean = false;
  export let controls: boolean = true;
  export let muted: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let videoElement: HTMLVideoElement;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let volume = 1;
  let isMuted = muted;
  let isFullscreen = false;
  let showCaptions = false;
  let selectedCaptionTrack = 0;
  let playbackRate = 1;
  let buffered = 0;
  
  let preferences: any;
  accessibilityPreferences.subscribe(prefs => {
    preferences = prefs;
    showCaptions = prefs.captionsEnabled && captions.length > 0;
  });
  
  onMount(() => {
    if (videoElement) {
      // Set up event listeners
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
      videoElement.addEventListener('volumechange', handleVolumeChange);
      videoElement.addEventListener('progress', handleProgress);
      
      // Set up caption tracks
      setupCaptionTracks();
      
      // Announce video loaded
      if (screenReader && title) {
        screenReader.announce(`Video loaded: ${title}`);
      }
    }
    
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('volumechange', handleVolumeChange);
        videoElement.removeEventListener('progress', handleProgress);
      }
    };
  });
  
  function setupCaptionTracks() {
    if (!videoElement || captions.length === 0) return;
    
    captions.forEach((caption, index) => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.src = caption.src;
      track.srclang = caption.language;
      track.label = caption.label;
      track.default = index === 0;
      videoElement.appendChild(track);
    });
  }
  
  function handleLoadedMetadata() {
    duration = videoElement.duration;
    dispatch('loadedmetadata', { duration });
  }
  
  function handleTimeUpdate() {
    currentTime = videoElement.currentTime;
    dispatch('timeupdate', { currentTime, duration });
  }
  
  function handlePlay() {
    isPlaying = true;
    if (screenReader) {
      screenReader.announce('Video playing');
    }
    dispatch('play');
  }
  
  function handlePause() {
    isPlaying = false;
    if (screenReader) {
      screenReader.announce('Video paused');
    }
    dispatch('pause');
  }
  
  function handleEnded() {
    isPlaying = false;
    if (screenReader) {
      screenReader.announce('Video ended');
    }
    dispatch('ended');
  }
  
  function handleVolumeChange() {
    volume = videoElement.volume;
    isMuted = videoElement.muted;
  }
  
  function handleProgress() {
    if (videoElement.buffered.length > 0) {
      buffered = videoElement.buffered.end(0) / duration * 100;
    }
  }
  
  function togglePlay() {
    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  }
  
  function seek(time: number) {
    videoElement.currentTime = time;
    if (screenReader) {
      screenReader.announce(`Seeked to ${formatTime(time)}`);
    }
  }
  
  function changeVolume(newVolume: number) {
    videoElement.volume = Math.max(0, Math.min(1, newVolume));
    if (screenReader) {
      screenReader.announce(`Volume ${Math.round(newVolume * 100)}%`);
    }
  }
  
  function toggleMute() {
    videoElement.muted = !videoElement.muted;
    if (screenReader) {
      screenReader.announce(videoElement.muted ? 'Muted' : 'Unmuted');
    }
  }
  
  function toggleCaptions() {
    showCaptions = !showCaptions;
    const tracks = videoElement.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = showCaptions ? 'showing' : 'hidden';
    }
    if (screenReader) {
      screenReader.announce(showCaptions ? 'Captions enabled' : 'Captions disabled');
    }
  }
  
  function changePlaybackRate(rate: number) {
    videoElement.playbackRate = rate;
    playbackRate = rate;
    if (screenReader) {
      screenReader.announce(`Playback speed ${rate}x`);
    }
  }
  
  function toggleFullscreen() {
    if (!isFullscreen) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    isFullscreen = !isFullscreen;
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case ' ':
      case 'k':
        event.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        seek(Math.max(0, currentTime - 10));
        break;
      case 'ArrowRight':
        event.preventDefault();
        seek(Math.min(duration, currentTime + 10));
        break;
      case 'ArrowUp':
        event.preventDefault();
        changeVolume(volume + 0.1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        changeVolume(volume - 0.1);
        break;
      case 'm':
        event.preventDefault();
        toggleMute();
        break;
      case 'c':
        if (captions.length > 0) {
          event.preventDefault();
          toggleCaptions();
        }
        break;
      case 'f':
        event.preventDefault();
        toggleFullscreen();
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault();
        const percentage = parseInt(event.key) * 10;
        seek((percentage / 100) * duration);
        break;
    }
  }
</script>

<div 
  class="video-player"
  class:high-contrast={preferences?.highContrast}
  class:reduced-motion={preferences?.reducedMotion}
  role="region"
  aria-label="Video player"
  on:keydown={handleKeyDown}
  tabindex="0"
>
  {#if title}
    <h3 class="video-title" id="video-title">{title}</h3>
  {/if}
  
  {#if description}
    <p class="video-description" id="video-description">{description}</p>
  {/if}
  
  <div class="video-container">
    <video
      bind:this={videoElement}
      {src}
      {poster}
      {autoplay}
      {muted}
      controls={false}
      class="video-element"
      aria-labelledby={title ? 'video-title' : undefined}
      aria-describedby={description ? 'video-description' : undefined}
      preload="metadata"
    >
      {#if audioDescription}
        <track kind="descriptions" src={audioDescription} srclang="en" label="Audio descriptions" />
      {/if}
      
      <p class="video-fallback">
        Your browser doesn't support HTML5 video. 
        <a href={src} download>Download the video file</a>.
      </p>
    </video>
    
    {#if controls}
      <div class="video-controls" role="toolbar" aria-label="Video controls">
        <!-- Progress bar -->
        <div class="progress-container">
          <div class="progress-buffer" style="width: {buffered}%"></div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            bind:value={currentTime}
            on:input={(e) => seek(parseFloat(e.currentTarget.value))}
            class="progress-bar"
            aria-label="Video progress"
            aria-valuetext="{formatTime(currentTime)} of {formatTime(duration)}"
          />
        </div>
        
        <!-- Control buttons -->
        <div class="control-buttons">
          <Button
            variant="ghost"
            size="sm"
            on:click={togglePlay}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            class="control-button"
          >
            {#if isPlaying}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            {:else}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            {/if}
          </Button>
          
          <!-- Volume controls -->
          <div class="volume-controls">
            <Button
              variant="ghost"
              size="sm"
              on:click={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              class="control-button"
            >
              {#if isMuted || volume === 0}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              {/if}
            </Button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              bind:value={volume}
              on:input={(e) => changeVolume(parseFloat(e.currentTarget.value))}
              class="volume-slider"
              aria-label="Volume"
              aria-valuetext="{Math.round(volume * 100)}%"
            />
          </div>
          
          <!-- Time display -->
          <div class="time-display" aria-live="polite">
            <span class="sr-only">Current time: </span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          <!-- Playback speed -->
          <select
            bind:value={playbackRate}
            on:change={(e) => changePlaybackRate(parseFloat(e.currentTarget.value))}
            class="playback-speed"
            aria-label="Playback speed"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
          
          <!-- Captions toggle -->
          {#if captions.length > 0}
            <Button
              variant="ghost"
              size="sm"
              on:click={toggleCaptions}
              aria-label={showCaptions ? 'Hide captions' : 'Show captions'}
              aria-pressed={showCaptions}
              class="control-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
                <path d="M6 11h4"/>
                <path d="M14 11h4"/>
              </svg>
            </Button>
          {/if}
          
          <!-- Fullscreen toggle -->
          <Button
            variant="ghost"
            size="sm"
            on:click={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            class="control-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              {#if isFullscreen}
                <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
                <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
                <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
              {:else}
                <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
                <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
              {/if}
            </svg>
          </Button>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Keyboard shortcuts help -->
  <details class="keyboard-shortcuts">
    <summary>Keyboard Shortcuts</summary>
    <dl class="shortcuts-list">
      <dt>Space or K</dt><dd>Play/Pause</dd>
      <dt>Left Arrow</dt><dd>Rewind 10 seconds</dd>
      <dt>Right Arrow</dt><dd>Forward 10 seconds</dd>
      <dt>Up Arrow</dt><dd>Volume up</dd>
      <dt>Down Arrow</dt><dd>Volume down</dd>
      <dt>M</dt><dd>Mute/Unmute</dd>
      <dt>C</dt><dd>Toggle captions</dd>
      <dt>F</dt><dd>Toggle fullscreen</dd>
      <dt>0-9</dt><dd>Jump to 0%-90% of video</dd>
    </dl>
  </details>
</div>

<style>
  .video-player {
    width: 100%;
    max-width: 100%;
    background: #000;
    border-radius: 0.5rem;
    overflow: hidden;
    position: relative;
  }
  
  .video-player:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .video-title {
    padding: 1rem 1rem 0.5rem;
    margin: 0;
    color: white;
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .video-description {
    padding: 0 1rem 1rem;
    margin: 0;
    color: #d1d5db;
    font-size: 0.875rem;
    line-height: 1.4;
  }
  
  .video-container {
    position: relative;
    width: 100%;
  }
  
  .video-element {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .video-fallback {
    padding: 2rem;
    text-align: center;
    color: white;
  }
  
  .video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .progress-container {
    position: relative;
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
  
  .progress-buffer {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  
  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  
  .progress-bar::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    opacity: 1;
  }
  
  .progress-bar:focus {
    opacity: 1;
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .control-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .control-button {
    color: white;
    padding: 0.5rem;
    min-width: 2rem;
    height: 2rem;
  }
  
  .control-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .control-button:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .volume-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .volume-slider {
    width: 80px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }
  
  .volume-slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
  }
  
  .volume-slider:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .time-display {
    color: white;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
    min-width: 100px;
  }
  
  .playback-speed {
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
  
  .playback-speed:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .keyboard-shortcuts {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.05);
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .keyboard-shortcuts summary {
    cursor: pointer;
    font-weight: 500;
    color: #374151;
  }
  
  .keyboard-shortcuts summary:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  .shortcuts-list {
    margin-top: 0.5rem;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 1rem;
    font-size: 0.875rem;
  }
  
  .shortcuts-list dt {
    font-weight: 500;
    color: #374151;
  }
  
  .shortcuts-list dd {
    margin: 0;
    color: #6b7280;
  }
  
  /* High contrast mode */
  .high-contrast .video-controls {
    background: black;
    border-top: 2px solid white;
  }
  
  .high-contrast .control-button {
    border: 1px solid white;
  }
  
  .high-contrast .time-display {
    color: white;
    background: black;
    padding: 0.25rem;
  }
  
  /* Reduced motion */
  .reduced-motion .progress-buffer {
    transition: none;
  }
  
  /* Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  /* Focus management for keyboard users */
  .video-player:focus-within .video-controls {
    opacity: 1;
  }
  
  @media (max-width: 640px) {
    .control-buttons {
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    
    .volume-controls {
      order: 1;
      width: 100%;
      justify-content: center;
    }
    
    .volume-slider {
      flex: 1;
      max-width: 200px;
    }
  }
</style>