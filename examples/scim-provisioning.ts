// Okta provisions SaaS apps from Workday. Written in TypeScript with the placement
// helpers (system/layouts/place.ts): cards are placed relative to each other, so a longer text
// or another app re-flows the rest.
import { bottom, defineSpec, rightOf, row, zoneAround } from "okta-diagram-tool";
import type { Arrow, Box } from "okta-diagram-tool";

const hr: Box = {
  id: "hr",
  x: 48,
  y: 134,
  w: 260,
  title: "Workday",
  text: "Sends joiners, movers and leavers to Okta",
  icon: "workday",
};
const okta: Box = {
  id: "okta",
  ...rightOf(hr, 320, 140),
  logo: "okta-wordmark",
  sections: [
    { icon: "okta-directory", heading: "Universal Directory", items: ["User profiles and groups"] },
    {
      icon: "okta-workflows",
      heading: "Lifecycle Management",
      items: ["Group rules assign apps", "SCIM provisioning"],
    },
  ],
};
const users: Box = {
  id: "users",
  ...rightOf(okta, 260, 140),
  title: "Users and agents",
  text: "Sign in to every app with Okta",
  icon: "users",
};

const busY = bottom(okta) + 48; // the provisioning bus runs under the Okta card
const apps = row(
  48,
  busY + 48,
  216,
  [
    { id: "salesforce", title: "Salesforce", text: "Accounts and permission sets", icon: "salesforce" },
    { id: "servicenow", title: "ServiceNow", text: "Accounts and roles", icon: "servicenow" },
    { id: "slack", title: "Slack", text: "Accounts and channels by group", icon: "slack" },
    { id: "github", title: "GitHub", text: "Organisation members and teams", icon: "github" },
    {
      id: "manual",
      title: "Apps without SCIM",
      text: "Okta assigns access and the app team creates accounts",
      icon: "triangle-alert",
      dashed: true,
    },
  ],
  24,
);

const oktaOut = "okta.bottom@160";
const toApps: Arrow[] = apps.map((a) => ({
  kind: a.dashed ? "warn" : "attr",
  points: [oktaOut, [a.x + a.w / 2, busY], `${a.id}.top`],
}));
toApps[0].label = {
  text: "SCIM provisioning of accounts and groups",
  at: [okta.x + 168, busY - 8],
  anchor: "start",
};
toApps[apps.length - 1].label = {
  text: "no provisioning",
  at: [apps[4].x + apps[4].w / 2 + 8, busY + 30],
  anchor: "start",
};

const zone = zoneAround(apps, "SaaS apps", "br");

export default defineSpec({
  title: "Okta provisions SaaS apps from Workday",
  description:
    "Workday sends joiners, movers and leavers to Okta. Okta keeps user profiles and groups in Universal Directory, assigns apps with group rules, and provisions accounts and group memberships to Salesforce, ServiceNow, Slack and GitHub over SCIM. Apps without SCIM get access assignments only; their app teams create accounts. Users and agents sign in once with Okta.",
  canvas: { x: 0, y: 0, w: 1280, h: zone.y + zone.h + 116 },
  zones: [zone],
  boxes: [hr, okta, users, ...apps],
  arrows: [
    {
      kind: "attr",
      points: ["hr.right@46", "okta.left@46"],
      label: { text: ["joiners, movers", "and leavers"], at: [hr.x + hr.w + 12, 156], anchor: "start" },
    },
    {
      kind: "req",
      points: ["users.left@46", "okta.right@46"],
      label: { text: "sign in", at: [okta.x + okta.w + 70, 172] },
    },
    ...toApps,
  ],
  legend: {
    layout: "row",
    x: 48,
    y: zone.y + zone.h + 64,
    labels: { attr: "Provisioning", warn: "No provisioning" },
  },
});
