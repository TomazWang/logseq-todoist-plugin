import { Project, Task, TodoistApi } from '@doist/todoist-api-typescript';

export const TodoistProxy = (apiToken: string) => {
    const api = new TodoistApi(apiToken);

    async function getAllProjects(): Promise<Project[]> {
        return api.getProjects();
    }

    async function getProjectName(projectId: number): Promise<Project> {
        try {
            const project = await api.getProject(projectId);
            return project;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async function sendTask(props: {
        projectId?: number;
        content: string;
        labelIds?: number[];
        description?: string;
        dueString?: string;
    }): Promise<Task> {
        const { projectId, content, labelIds, description, dueString } = props;
        try {
            const task = api.addTask({
                projectId: projectId,
                content: content,
                description: description,
                labelIds: labelIds,
                dueString: dueString,
            });
            return task;
        } catch (err) {
            console.log(`TodoistProxy.sendTask:: ${err}`);
            throw err;
        }
    }

    return {
        getAllProjects,
        getProjectName,
        sendTask,
    };
};
