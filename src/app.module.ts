import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { VideoProcessor } from './video.worker';

@Module({
  imports: [
    BullModule.forRoot({
      connection: { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 1000,
        removeOnFail: 3000,
        backoff: 2000,
        
      },
    }),
    BullModule.registerQueue({ name: 'video' }),
  ],
  controllers: [VideoController],
  providers: [VideoProcessor],
})
export class AppModule { }
