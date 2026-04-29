import { TaskPriority, TaskStatus } from './create-task.dto';

export class UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string; // YYYY-MM-DD, pass null to clear
}
