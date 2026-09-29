import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  MAX_MODELS_PER_REPORT,
  models,
  reportModels,
  reports,
  xBookmarkConnections,
  xBookmarkImports,
} from "@/db/schema";
import { env } from "@/lib/env";
import { tweetIdFromUrl } from "@/lib/sources";

const X_API = "https://api.x.com/2";
const CONNECTION_ID = 1;
const TOKEN_REFRESH_MARGIN_MS = 60_000;
const MAX_FOLDER_PAGES = 10;

type XTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
};

type XFolder = { id: string; name: string };
type XPost = {
  id: string;
  text?: string;
  author_id?: string;
  note_tweet?: { text?: string };
  referenced_tweets?: { type: string; id: string }[];
};
type XUser = { id: string; username: string };

export type XImportSummary = {
  scanned: number;
  imported: number;
  duplicates: number;
  unmatched: number;
  unmatchedPosts: { id: string; url: string; text: string }[];
};

function encryptionKey() {
  return createHash("sha256").update(env.xTokenEncryptionKey).digest();
}

export function encryptXToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

function decryptXToken(value: string) {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) throw new Error("Stored X token is malformed");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function xBasicAuthorization() {
  return `Basic ${Buffer.from(`${env.xClientId}:${env.xClientSecret}`).toString("base64")}`;
}

export async function exchangeXAuthorizationCode(input: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    code: input.code,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
    code_verifier: input.codeVerifier,
  });
  const response = await fetch(`${X_API}/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: xBasicAuthorization(),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`X token exchange failed (${response.status}): ${await response.text()}`);
  return (await response.json()) as XTokenResponse;
}

async function refreshAccessToken(connection: typeof xBookmarkConnections.$inferSelect) {
  const body = new URLSearchParams({
    refresh_token: decryptXToken(connection.refreshTokenEncrypted),
    grant_type: "refresh_token",
  });
  const response = await fetch(`${X_API}/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: xBasicAuthorization(),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`X token refresh failed (${response.status}): ${await response.text()}`);

  const token = (await response.json()) as XTokenResponse;
  const refreshToken = token.refresh_token ?? decryptXToken(connection.refreshTokenEncrypted);
  await db
    .update(xBookmarkConnections)
    .set({
      accessTokenEncrypted: encryptXToken(token.access_token),
      refreshTokenEncrypted: encryptXToken(refreshToken),
      accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      scopes: token.scope,
      updatedAt: new Date(),
    })
    .where(eq(xBookmarkConnections.id, CONNECTION_ID));
  return token.access_token;
}

async function connectionAndToken() {
  const connection = await db.query.xBookmarkConnections.findFirst({
    where: eq(xBookmarkConnections.id, CONNECTION_ID),
  });
  if (!connection) throw new Error("X account is not connected");

  const accessToken =
    connection.accessTokenExpiresAt.getTime() <= Date.now() + TOKEN_REFRESH_MARGIN_MS
      ? await refreshAccessToken(connection)
      : decryptXToken(connection.accessTokenEncrypted);
  return { connection, accessToken };
}

