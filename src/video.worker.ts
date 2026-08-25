import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

@Processor('video', {concurrency: 2 })
export class VideoProcessor extends WorkerHost {
    
    async process(job: Job) {
        job.name
        const totalSteps = 5;

        switch (job.name) {
            case 'compress':
                console.log('Starting compress task.');
                await this.runTaskWithProgress(job, totalSteps);

                break;
            case 'process':
                console.log('Starting process tasks');
                await this.runTaskWithProgress(job, totalSteps);
                break;
            default:
                console.log(`Unknown Job name: ${job.name}`);
                break;
        }
    }
        async runTaskWithProgress(job: Job, totalSteps: number) {

        for (let step = 1; step <= totalSteps; step++) {
            // Simulate work for each step with a timeout
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Calculate progress as percentage
            const progress = Math.round((step / totalSteps) * 100);

            // Update Job progress
            await job.updateProgress(progress);
        }
    }

    @OnWorkerEvent('progress')
    onProgress(job: Job) {
        console.log(`Job with id ${job.id}, ${job.progress}% completed`);
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