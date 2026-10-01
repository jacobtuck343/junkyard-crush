const percentile = (sorted, fraction) => sorted.length ? sorted[Math.ceil(sorted.length * fraction) - 1] : 0;

// Bounded samples, independent from the renderer and browser so measurements can be tested.
export class PerformanceMonitor {
  constructor(heapStart = null) {
    this.frames = 0;
    this.seconds = 0;
    this.worstFrameMs = 0;
    this.slowFrames = 0;
    this.renderCalls = 0;
    this.triangles = 0;
    this.heapStart = heapStart;
    this.samples = [];
    this.frameTimes = [];
    this.renderCpuTimes = [];
    this.sampleClock = 0;
  }

  record(seconds, {cpuMs = 0, calls = 0, triangles = 0, heap = null, state = 'waiting'} = {}) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    const ms = seconds * 1000;
    this.frames++;
    this.seconds += seconds;
    this.worstFrameMs = Math.max(this.worstFrameMs, ms);
    if (seconds > 1 / 30) this.slowFrames++;
    this.renderCalls = calls;
    this.triangles = triangles;
    this.frameTimes.push(ms);
    this.renderCpuTimes.push(Math.max(0, cpuMs));
    if (this.frameTimes.length > 600) {
      this.frameTimes.shift();
      this.renderCpuTimes.shift();
    }
    this.sampleClock += seconds;
    if (this.sampleClock >= 1) {
      this.sampleClock %= 1;
      this.samples.push({at: Math.round(this.seconds), heap, calls, state, ...this.summary()});
      if (this.samples.length > 660) this.samples.shift();
    }
  }

  summary() {
    const frames = [...this.frameTimes].sort((a, b) => a - b);
    const cpu = [...this.renderCpuTimes].sort((a, b) => a - b);
    const round = value => Math.round(value * 100) / 100;
    return {
      averageFps: round(this.seconds > 0 ? this.frames / this.seconds : 0),
      frameP50Ms: round(percentile(frames, .5)),
      frameP95Ms: round(percentile(frames, .95)),
      frameP99Ms: round(percentile(frames, .99)),
      sceneCpuP95Ms: round(percentile(cpu, .95)),
      framesOver33msPercent: round(this.frames > 0 ? this.slowFrames / this.frames * 100 : 0),
      windowFrames: frames.length
    };
  }
}
