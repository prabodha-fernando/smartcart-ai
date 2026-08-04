import { Router } from "express";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { fileURLToPath } from "node:url";

const router = Router();

// -----------------------------------------------------------------------------
// WORKER THREAD LOGIC (Executes when !isMainThread)
// -----------------------------------------------------------------------------
if (!isMainThread) {
  const { mode } = workerData;

  if (mode === "sync") {
    // 1. Synchronous Thread execution:
    // "The thread executes tasks sequentially. It will completely block execution 
    // and wait for a task to finish before moving to the next line of code."
    
    // Simulating a heavy, synchronous, CPU-blocking task (e.g., massive loop)
    let sum = 0;
    for (let i = 0; i < 2_000_000_000; i++) {
      sum += i;
    }
    
    // Returns immediately once the synchronous loop finishes
    parentPort?.postMessage({
      status: "success",
      type: "Synchronous",
      message: "The synchronous thread completely blocked execution until it finished calculating.",
      result: sum
    });
  } 
  
  else if (mode === "async") {
    // 2. Asynchronous Thread execution:
    // "The thread initiates a time-consuming task and immediately moves on...
    // When the background task finishes, the thread handles the result using an event loop or callback."
    
    // In Node.js, we simulate this by firing off an asynchronous task that returns a Promise.
    // We do NOT block the thread with a heavy loop. Instead, we use `setTimeout` 
    // (or an API fetch / DB query in a real app) which yields control back to the event loop.
    
    const timeConsumingTask = new Promise((resolve) => {
      setTimeout(() => {
        resolve("Async operation finished! (e.g. Database query completed)");
      }, 3000); // 3 second delay
    });

    // The thread "immediately moves on" to this line, non-blocking:
    console.log("Async thread initiated the task and moved on to other operations immediately.");

    // When the background task finishes (after 3 seconds), the promise resolves:
    timeConsumingTask.then((result) => {
      parentPort?.postMessage({
        status: "success",
        type: "Asynchronous",
        message: "The thread did not block. It yielded to the event loop and returned this callback 3 seconds later.",
        result: result
      });
    });
  }
}

// -----------------------------------------------------------------------------
// MAIN THREAD LOGIC (Express Routes)
// Both routes use Promises to ensure they are non-blocking for the main Express server!
// -----------------------------------------------------------------------------

router.get("/sync", async (_req, res) => {
  try {
    // We wrap the worker initialization in a Promise in the backend
    const result = await new Promise((resolve, reject) => {
      const worker = new Worker(fileURLToPath(import.meta.url), {
        workerData: { mode: "sync" }
      });
      worker.on("message", resolve);
      worker.on("error", reject);
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/async", async (_req, res) => {
  try {
    // We wrap the worker initialization in a Promise in the backend
    const result = await new Promise((resolve, reject) => {
      const worker = new Worker(fileURLToPath(import.meta.url), {
        workerData: { mode: "async" }
      });
      worker.on("message", resolve);
      worker.on("error", reject);
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
