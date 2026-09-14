import { CreateUserData, UpdateUserData, DeleteUserData, GetUserData, ListUsersData, CreateProjectData, UpdateProjectData, DeleteProjectData, GetProjectData, ListProjectsData, CreateTaskData, UpdateTaskData, DeleteTaskData, GetTaskData, ListTasksData, CreateCommentData, UpdateCommentData, DeleteCommentData, GetCommentData, ListCommentsData, CreateMembershipData, UpdateMembershipData, DeleteMembershipData, GetMembershipData, ListMembershipsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useUpdateUser(options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, void>): UseDataConnectMutationResult<UpdateUserData, undefined>;
export function useUpdateUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, void>): UseDataConnectMutationResult<UpdateUserData, undefined>;

export function useDeleteUser(options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;
export function useDeleteUser(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;

export function useGetUser(options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;
export function useGetUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;

export function useListUsers(options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;
export function useListUsers(dc: DataConnect, options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;

export function useCreateProject(options?: useDataConnectMutationOptions<CreateProjectData, FirebaseError, void>): UseDataConnectMutationResult<CreateProjectData, undefined>;
export function useCreateProject(dc: DataConnect, options?: useDataConnectMutationOptions<CreateProjectData, FirebaseError, void>): UseDataConnectMutationResult<CreateProjectData, undefined>;

export function useUpdateProject(options?: useDataConnectMutationOptions<UpdateProjectData, FirebaseError, void>): UseDataConnectMutationResult<UpdateProjectData, undefined>;
export function useUpdateProject(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateProjectData, FirebaseError, void>): UseDataConnectMutationResult<UpdateProjectData, undefined>;

export function useDeleteProject(options?: useDataConnectMutationOptions<DeleteProjectData, FirebaseError, void>): UseDataConnectMutationResult<DeleteProjectData, undefined>;
export function useDeleteProject(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteProjectData, FirebaseError, void>): UseDataConnectMutationResult<DeleteProjectData, undefined>;

export function useGetProject(options?: useDataConnectQueryOptions<GetProjectData>): UseDataConnectQueryResult<GetProjectData, undefined>;
export function useGetProject(dc: DataConnect, options?: useDataConnectQueryOptions<GetProjectData>): UseDataConnectQueryResult<GetProjectData, undefined>;

export function useListProjects(options?: useDataConnectQueryOptions<ListProjectsData>): UseDataConnectQueryResult<ListProjectsData, undefined>;
export function useListProjects(dc: DataConnect, options?: useDataConnectQueryOptions<ListProjectsData>): UseDataConnectQueryResult<ListProjectsData, undefined>;

export function useCreateTask(options?: useDataConnectMutationOptions<CreateTaskData, FirebaseError, void>): UseDataConnectMutationResult<CreateTaskData, undefined>;
export function useCreateTask(dc: DataConnect, options?: useDataConnectMutationOptions<CreateTaskData, FirebaseError, void>): UseDataConnectMutationResult<CreateTaskData, undefined>;

export function useUpdateTask(options?: useDataConnectMutationOptions<UpdateTaskData, FirebaseError, void>): UseDataConnectMutationResult<UpdateTaskData, undefined>;
export function useUpdateTask(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateTaskData, FirebaseError, void>): UseDataConnectMutationResult<UpdateTaskData, undefined>;

export function useDeleteTask(options?: useDataConnectMutationOptions<DeleteTaskData, FirebaseError, void>): UseDataConnectMutationResult<DeleteTaskData, undefined>;
export function useDeleteTask(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteTaskData, FirebaseError, void>): UseDataConnectMutationResult<DeleteTaskData, undefined>;

export function useGetTask(options?: useDataConnectQueryOptions<GetTaskData>): UseDataConnectQueryResult<GetTaskData, undefined>;
export function useGetTask(dc: DataConnect, options?: useDataConnectQueryOptions<GetTaskData>): UseDataConnectQueryResult<GetTaskData, undefined>;

export function useListTasks(options?: useDataConnectQueryOptions<ListTasksData>): UseDataConnectQueryResult<ListTasksData, undefined>;
export function useListTasks(dc: DataConnect, options?: useDataConnectQueryOptions<ListTasksData>): UseDataConnectQueryResult<ListTasksData, undefined>;

export function useCreateComment(options?: useDataConnectMutationOptions<CreateCommentData, FirebaseError, void>): UseDataConnectMutationResult<CreateCommentData, undefined>;
export function useCreateComment(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCommentData, FirebaseError, void>): UseDataConnectMutationResult<CreateCommentData, undefined>;

export function useUpdateComment(options?: useDataConnectMutationOptions<UpdateCommentData, FirebaseError, void>): UseDataConnectMutationResult<UpdateCommentData, undefined>;
export function useUpdateComment(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCommentData, FirebaseError, void>): UseDataConnectMutationResult<UpdateCommentData, undefined>;

export function useDeleteComment(options?: useDataConnectMutationOptions<DeleteCommentData, FirebaseError, void>): UseDataConnectMutationResult<DeleteCommentData, undefined>;
export function useDeleteComment(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteCommentData, FirebaseError, void>): UseDataConnectMutationResult<DeleteCommentData, undefined>;

export function useGetComment(options?: useDataConnectQueryOptions<GetCommentData>): UseDataConnectQueryResult<GetCommentData, undefined>;
export function useGetComment(dc: DataConnect, options?: useDataConnectQueryOptions<GetCommentData>): UseDataConnectQueryResult<GetCommentData, undefined>;

export function useListComments(options?: useDataConnectQueryOptions<ListCommentsData>): UseDataConnectQueryResult<ListCommentsData, undefined>;
export function useListComments(dc: DataConnect, options?: useDataConnectQueryOptions<ListCommentsData>): UseDataConnectQueryResult<ListCommentsData, undefined>;

export function useCreateMembership(options?: useDataConnectMutationOptions<CreateMembershipData, FirebaseError, void>): UseDataConnectMutationResult<CreateMembershipData, undefined>;
export function useCreateMembership(dc: DataConnect, options?: useDataConnectMutationOptions<CreateMembershipData, FirebaseError, void>): UseDataConnectMutationResult<CreateMembershipData, undefined>;

export function useUpdateMembership(options?: useDataConnectMutationOptions<UpdateMembershipData, FirebaseError, void>): UseDataConnectMutationResult<UpdateMembershipData, undefined>;
export function useUpdateMembership(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateMembershipData, FirebaseError, void>): UseDataConnectMutationResult<UpdateMembershipData, undefined>;

export function useDeleteMembership(options?: useDataConnectMutationOptions<DeleteMembershipData, FirebaseError, void>): UseDataConnectMutationResult<DeleteMembershipData, undefined>;
export function useDeleteMembership(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteMembershipData, FirebaseError, void>): UseDataConnectMutationResult<DeleteMembershipData, undefined>;

export function useGetMembership(options?: useDataConnectQueryOptions<GetMembershipData>): UseDataConnectQueryResult<GetMembershipData, undefined>;
export function useGetMembership(dc: DataConnect, options?: useDataConnectQueryOptions<GetMembershipData>): UseDataConnectQueryResult<GetMembershipData, undefined>;

export function useListMemberships(options?: useDataConnectQueryOptions<ListMembershipsData>): UseDataConnectQueryResult<ListMembershipsData, undefined>;
export function useListMemberships(dc: DataConnect, options?: useDataConnectQueryOptions<ListMembershipsData>): UseDataConnectQueryResult<ListMembershipsData, undefined>;
