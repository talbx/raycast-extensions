import {
  Action,
  ActionPanel,
  getApplications,
  getPreferenceValues,
  Icon,
  List,
  open,
  openCommandPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect } from "react";
import { showFailureToast, useCachedPromise } from "@raycast/utils";
import { findProjects } from "./find-projects";

export interface LogicProject {
  name: string;
  id: string;
  path: string;
  lastModified: Date;
}

const isLogicInstalled = async () => {
  const apps = await getApplications();
  return apps.some(({ bundleId }) => bundleId === "com.apple.logic10");
};

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();

  isLogicInstalled().then((installed) => {
    if (!installed) {
      const options: Toast.Options = {
        style: Toast.Style.Failure,
        title: "Logic Pro is not installed.",
        message: "Install it from: https://www.apple.com/logic-pro/",
        primaryAction: {
          title: "Go to https://www.apple.com/logic-pro/",
          onAction: (toast) => {
            open("https://www.apple.com/logic-pro/").then(() => toast.hide());
          },
        },
      };
      return showToast(options);
    }
  });

  const { isLoading, data, error } = useCachedPromise(async () => await findProjects(), [], { keepPreviousData: true });

  useEffect(() => {
    if (error !== undefined) {
      showFailureToast(error, {
        title: "Something went wrong",
      });
    }
  }, [error]);

  return (
    <List
      isLoading={isLoading}
      filtering={true}
      throttle={true}
      searchBarPlaceholder={"Filter projects...yy"}
      actions={
        <ActionPanel>
          <Action title="Open Extension Preferences" onAction={openCommandPreferences} icon={Icon.WrenchScrewdriver} />
        </ActionPanel>
      }
    >
      {(data || []).map((project) => {
        return (
          <List.Item
            key={project.id}
            accessories={[
              {
                date: {
                  value: project.lastModified,
                },
              },
            ]}
            icon={{
              source:
                "https://help.apple.com/assets/654E7F8CD472768668095520/654E7F9560B6B45E960FE823/de_DE/390711ce08c61bf054d3dc4dfb9080ae.png",
            }}
            title={project.name}
            actions={
              <ActionPanel>
                <Action title="Open Project" onAction={() => open(project.path)} icon={Icon.Play} />
                <Action
                  title="Open Extension Preferences"
                  onAction={openCommandPreferences}
                  icon={Icon.WrenchScrewdriver}
                />
              </ActionPanel>
            }
          />
        );
      })}
      {(data || []).length == 0 && (
        <List.EmptyView
          actions={
            <ActionPanel>
              <Action
                title="Open Extension Preferences"
                onAction={openCommandPreferences}
                icon={Icon.WrenchScrewdriver}
              />
            </ActionPanel>
          }
          icon={Icon.EmojiSad}
          title={"No Logic projects found."}
          description={`Are you sure you picked the right directory?
${preferences["projects-location"]} is currently selected.
Open the extension preferences (Enter) to change the directory.`}
        ></List.EmptyView>
      )}
    </List>
  );
}
