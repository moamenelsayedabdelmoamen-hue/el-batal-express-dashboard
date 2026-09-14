import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface CreateCommentData {
  comment_insert: Comment_Key;
}

export interface CreateMembershipData {
  membership_insert: Membership_Key;
}

export interface CreateProjectData {
  project_insert: Project_Key;
}

export interface CreateTaskData {
  task_insert: Task_Key;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface DeleteCommentData {
  comment_delete?: Comment_Key | null;
}

export interface DeleteMembershipData {
  membership_delete?: Membership_Key | null;
}

export interface DeleteProjectData {
  project_delete?: Project_Key | null;
}

export interface DeleteTaskData {
  task_delete?: Task_Key | null;
}

export interface DeleteUserData {
  user_delete?: User_Key | null;
}

export interface GetCommentData {
  comment?: {
    content: string;
    author: {
      username: string;
    };
  };
}

export interface GetMembershipData {
  membership?: {
    role: string;
  };
}

export interface GetProjectData {
  project?: {
    title: string;
    owner: {
      username: string;
    };
  };
}

export interface GetTaskData {
  task?: {
    title: string;
    status: string;
  };
}

export interface GetUserData {
  user?: {
    email: string;
    username: string;
  };
}

export interface ListCommentsData {
  comments: ({
    content: string;
  })[];
}

export interface ListMembershipsData {
  memberships: ({
    project: {
      title: string;
    };
  })[];
}

export interface ListProjectsData {
  projects: ({
    title: string;
  })[];
}

export interface ListTasksData {
  tasks: ({
    title: string;
  })[];
}

export interface ListUsersData {
  users: ({
    username: string;
    bio?: string | null;
  })[];
}

export interface Membership_Key {
  userId: UUIDString;
  projectId: UUIDString;
  __typename?: 'Membership_Key';
}

export interface Project_Key {
  id: UUIDString;
  __typename?: 'Project_Key';
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface UpdateCommentData {
  comment_update?: Comment_Key | null;
}

export interface UpdateMembershipData {
  membership_update?: Membership_Key | null;
}

export interface UpdateProjectData {
  project_update?: Project_Key | null;
}

export interface UpdateTaskData {
  task_update?: Task_Key | null;
}

export interface UpdateUserData {
  user_update?: User_Key | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface UpdateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateUserData, undefined>;
  operationName: string;
}
export const updateUserRef: UpdateUserRef;

export function updateUser(): MutationPromise<UpdateUserData, undefined>;
export function updateUser(dc: DataConnect): MutationPromise<UpdateUserData, undefined>;

interface DeleteUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
  operationName: string;
}
export const deleteUserRef: DeleteUserRef;

export function deleteUser(): MutationPromise<DeleteUserData, undefined>;
export function deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface GetUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
  operationName: string;
}
export const getUserRef: GetUserRef;

export function getUser(options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;
export function getUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface ListUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
  operationName: string;
}
export const listUsersRef: ListUsersRef;

export function listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;
export function listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface CreateProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateProjectData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateProjectData, undefined>;
  operationName: string;
}
export const createProjectRef: CreateProjectRef;

export function createProject(): MutationPromise<CreateProjectData, undefined>;
export function createProject(dc: DataConnect): MutationPromise<CreateProjectData, undefined>;

interface UpdateProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateProjectData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateProjectData, undefined>;
  operationName: string;
}
export const updateProjectRef: UpdateProjectRef;

export function updateProject(): MutationPromise<UpdateProjectData, undefined>;
export function updateProject(dc: DataConnect): MutationPromise<UpdateProjectData, undefined>;

interface DeleteProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteProjectData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteProjectData, undefined>;
  operationName: string;
}
export const deleteProjectRef: DeleteProjectRef;

export function deleteProject(): MutationPromise<DeleteProjectData, undefined>;
export function deleteProject(dc: DataConnect): MutationPromise<DeleteProjectData, undefined>;

interface GetProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetProjectData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetProjectData, undefined>;
  operationName: string;
}
export const getProjectRef: GetProjectRef;

export function getProject(options?: ExecuteQueryOptions): QueryPromise<GetProjectData, undefined>;
export function getProject(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetProjectData, undefined>;

interface ListProjectsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProjectsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProjectsData, undefined>;
  operationName: string;
}
export const listProjectsRef: ListProjectsRef;

export function listProjects(options?: ExecuteQueryOptions): QueryPromise<ListProjectsData, undefined>;
export function listProjects(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProjectsData, undefined>;

interface CreateTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateTaskData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateTaskData, undefined>;
  operationName: string;
}
export const createTaskRef: CreateTaskRef;