async function xGet<T>(path: string, accessToken: string) {
  const response = await fetch(`${X_API}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`X API request failed (${response.status}): ${await response.text()}`);
  return (await response.json()) as T;
}

export async function fetchAuthenticatedXUser(accessToken: string) {
  const payload = await xGet<{ data: XUser }>("/users/me?user.fields=username", accessToken);
  return payload.data;
}

export async function saveXConnection(input: {
  user: XUser;
  token: XTokenResponse;
}) {
  if (!input.token.refresh_token) {
    throw new Error("X did not return a refresh token. Reconnect with the offline.access scope.");
  }
  await db
    .insert(xBookmarkConnections)
    .values({
      id: CONNECTION_ID,
      xUserId: input.user.id,
      username: input.user.username,
      accessTokenEncrypted: encryptXToken(input.token.access_token),
      refreshTokenEncrypted: encryptXToken(input.token.refresh_token),
      accessTokenExpiresAt: new Date(Date.now() + input.token.expires_in * 1000),
      scopes: input.token.scope,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: xBookmarkConnections.id,
      set: {
        xUserId: input.user.id,
        username: input.user.username,
        accessTokenEncrypted: encryptXToken(input.token.access_token),
        refreshTokenEncrypted: encryptXToken(input.token.refresh_token),
        accessTokenExpiresAt: new Date(Date.now() + input.token.expires_in * 1000),
        scopes: input.token.scope,
        folderId: null,
        folderName: null,
        updatedAt: new Date(),
        lastError: null,
      },
    });
}

export async function listXBookmarkFolders() {
  const { connection, accessToken } = await connectionAndToken();
  const folders: XFolder[] = [];
  let paginationToken: string | undefined;
  do {
    const query = new URLSearchParams({ max_results: "100" });
    if (paginationToken) query.set("pagination_token", paginationToken);
    const payload = await xGet<{ data?: XFolder[]; meta?: { next_token?: string } }>(
      `/users/${connection.xUserId}/bookmarks/folders?${query}`,
      accessToken,
    );
    folders.push(...(payload.data ?? []));
    paginationToken = payload.meta?.next_token;
  } while (paginationToken && folders.length < 500);
  return folders;
}

export async function getXIntegrationState() {
  const connection = await db.query.xBookmarkConnections.findFirst({
    where: eq(xBookmarkConnections.id, CONNECTION_ID),
    columns: {
      username: true,
      folderId: true,
      folderName: true,
      connectedAt: true,
      lastRunAt: true,
      lastImportedCount: true,
      lastUnmatchedCount: true,
      lastError: true,
    },
  });
  if (!connection) return { connection: null, folders: [] as XFolder[], configurationError: null };
  try {
    return { connection, folders: await listXBookmarkFolders(), configurationError: null };
  } catch (error) {
    return {
      connection,
      folders: [] as XFolder[],
      configurationError: error instanceof Error ? error.message : "Unable to load X folders",
    };
  }
}

export async function chooseXBookmarkFolder(folderId: string, folderName: string) {
  if (!/^\d{1,19}$/.test(folderId)) throw new Error("Invalid X bookmark folder id");
  await db
    .update(xBookmarkConnections)
    .set({ folderId, folderName: folderName.slice(0, 200), updatedAt: new Date(), lastError: null })
    .where(eq(xBookmarkConnections.id, CONNECTION_ID));
}

async function bookmarkIds(connection: typeof xBookmarkConnections.$inferSelect, accessToken: string) {
  if (!connection.folderId) throw new Error("Choose an X bookmark folder before importing");
  const ids: string[] = [];
  let paginationToken: string | undefined;
  let page = 0;
  do {
    const query = new URLSearchParams({ max_results: "100" });
    if (paginationToken) query.set("pagination_token", paginationToken);
    const payload = await xGet<{ data?: { id: string }[]; meta?: { next_token?: string } }>(
      `/users/${connection.xUserId}/bookmarks/folders/${connection.folderId}?${query}`,
      accessToken,
    );
    ids.push(...(payload.data ?? []).map((post) => post.id));
    paginationToken = payload.meta?.next_token;
    page += 1;
  } while (paginationToken && page < MAX_FOLDER_PAGES);
  return [...new Set(ids)];
}

async function lookupPosts(ids: string[], accessToken: string) {
  const posts: XPost[] = [];
  const users = new Map<string, XUser>();
  const referencedPosts = new Map<string, XPost>();
  for (let start = 0; start < ids.length; start += 100) {
    const query = new URLSearchParams({
      ids: ids.slice(start, start + 100).join(","),
      "tweet.fields": "author_id,text,note_tweet,referenced_tweets",
      expansions: "author_id,referenced_tweets.id,referenced_tweets.id.author_id",
      "user.fields": "username",
    });
    const payload = await xGet<{
      data?: XPost[];
      includes?: { users?: XUser[]; tweets?: XPost[] };
    }>(`/tweets?${query}`, accessToken);
    posts.push(...(payload.data ?? []));
    for (const user of payload.includes?.users ?? []) users.set(user.id, user);
    for (const post of payload.includes?.tweets ?? []) referencedPosts.set(post.id, post);
  }
  return { posts, users, referencedPosts };
}

function normalized(value: string) {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

function modelAliases(model: { name: string; slug: string; provider: string }) {
  const aliases = new Set([normalized(model.name), normalized(model.slug)]);
  const name = normalized(model.name).trim();
  if (name.startsWith("claude ")) aliases.add(` ${name.slice("claude ".length)} `);
  const provider = normalized(model.provider).trim();
  if (provider && name.startsWith(`${provider} `)) aliases.add(` ${name.slice(provider.length + 1)} `);
  return [...aliases].filter((alias) => alias.trim().length >= 2);
}

function matchModels(text: string, candidates: { id: number; name: string; slug: string; provider: string }[]) {
  const haystack = normalized(text);
  return candidates
    .filter((model) => modelAliases(model).some((alias) => haystack.includes(alias)))
    .slice(0, MAX_MODELS_PER_REPORT);
}

function taskCategory(text: string): "coding" | "agentic" | "vision" | "writing" | "other" {
  const value = text.toLowerCase();
  if (/\b(code|coding|program|repo|debug|frontend|backend|app|website|terminal)\b/.test(value)) return "coding";
  if (/\b(agent|agentic|tool.?use|browser|computer use|workflow|autonomous)\b/.test(value)) return "agentic";
  if (/\b(image|video|vision|photo|draw|render|visual|ocr)\b/.test(value)) return "vision";
  if (/\b(write|writing|story|poem|copy|essay|prose|rewrite)\b/.test(value)) return "writing";
  return "other";
}

function reportTakeaway(username: string | undefined, text: string) {
  const clean = text.replace(/https?:\/\/t\.co\/\w+/g, "").replace(/\s+/g, " ").trim();
  const prefix = username ? `@${username}: ` : "X test: ";
  return `${prefix}${clean}`.slice(0, 400).trim();
}

export async function importXBookmarkFolder(): Promise<XImportSummary> {
  const { connection, accessToken } = await connectionAndToken();
  try {
    const ids = await bookmarkIds(connection, accessToken);
    const [candidates, existingTwitterReports, previousImports] = await Promise.all([
      db
        .select({ id: models.id, name: models.name, slug: models.slug, provider: models.provider })
        .from(models)
        .where(inArray(models.status, ["released", "announced"])),
      db
        .select({ id: reports.id, sourceUrl: reports.sourceUrl })
        .from(reports)
        .where(eq(reports.sourceType, "twitter")),
      ids.length
        ? db
            .select({
              tweetId: xBookmarkImports.tweetId,
              status: xBookmarkImports.status,
              sourceUrl: xBookmarkImports.sourceUrl,
              authorUsername: xBookmarkImports.authorUsername,
              postText: xBookmarkImports.postText,
            })
            .from(xBookmarkImports)
            .where(inArray(xBookmarkImports.tweetId, ids))
        : Promise.resolve([]),
    ]);
    const previousStatus = new Map(previousImports.map((item) => [item.tweetId, item.status]));
    const existingReportByTweetId = new Map<string, number>();
    for (const report of existingTwitterReports) {
      const tweetId = tweetIdFromUrl(report.sourceUrl);
      if (tweetId) existingReportByTweetId.set(tweetId, report.id);
    }
    const summary: XImportSummary = {
      scanned: ids.length,
      imported: 0,
      duplicates: 0,
      unmatched: 0,
      unmatchedPosts: [],
    };

    // The folder endpoint gives us IDs. Only hydrate IDs TrackAI has never
    // seen; rereading every old Post on every schedule would turn a no-change
    // run into another full set of billable Post reads.
    const idsToLookup = ids.filter(
      (id) => !previousStatus.has(id) && !existingReportByTweetId.has(id),
    );
    const { posts, users, referencedPosts } = idsToLookup.length
      ? await lookupPosts(idsToLookup, accessToken)
      : { posts: [] as XPost[], users: new Map<string, XUser>(), referencedPosts: new Map<string, XPost>() };
    const storedImportById = new Map(previousImports.map((item) => [item.tweetId, item]));
    const postsToProcess: XPost[] = [
      ...posts,
      ...previousImports
        .filter((item) => item.status === "unmatched")
        .map((item) => ({ id: item.tweetId, text: item.postText })),
    ];

    summary.duplicates = ids.filter(
      (id) => previousStatus.get(id) === "imported" || existingReportByTweetId.has(id),
    ).length;

    // Older reports may predate the importer table. Remember their Tweet IDs
    // without paying to hydrate them again, so every later run is a cheap skip.
    for (const id of ids) {
      const reportId = existingReportByTweetId.get(id);
      if (!reportId || previousStatus.has(id)) continue;
      const existingReport = existingTwitterReports.find((report) => report.id === reportId);
      await db
        .insert(xBookmarkImports)
        .values({
          tweetId: id,
          sourceUrl: existingReport?.sourceUrl ?? `https://x.com/i/web/status/${id}`,
          postText: "",
          status: "imported",
          matchedSlugs: [],
          reportId,
        })
        .onConflictDoNothing({ target: xBookmarkImports.tweetId });
    }

    for (const post of postsToProcess) {
      const storedImport = storedImportById.get(post.id);
      const username = storedImport?.authorUsername ?? (post.author_id ? users.get(post.author_id)?.username : undefined);
      const text = post.note_tweet?.text ?? post.text ?? "";
      const referencedText = (post.referenced_tweets ?? [])
        .map((reference) => referencedPosts.get(reference.id))
        .map((reference) => reference?.note_tweet?.text ?? reference?.text ?? "")
        .join(" ");
      const matched = matchModels(`${text} ${referencedText}`, candidates);
      const sourceUrl = storedImport?.sourceUrl ?? (username
        ? `https://x.com/${username}/status/${post.id}`
        : `https://x.com/i/web/status/${post.id}`);

      if (matched.length === 0) {
        await db
          .insert(xBookmarkImports)
          .values({
            tweetId: post.id,
            sourceUrl,
            authorUsername: username,
            postText: text,
            status: "unmatched",
            matchedSlugs: [],
            reason: "No tracked model name was found in the post or its quoted post.",
          })
          .onConflictDoUpdate({
            target: xBookmarkImports.tweetId,
            set: { sourceUrl, authorUsername: username, postText: text, status: "unmatched", updatedAt: new Date() },
          });
        if (previousStatus.get(post.id) !== "unmatched") {
          summary.unmatched += 1;
          summary.unmatchedPosts.push({ id: post.id, url: sourceUrl, text: text.slice(0, 160) });
        }
        continue;
      }

      const [created] = await db.transaction(async (tx) => {
        const inserted = await tx
          .insert(reports)
          .values({
            taskCategory: taskCategory(`${text} ${referencedText}`),
            takeaway: reportTakeaway(username, text),
            sourceUrl,
            sourceType: "twitter",
            status: "approved",
            approvedAt: new Date(),
          })
          .onConflictDoNothing({ target: reports.sourceUrl })
          .returning({ id: reports.id });
        if (inserted[0]) {
          await tx.insert(reportModels).values(matched.map((model) => ({ reportId: inserted[0].id, modelId: model.id })));
        }
        return inserted;
      });

      await db
        .insert(xBookmarkImports)
        .values({
          tweetId: post.id,
          sourceUrl,
          authorUsername: username,
          postText: text,
          status: "imported",
          matchedSlugs: matched.map((model) => model.slug),
          reportId: created?.id,
        })
        .onConflictDoUpdate({
          target: xBookmarkImports.tweetId,
          set: {
            sourceUrl,
            authorUsername: username,
            postText: text,
            status: "imported",
            matchedSlugs: matched.map((model) => model.slug),
            ...(created?.id ? { reportId: created.id } : {}),
            reason: null,
            updatedAt: new Date(),
          },
        });

      if (created) summary.imported += 1;
      else summary.duplicates += 1;
    }

    await db
      .update(xBookmarkConnections)
      .set({
        lastRunAt: new Date(),
        lastImportedCount: summary.imported,
        lastUnmatchedCount: summary.unmatched,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(xBookmarkConnections.id, CONNECTION_ID));
    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : "X bookmark import failed";
    await db
      .update(xBookmarkConnections)
      .set({ lastRunAt: new Date(), lastError: message.slice(0, 1_000), updatedAt: new Date() })
      .where(eq(xBookmarkConnections.id, CONNECTION_ID));
    throw error;
  }
}
