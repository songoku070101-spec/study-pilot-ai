class PomodoroTimer {
  constructor(displayElementId, ringElementId) {
    this.displayElement = document.getElementById(displayElementId);
    this.ringElement = document.getElementById(ringElementId);
    this.totalTime = 25 * 60; // 25 minutes in seconds
    this.timeLeft = this.totalTime;
    this.timerId = null;
    this.isRunning = false;
    this.updateDisplay();
  }

  start(onTick, onComplete) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.timerId = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      
      if (onTick) onTick(this.timeLeft);

      if (this.timeLeft <= 0) {
        this.pause();
        this.reset();
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.timerId);
  }

  reset() {
    this.pause();
    this.timeLeft = this.totalTime;
    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.displayElement) return;
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    this.displayElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update SVG Ring
    if (this.ringElement) {
        const circumference = 2 * Math.PI * 54; // r=54 in CSS
        const progress = this.timeLeft / this.totalTime;
        const offset = circumference - (progress * circumference);
        this.ringElement.style.strokeDashoffset = offset;
    }
  }
}
