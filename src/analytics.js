import { CONFIG } from './config.js?v=0.9.0';
export class Analytics {
  constructor(sink = () => {}) { this.sink = sink; this.events = []; this.time = 0; this.sessionId = globalThis.crypto?.randomUUID?.() ?? String(Date.now()); this.milestones = new Set(); }
  emit(name, data = {}) {
    const event = { name, ...CONFIG_META, sessionId: this.sessionId, sessionTime: +this.time.toFixed(3), platform: 'browser', deviceClass: globalThis.matchMedia?.('(pointer: coarse)').matches ? 'touch' : 'desktop', yardId: this.yardId??'rustbucket', ...data };
    this.events.push(event); if (this.events.length > 500) this.events.shift(); this.sink(event); return event;
  }
  tick(dt) { this.time += dt; for (const m of [1,3,5]) if (this.time >= m*60 && !this.milestones.has(m)) { this.milestones.add(m); this.emit('minute_'+m+'_reached'); } }
}
const CONFIG_META = { gameVersion: CONFIG.gameVersion, economyVersion: CONFIG.economyVersion, onboardingVersion: CONFIG.onboardingVersion };
