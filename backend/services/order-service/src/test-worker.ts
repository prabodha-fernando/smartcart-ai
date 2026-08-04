import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';

if (!isMainThread) {
  parentPort?.postMessage("Hello from worker " + workerData);
} else {
  const worker = new Worker(fileURLToPath(import.meta.url), { workerData: 123 });
  worker.on('message', console.log);
}
