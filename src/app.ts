import dotenv from "dotenv";
import { App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";
import fs from "fs";
import http from "http";

dotenv.config();

async function mainAsync() {
  const appId = process.env.APP_ID!;
  const secret = process.env.WEBHOOK_SECRET!;
  const privateKeyPath = process.env.PRIVATE_KEY_PATH!;
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  const app = new App({
    appId,
    privateKey,
    webhooks: {
      secret,
    },
  });

  app.webhooks.on("pull_request.opened", async ({ octokit, payload }) => {
    console.log(
      `Received pull request event for PR: ${payload.pull_request.number}`
    );
    try {
      await octokit.request(
        "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
          issue_number: payload.pull_request.number,
          body: `Thanks for opening a new pull request, schmuck!`,
          headers: {
            "x-github-api-version": "2022-11-28",
          },
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        console.log(`Error: ${error.message}`);
      }
    }
  });

  app.webhooks.onError((err) => {
    console.log(`Webhook error: ${err}`);
  });

  const port = 3000;
  const host = "localhost";
  const path = "/api/webhook";
  const localWebhookUrl = `http://${host}:${port}${path}`;
  const middleware = createNodeMiddleware(app.webhooks, { path });

  http.createServer(middleware).listen(port, () => {
    console.log(`Server is listening for events at ${localWebhookUrl}`);
  });
}

mainAsync()
