import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

@Processor('video', {limiter: {duration: 10000, max: 20} })
export class VideoProcessor extends WorkerHost {
    async process(job: Job) {
        const totalSteps = 5;

        for (let step = 1; step <= totalSteps; step++){
            
        }
        
        await new Promise((resolve) => setTimeout(resolve, 3000));
        throw Error('File Corrupted');
    }

    @OnWorkerEvent('active')
    onAdded(job: Job) {
        console.log(`Got a new job with id ${job.id}`);
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        console.log(`Job with id ${job.id} COMPLETED!`);
    }
    
    @OnWorkerEvent('failed')
    onFailed(job: Job) {
        console.log(`Job with id ${job.id} FAILED`);
        console.log(`Attempt Number ${job.attemptsMade}`);
    }
}