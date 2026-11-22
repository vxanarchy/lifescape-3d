import { z } from 'zod';
import type { GameState, Job, Task, PlayerStats } from '@/types';

// Job schema validation
export const JobSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  location: z.string(),
  requirements: z.record(z.string(), z.number()).default({}),
  salary: z.number().min(1),
  tasks: z.array(z.object({
    id: z.string(),
    description: z.string(),
    reward: z.number().min(0),
    completed: z.boolean().default(false),
  })).default([])),
});

export type ValidatedJob = z.infer<typeof JobSchema>;

export interface JobOffer {
  id: string;
  job: ValidatedJob;
  available: boolean;
  applicantSuitability: number; // 0-100
}

export class JobSystem {
  private availableJobs: ValidatedJob[] = [];
  private playerJobs: Map<string, ValidatedJob> = new Map(); // player's current/held jobs
  private completedTasks: Map<string, boolean> = new Map();
  private jobHistory: ValidatedJob[] = [];

  constructor(initialJobs: ValidatedJob[] = []) {
    this.availableJobs = initialJobs.map(job => JobSchema.parse(job));
  }

  public getAvailableJobs(): ValidatedJob[] {
    return [...this.availableJobs];
  }

  public getPlayerJobs(): ValidatedJob[] {
    return [...this.playerJobs.values()];
  }

  public hireForJob(jobId: string, playerStats: PlayerStats): { success: boolean; message: string; job?: ValidatedJob } {
    const job = this.availableJobs.find(j => j.id === jobId);
    if (!job) {
      return { success: false, message: 'Job not found' };
    }

    // Check requirements
    const requirementCheck = this.checkRequirements(job, playerStats);
    if (!requirementCheck.meetsRequirements) {
      return {
        success: false,
        message: requirementCheck.missingRequirements,
      };
    }

    // Hire - move job from available to player
    this.availableJobs = this.availableJobs.filter(j => j.id !== jobId);
    this.playerJobs.set(jobId, job);

    console.log(`[Jobs] Hired for: ${job.name} - $${job.salary}/day`);

    return {
      success: true,
      message: `Hired as: ${job.name}`,
      job,
    };
  }

  public resignFromJob(jobId: string): { success: boolean; message: string; refund?: number } {
    const job = this.playerJobs.get(jobId);
    if (!job) {
      return { success: false, message: 'You are not employed in this job' };
    }

    // Calculate refund (50% of salary for quitting)
    const refund = Math.floor(job.salary * 0.5);
    this.playerJobs.delete(jobId);

    // Return to available pool
    this.availableJobs.push(job);

    console.log(`[Jobs] Resigned from: ${job.name}, refund: $${refund}`);

    return {
      success: true,
      message: `Resigned from ${job.name}`,
      refund,
    };
  }

  public completeTask(jobId: string, taskId: string): { success: boolean; message: string; reward?: number } {
    const job = this.playerJobs.get(jobId);
    if (!job) {
      return { success: false, message: 'Job not found' };
    }

    const task = job.tasks.find(t => t.id === taskId);
    if (!task) {
      return { success: false, message: 'Task not found in this job' };
    }

    if (task.completed) {
      return { success: false, message: 'Task already completed' };
    }

    task.completed = true;
    this.completedTasks.set(taskId, true);

    // Give reward
    const reward = task.reward;
    // Note: Economy system handles the actual money transfer

    console.log(`[Jobs] Completed task: ${task.description} - reward: $${reward}`);

    return {
      success: true,
      message: `Task completed: ${task.description}`,
      reward,
    };
  }

  public progressJob(jobId: string): { progress: number; message: string; nextTask?: ValidatedJob['tasks'][0] } {
    const job = this.playerJobs.get(jobId);
    if (!job) {
      return { progress: 0, message: 'Job not found' };
    }

    const completedTasks = job.tasks.filter(t => t.completed).length;
    const progress = Math.round((completedTasks / job.tasks.length) * 100);

    if (progress >= 100) {
      return {
        progress,
        message: `Job completed! ${job.name} - eligible for promotion`,
      };
    }

    const incompleteTasks = job.tasks.filter(t => !t.completed);
    const nextTask = incompleteTasks[0];

    return {
      progress,
      message: `${progress}% complete - Next: ${nextTask?.description || 'Check in'}`,
      nextTask,
    };
  }

  public fireEmployee(jobId: string): { success: boolean; message: string; penalty: number } {
    // Firing means losing the job and a small penalty (reputation/skills loss)
    const job = this.playerJobs.get(jobId);
    if (!job) {
      return { success: false, message: 'Employee not found', penalty: 0 };
    }

    this.playerJobs.delete(jobId);
    this.availableJobs.push(job);

    const penalty = Math.floor(job.salary * 0.1); // 10% salary penalty
    console.log(`[Jobs] Fired from: ${job.name}, penalty: $${penalty}`);

    return {
      success: true,
      message: `Fired from ${job.name}`,
      penalty,
    };
  }

  public getJobStats(): {
    totalJobs: number;
    playerJobCount: number;
    availableCount: number;
    totalPotentialEarnings: number;
  } {
    const totalPotential = this.availableJobs
      .reduce((sum, job) => sum + job.salary, 0) +
      this.playerJobs
        .reduce((sum, job) => sum + job.salary, 0);

    return {
      totalJobs: this.availableJobs.length + this.playerJobs.size,
      playerJobCount: this.playerJobs.size,
      availableCount: this.availableJobs.length,
      totalPotentialEarnings: totalPotential,
    };
  }

  public saveState(): {
    availableJobs: ValidatedJob[];
    playerJobs: Record<string, ValidatedJob>;
    jobHistory: ValidatedJob[];
    completedTasks: Record<string, boolean>;
  } {
    return {
      availableJobs: this.availableJobs.map(JobSchema.parse),
      playerJobs: Object.fromEntries(this.playerJobs.entries()),
      jobHistory: this.jobHistory,
      completedTasks: Object.fromEntries(this.completedTasks.entries()),
    };
  }

  public loadState(state: {
    availableJobs: ValidatedJob[];
    playerJobs: Record<string, ValidatedJob>;
    jobHistory: ValidatedJob[];
    completedTasks: Record<string, boolean>;
  }): void {
    this.availableJobs = state.availableJobs.map(job => JobSchema.parse(job));
    this.playerJobs = new Map(Object.entries(state.playerJobs));
    this.jobHistory = state.jobHistory;
    this.completedTasks = new Map(Object.entries(state.completedTasks));
  }

  private checkRequirements(job: ValidatedJob, playerStats: PlayerStats): { meetsRequirements: boolean; missingRequirements: string } {
    const requirements = job.requirements;
    const missing: string[] = [];

    // Check if player has required stats
    if (requirements.money !== undefined && playerStats.money < requirements.money) {
      missing.push(`Minimum $${requirements.money} required`);
    }

    if (requirements.experience !== undefined && playerStats.experience < requirements.experience) {
      missing.push(`Minimum ${requirements.experience} experience required`);
    }

    if (requirements.skills) {
      for (const [skill, level] of Object.entries(requirements.skills)) {
        if ((playerStats.skills || {})[skill] < level) {
          missing.push(`${skill}: need level ${level}`);
        }
      }
    }

    return {
      meetsRequirements: missing.length === 0,
      missingRequirements: missing.length > 0 ? missing.join(', ') : 'All requirements met',
    };
  }
}