export function createTask(): MutationPromise<CreateTaskData, undefined>;
export function createTask(dc: DataConnect): MutationPromise<CreateTaskData, undefined>;

interface UpdateTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateTaskData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateTaskData, undefined>;
  operationName: string;
}
export const updateTaskRef: UpdateTaskRef;

export function updateTask(): MutationPromise<UpdateTaskData, undefined>;
export function updateTask(dc: DataConnect): MutationPromise<UpdateTaskData, undefined>;

interface DeleteTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteTaskData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteTaskData, undefined>;
  operationName: string;
}
export const deleteTaskRef: DeleteTaskRef;

export function deleteTask(): MutationPromise<DeleteTaskData, undefined>;
export function deleteTask(dc: DataConnect): MutationPromise<DeleteTaskData, undefined>;

interface GetTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetTaskData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetTaskData, undefined>;
  operationName: string;
}
export const getTaskRef: GetTaskRef;

export function getTask(options?: ExecuteQueryOptions): QueryPromise<GetTaskData, undefined>;
export function getTask(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetTaskData, undefined>;

interface ListTasksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTasksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListTasksData, undefined>;
  operationName: string;
}
export const listTasksRef: ListTasksRef;

export function listTasks(options?: ExecuteQueryOptions): QueryPromise<ListTasksData, undefined>;
export function listTasks(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTasksData, undefined>;

interface CreateCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateCommentData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateCommentData, undefined>;
  operationName: string;
}
export const createCommentRef: CreateCommentRef;

export function createComment(): MutationPromise<CreateCommentData, undefined>;
export function createComment(dc: DataConnect): MutationPromise<CreateCommentData, undefined>;

interface UpdateCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateCommentData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateCommentData, undefined>;
  operationName: string;
}
export const updateCommentRef: UpdateCommentRef;

export function updateComment(): MutationPromise<UpdateCommentData, undefined>;
export function updateComment(dc: DataConnect): MutationPromise<UpdateCommentData, undefined>;

interface DeleteCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteCommentData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteCommentData, undefined>;
  operationName: string;
}
export const deleteCommentRef: DeleteCommentRef;

export function deleteComment(): MutationPromise<DeleteCommentData, undefined>;
export function deleteComment(dc: DataConnect): MutationPromise<DeleteCommentData, undefined>;

interface GetCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCommentData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCommentData, undefined>;
  operationName: string;
}
export const getCommentRef: GetCommentRef;

export function getComment(options?: ExecuteQueryOptions): QueryPromise<GetCommentData, undefined>;
export function getComment(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCommentData, undefined>;

interface ListCommentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCommentsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListCommentsData, undefined>;
  operationName: string;
}
export const listCommentsRef: ListCommentsRef;

export function listComments(options?: ExecuteQueryOptions): QueryPromise<ListCommentsData, undefined>;
export function listComments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCommentsData, undefined>;

interface CreateMembershipRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateMembershipData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateMembershipData, undefined>;
  operationName: string;
}
export const createMembershipRef: CreateMembershipRef;

export function createMembership(): MutationPromise<CreateMembershipData, undefined>;
export function createMembership(dc: DataConnect): MutationPromise<CreateMembershipData, undefined>;

interface UpdateMembershipRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateMembershipData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateMembershipData, undefined>;
  operationName: string;
}
export const updateMembershipRef: UpdateMembershipRef;

export function updateMembership(): MutationPromise<UpdateMembershipData, undefined>;
export function updateMembership(dc: DataConnect): MutationPromise<UpdateMembershipData, undefined>;

interface DeleteMembershipRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteMembershipData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteMembershipData, undefined>;
  operationName: string;
}
export const deleteMembershipRef: DeleteMembershipRef;

export function deleteMembership(): MutationPromise<DeleteMembershipData, undefined>;
export function deleteMembership(dc: DataConnect): MutationPromise<DeleteMembershipData, undefined>;

interface GetMembershipRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMembershipData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMembershipData, undefined>;
  operationName: string;
}
export const getMembershipRef: GetMembershipRef;

export function getMembership(options?: ExecuteQueryOptions): QueryPromise<GetMembershipData, undefined>;
export function getMembership(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMembershipData, undefined>;

interface ListMembershipsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMembershipsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMembershipsData, undefined>;
  operationName: string;
}
export const listMembershipsRef: ListMembershipsRef;

export function listMemberships(options?: ExecuteQueryOptions): QueryPromise<ListMembershipsData, undefined>;
export function listMemberships(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMembershipsData, undefined>;

