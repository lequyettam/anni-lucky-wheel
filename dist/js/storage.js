import {createSeed, clone, RuleError} from './domain.js';
/** Demo adapter only. localStorage is not authentication, a shared DB or a production authority. */
export class LocalRepository {
  constructor(key = 'anni-wheel-demo-v1', storage = localStorage) {
    this.key = key; this.storage = storage; this.queue = Promise.resolve();
    if (!storage.getItem(key)) this.write(createSeed());
  }
  read() {
    try { const value = JSON.parse(this.storage.getItem(this.key)); if (value?.version !== 1) throw new Error(); return value; }
    catch { throw new RuleError('Không đọc được dữ liệu ứng dụng. Vui lòng liên hệ quản trị viên để kiểm tra.'); }
  }
  write(state) { try { this.storage.setItem(this.key, JSON.stringify(state)); } catch { throw new RuleError('Trình duyệt không lưu được dữ liệu. Hãy giảm dung lượng ảnh hoặc cho phép lưu trữ.'); } }
  transaction(fn) {
    const execute = async () => { const state = this.read(); const result = await fn(state); this.write(state); return clone(result); };
    const run = () => globalThis.navigator?.locks ? navigator.locks.request(this.key, execute) : execute();
    const job = this.queue.then(run); this.queue = job.catch(() => {}); return job;
  }
  reset() { return this.transaction(state => {Object.assign(state, createSeed()); return true;}); }
}
