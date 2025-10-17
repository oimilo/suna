import type { Project, Thread, AgentRun, Message } from '@/lib/api'
import {
  getThreads,
  getThread,
  getMessages,
  addUserMessage,
  getAgentRuns,
  startAgent,
  stopAgent,
  createThread,
  getProject,
  updateProject,
} from '@/lib/api'

export const sunaThreads = {
  getThreads: (projectId?: string) => getThreads(projectId) as Promise<Thread[]>,
  getThread: (threadId: string) => getThread(threadId) as Promise<Thread>,
  getMessages: (threadId: string) => getMessages(threadId) as Promise<Message[]>,
  addUserMessage: (threadId: string, content: string) => addUserMessage(threadId, content),
  getAgentRuns: (threadId: string) => getAgentRuns(threadId) as Promise<AgentRun[]>,
  startAgent,
  stopAgent,
  createThread: (projectId: string) => createThread(projectId) as Promise<Thread>,
  getProject: (projectId: string) => getProject(projectId) as Promise<Project>,
  updateProject,
}

