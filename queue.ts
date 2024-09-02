import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Create IORedis instance with appropriate configuration
const connection = new IORedis('rediss://default:AVNS_bJkmPewFnK3S4WakDXT@redis-2d7f8e52-mohitsoni004488-1af9.a.aivencloud.com:22910', {
  maxRetriesPerRequest: null
});

// Reuse the ioredis instance
const myQueue = new Queue('myqueue', { connection });
const myWorker = new Worker('myqueue', async (job) => {
  // Your worker logic goes here
}, { connection });

myWorker.on('completed', (job) => {
    console.log(job.id)
  });



async function addJob() {
  await myQueue.add('paint', { color: 'red' });
}

// Call the async function to add a job
// addJob();
