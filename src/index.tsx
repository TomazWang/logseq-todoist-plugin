import "@logseq/libs";
import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";
import { callSettings } from "./callSettings";
import { handleClosePopup } from "./handleClosePopup";
import { insertTasksIntoLogseq } from "./helpersLogseq";
import {
  getIdFromProjectAndLabel,
  removePrefix,
  removePrefixWhenAddingTodoistUrl,
  sendTaskFunction,
} from "./helpersTodoist";
import { sendTask } from "./sendTask";

const main = async () => {
  console.log("logseq-todoist-plugin loaded");

  callSettings();

  handleClosePopup();

  // Register push command
  logseq.Editor.registerSlashCommand("block info", async (e) => {
    const currBlk = (await logseq.Editor.getBlock(e.uuid)) as BlockEntity;
    console.log(`[tomaz] /send task:: currBlk = ${JSON.stringify(currBlk)}`)

    window.setTimeout(async function () {
      await logseq.Editor.exitEditingMode();
      logseq.App.showMsg(`
       [:div.p-2
         [:h2.text-xl "${currBlk.content}"]]`);
    }, 500);
  })


  logseq.Editor.registerSlashCommand("todoist - send task", async (e) => {
    const {
      sendDefaultProject,
      sendDefaultLabel,
      sendDefaultDeadline,
      appendLogseqUri,
      appendTodoistUrl,
    } = logseq.settings!;

    const currGraphName = (await logseq.App.getCurrentGraph())?.name ?? "logseq"
    const currBlk = (await logseq.Editor.getBlock(e.uuid)) as BlockEntity;

    console.log(`[tomaz] /send task:: currBlk = ${JSON.stringify(currBlk)}`)
    console.log(`[tomaz] /send task:: currBlk.content = ${currBlk.content}`)

    

    await new Promise((r) => setTimeout(r, 2000));

    if (!sendDefaultProject && !sendDefaultLabel && !sendDefaultDeadline) {
      await sendTask(currBlk.content, currBlk.uuid, currGraphName);
    } else {
      let data: {
          content: string;
          project_id?: number;
          description?: string;
          due_string?: string;
          label_ids?: number[];
      } = {
          content: removePrefix(currBlk.content),
          description: appendLogseqUri && `[logseq link](logseq://graph/${currGraphName}?block-id=${currBlk.uuid})`,
      };
      if (sendDefaultProject && sendDefaultProject !== "---")
        data["project_id"] = parseInt(
          getIdFromProjectAndLabel(sendDefaultProject) as string
        );
      if (sendDefaultDeadline) data["due_string"] = "today";
      if (sendDefaultLabel && sendDefaultLabel !== "---")
        data["label_ids"] = [
          parseInt(getIdFromProjectAndLabel(sendDefaultLabel) as string),
        ];

      console.log(`[tomaz] /send task:: before send, data = ${JSON.stringify(data)}`)

      const sendResponse = await sendTaskFunction(data);
      if (appendTodoistUrl) {
        await logseq.Editor.updateBlock(
          currBlk.uuid,
          `${currBlk.content} [(todoist)](${sendResponse.url})`
        );
      }
      window.setTimeout(async function () {
        await logseq.Editor.exitEditingMode();
        logseq.App.showMsg(`
         [:div.p-2
           [:h1 "Task!"]
           [:h2.text-xl "${currBlk.content}"]]`);
      }, 500);
    }
  });

  // Register pull command
  logseq.Editor.registerSlashCommand("todoist - pull tasks", async () => {
    const id = getIdFromProjectAndLabel(logseq.settings!.pullDefaultProject);

    if (id.startsWith("Error")) {
      logseq.App.showMsg(
        "Error getting default project ID. Do you want to pull TODAY's tasks instead?"
      );
    } else {
      await insertTasksIntoLogseq(id);
    }
  });

  // Register pull today's tasks command
  logseq.Editor.registerSlashCommand(
    `todoist - pull today's tasks`,
    async () => {
      await insertTasksIntoLogseq("today");
    }
  );
};

logseq.ready(main).catch(console.error);
