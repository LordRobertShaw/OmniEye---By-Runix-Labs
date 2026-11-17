import crypto from "crypto";
import { and, desc, eq, gte, gt, lt, lte, or, sql } from "drizzle-orm";
import { db } from "./index.ts";
import {
  auditLedger,
  blockedIps,
  configRevisions,
  deviceEncyclopedia,
  encryptedVaults,
  nodeCommands,
  probeLogs,
  slaRollups,
  tunnelAuthLogs,
  tunnelProfiles,
  users,
  webhookCooldowns,
  webhookDeliveries,
  webhookTargets,
} from "./schema.ts";

export async function listTunnelProfiles(userId: number) {
  try {
    return await db
      .select()
      .from(tunnelProfiles)
      .where(eq(tunnelProfiles.userId, userId))
      .orderBy(desc(tunnelProfiles.updatedAt), desc(tunnelProfiles.id));
  } catch (error) {
    throw new Error("Unable to load tunnel profiles.", { cause: error });
  }
}

export async function seedTunnelProfilesBatch(
  userId: number,
  inputs: Array<{
    name: string;
    category: string;
    endpointHost: string;
    endpointPort: number;
    lat: number;
    lng: number;
    locationLabel: string;
    segmentId: string;
    variablesJson: Record<string, string>;
    isActive?: boolean;
    lastRttMs?: number | null;
    ingestToken?: string;
    alertThresholdMs?: number;
  }>
) {
  if (inputs.length === 0) return [];
  try {
    return await db
      .insert(tunnelProfiles)
      .values(
        inputs.map((input) => ({
          userId,
          name: input.name,
          category: input.category,
          endpointHost: input.endpointHost,
          endpointPort: input.endpointPort,
          lat: input.lat,
          lng: input.lng,
          locationLabel: input.locationLabel,
          segmentId: input.segmentId,
          variablesJson: input.variablesJson,
          isActive: input.isActive ?? true,
          lastRttMs: input.lastRttMs ?? null,
          ingestToken: input.ingestToken ?? null,
          alertThresholdMs: input.alertThresholdMs ?? 200,
          updatedAt: new Date(),
        }))
      )
      .returning();
  } catch (error) {
    throw new Error("Unable to batch seed tunnel profiles.", { cause: error });
  }
}

export async function createTunnelProfile(
  userId: number,
  input: {
    name: string;
    category: string;
    endpointHost: string;
    endpointPort: number;
    lat: number;
    lng: number;
    locationLabel: string;
    segmentId: string;
    variablesJson: Record<string, string>;
    isActive?: boolean;
    lastRttMs?: number | null;
    ingestToken?: string | null;
    alertThresholdMs?: number;
  }
) {
  try {
    const [created] = await db
      .insert(tunnelProfiles)
      .values({
        userId,
        name: input.name,
        category: input.category,
        endpointHost: input.endpointHost,
        endpointPort: input.endpointPort,
        lat: input.lat,
        lng: input.lng,
        locationLabel: input.locationLabel,
        segmentId: input.segmentId,
        variablesJson: input.variablesJson,
        isActive: input.isActive ?? true,
        lastRttMs: input.lastRttMs ?? null,
        ingestToken: input.ingestToken ?? null,
        alertThresholdMs: input.alertThresholdMs ?? 200,
        updatedAt: new Date(),
      })
      .returning();
    return created;
  } catch (error) {
    throw new Error("Unable to save tunnel profile.", { cause: error });
  }
}

export async function listAllActiveTunnelProfiles() {
  try {
    return await db
      .select()
      .from(tunnelProfiles)
      .where(eq(tunnelProfiles.isActive, true));
  } catch (error) {
    throw new Error("Unable to load active fleet profiles.", { cause: error });
  }
}

export async function updateTunnelProfile(
  userId: number,
  profileId: number,
  patch: Partial<{
    name: string;
    category: string;
    endpointHost: string;
    endpointPort: number;
    lat: number;
    lng: number;
    locationLabel: string;
    segmentId: string;
    variablesJson: Record<string, string>;
    isActive: boolean;
    lastRttMs: number | null;
    rxBytes: number;
    txBytes: number;
    handshakeAgeSec: number | null;
    lastHeartbeatAt: Date;
    ingestToken: string | null;
    previousIngestToken: string | null;
    tokenGraceExpiresAt: Date | null;
    hmacSecret: string | null;
    alertThresholdMs: number;
    failoverRole: string;
    failoverTargetId: number | null;
    consecutiveFailures: number;
    consecutiveRecoveries: number;
    healthState: string;
    expectedConfigHash: string | null;
    reportedConfigHash: string | null;
    lastDriftCheckAt: Date;
    lastRotatedAt: Date;
    rotationPolicyDays: number;
    certExpiresAt: Date | null;
    certSubject: string | null;
    restrictToRegion: boolean;
    maintenanceUntil: Date | null;
    lastResolvedIp: string | null;
    routeFlapCount: number;
    canaryStatus: string;
  }>
) {
  try {
    const [updated] = await db
      .update(tunnelProfiles)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(and(eq(tunnelProfiles.id, profileId), eq(tunnelProfiles.userId, userId)))
      .returning();
    return updated ?? null;
  } catch (error) {
    throw new Error("Unable to update tunnel profile.", { cause: error });
  }
}

export async function getTunnelProfileByIngestToken(token: string) {
  try {
    const now = new Date();
    const [found] = await db
      .select()
      .from(tunnelProfiles)
      .where(
        or(
          eq(tunnelProfiles.ingestToken, token),
          and(
            eq(tunnelProfiles.previousIngestToken, token),
            gt(tunnelProfiles.tokenGraceExpiresAt, now)
          )
        )
      )
      .limit(1);
    return found ?? null;
  } catch (error) {
    throw new Error("Unable to resolve telemetry token.", { cause: error });
  }
}

export async function recordProfileHeartbeatById(
  profileId: number,
  metrics: {
    rxBytes?: number;
    txBytes?: number;
    handshakeAgeSec?: number | null;
    lastRttMs?: number | null;
    isActive?: boolean;
    reportedConfigHash?: string | null;
  }
) {
  try {
    const now = new Date();
    const [updated] = await db
      .update(tunnelProfiles)
      .set({
        ...(typeof metrics.rxBytes === "number" ? { rxBytes: metrics.rxBytes } : {}),
        ...(typeof metrics.txBytes === "number" ? { txBytes: metrics.txBytes } : {}),
        ...(metrics.handshakeAgeSec !== undefined ? { handshakeAgeSec: metrics.handshakeAgeSec } : {}),
        ...(metrics.lastRttMs !== undefined ? { lastRttMs: metrics.lastRttMs } : {}),
        ...(typeof metrics.isActive === "boolean" ? { isActive: metrics.isActive } : {}),
        ...(metrics.reportedConfigHash
          ? { reportedConfigHash: metrics.reportedConfigHash, lastDriftCheckAt: now }
          : {}),
        lastHeartbeatAt: now,
        updatedAt: now,
      })
      .where(eq(tunnelProfiles.id, profileId))
      .returning();
    return updated ?? null;
  } catch (error) {
    throw new Error("Unable to persist node heartbeat.", { cause: error });
  }
}

export async function deleteTunnelProfile(userId: number, profileId: number) {
  try {
    const [deleted] = await db
      .delete(tunnelProfiles)
      .where(and(eq(tunnelProfiles.id, profileId), eq(tunnelProfiles.userId, userId)))
      .returning();
    return deleted ?? null;
  } catch (error) {
    throw new Error("Unable to delete tunnel profile.", { cause: error });
  }
}

export async function listProbeLogs(userId: number, limitCount = 50) {
  try {
    return await db
      .select()
      .from(probeLogs)
      .where(eq(probeLogs.userId, userId))
      .orderBy(desc(probeLogs.createdAt))
      .limit(limitCount);
  } catch (error) {
    throw new Error("Unable to load probe logs.", { cause: error });
  }
}

export async function recordProbeLog(
  userId: number,
  input: {
    profileId?: number | null;
    target: string;
    rttMs: number;
    status: string;
    dnsResolver?: string;
  }
) {
  try {
    const [created] = await db
      .insert(probeLogs)
      .values({
        userId,
        profileId: input.profileId ?? null,
        target: input.target,
        rttMs: input.rttMs,
        status: input.status,
        dnsResolver: input.dnsResolver ?? "1.1.1.1",
      })
      .returning();
    return created;
  } catch (error) {
    throw new Error("Unable to record probe telemetry.", { cause: error });
  }
}

export async function listWebhookTargets(userId: number) {
  try {
    return await db
      .select()
      .from(webhookTargets)
      .where(eq(webhookTargets.userId, userId))
      .orderBy(desc(webhookTargets.createdAt));
  } catch (error) {
    throw new Error("Unable to load webhook targets.", { cause: error });
  }
}

export async function createWebhookTarget(
  userId: number,
  input: {
    name: string;
    provider: string;
    url: string;
    assignedTunnels: string[];
    enabled?: boolean;
  }
) {
  try {
    const [created] = await db
      .insert(webhookTargets)
      .values({
        userId,
        name: input.name,
        provider: input.provider,
        url: input.url,
        assignedTunnels: input.assignedTunnels,
        enabled: input.enabled ?? true,
      })
      .returning();
    return created;
  } catch (error) {
    throw new Error("Unable to save webhook target.", { cause: error });
  }
}

export async function deleteWebhookTarget(userId: number, webhookId: number) {
  try {
    const [deleted] = await db
      .delete(webhookTargets)
      .where(and(eq(webhookTargets.id, webhookId), eq(webhookTargets.userId, userId)))
      .returning();
    return deleted ?? null;
  } catch (error) {
    throw new Error("Unable to remove webhook target.", { cause: error });
  }
}

export async function listTunnelAuthLogs(
  userId: number,
  options?: { protocol?: string; outcome?: string; limit?: number }
) {
  try {
    const conditions = [eq(tunnelAuthLogs.userId, userId)];
    if (options?.protocol && options.protocol !== "all") {
      conditions.push(eq(tunnelAuthLogs.protocol, options.protocol));
    }
    if (options?.outcome && options.outcome !== "all") {
      conditions.push(eq(tunnelAuthLogs.outcome, options.outcome));
    }
    return await db
      .select()
      .from(tunnelAuthLogs)
      .where(and(...conditions))
      .orderBy(desc(tunnelAuthLogs.createdAt), desc(tunnelAuthLogs.id))
      .limit(options?.limit ?? 120);
  } catch (error) {
    throw new Error("Unable to load tunnel authentication history.", { cause: error });
  }
}

export async function seedTunnelAuthLogsBatch(
  userId: number,
  inputs: Array<{
    profileId?: number | null;
    tunnelName: string;
    protocol: string;
    outcome: string;
    actor: string;
    sourceIp: string;
    authMethod: string;
    reason?: string;
    createdAt?: Date;
  }>
) {
  if (inputs.length === 0) return [];
  try {
    return await db
      .insert(tunnelAuthLogs)
      .values(
        inputs.map((input) => ({
          userId,
          profileId: input.profileId ?? null,
          tunnelName: input.tunnelName,
          protocol: input.protocol,
          outcome: input.outcome,
          actor: input.actor,
          sourceIp: input.sourceIp,
          authMethod: input.authMethod,
          reason: input.reason ?? "",
          createdAt: input.createdAt ?? new Date(),
        }))
      )
      .returning();
  } catch (error) {
    throw new Error("Unable to seed tunnel authentication logs.", { cause: error });
  }
}

export async function recordTunnelAuthLog(
  userId: number,
  input: {
    profileId?: number | null;
    tunnelName: string;
    protocol: string;
    outcome: string;
    actor: string;
    sourceIp: string;
    authMethod: string;
    reason?: string;
  }
) {
  try {
    const [created] = await db
      .insert(tunnelAuthLogs)
      .values({
        userId,
        profileId: input.profileId ?? null,
        tunnelName: input.tunnelName,
        protocol: input.protocol,
        outcome: input.outcome,
        actor: input.actor,
        sourceIp: input.sourceIp,
        authMethod: input.authMethod,
        reason: input.reason ?? "",
      })
      .returning();
    return created;
  } catch (error) {
    throw new Error("Unable to record tunnel authentication event.", { cause: error });
  }
}

export async function countRecentFailedAuthAttempts(
  userId: number,
  sourceIp: string,
  windowMinutes = 15
) {
  try {
    const since = new Date(Date.now() - windowMinutes * 60_000);
    const rows = await db
      .select()
      .from(tunnelAuthLogs)
      .where(
        and(
          eq(tunnelAuthLogs.userId, userId),
          eq(tunnelAuthLogs.sourceIp, sourceIp),
          eq(tunnelAuthLogs.outcome, "failed"),
          gte(tunnelAuthLogs.createdAt, since)
        )
      );
    return rows.length;
  } catch (error) {
    throw new Error("Unable to inspect recent failed auth attempts.", { cause: error });
  }
}

export async function listBlockedIps(userId: number) {
  try {
    return await db
      .select()
      .from(blockedIps)
      .where(and(eq(blockedIps.userId, userId), eq(blockedIps.isActive, true)))
      .orderBy(desc(blockedIps.createdAt));
  } catch (error) {
    throw new Error("Unable to load blocked IP rules.", { cause: error });
  }
}

export async function upsertBlockedIp(
  userId: number,
  input: {
    ipAddress: string;
    protocol: string;
    reason: string;
    failCount: number;
    ttlHours?: number;
  }
) {
  try {
    const existing = await db
      .select()
      .from(blockedIps)
      .where(
        and(
          eq(blockedIps.userId, userId),
          eq(blockedIps.ipAddress, input.ipAddress),
          eq(blockedIps.isActive, true)
        )
      )
      .limit(1);

    const expiresAt =
      typeof input.ttlHours === "number" && input.ttlHours > 0
        ? new Date(Date.now() + input.ttlHours * 3600_000)
        : null;

    if (existing[0]) {
      const [updated] = await db
        .update(blockedIps)
        .set({
          failCount: Math.max(existing[0].failCount + 1, input.failCount),
          reason: input.reason,
          protocol: input.protocol,
          expiresAt,
        })
        .where(eq(blockedIps.id, existing[0].id))
        .returning();
      return { record: updated, newlyCreated: false };
    }

    const [created] = await db
      .insert(blockedIps)
      .values({
        userId,
        ipAddress: input.ipAddress,
        protocol: input.protocol,
        reason: input.reason,
        failCount: input.failCount,
        isActive: true,
        expiresAt,
      })
      .returning();
    return { record: created, newlyCreated: true };
  } catch (error) {
    throw new Error("Unable to store blocked IP rule.", { cause: error });
  }
}

export async function removeBlockedIp(userId: number, blockId: number) {
  try {
    const [deleted] = await db
      .delete(blockedIps)
      .where(and(eq(blockedIps.id, blockId), eq(blockedIps.userId, userId)))
      .returning();
    return deleted ?? null;
  } catch (error) {
    throw new Error("Unable to remove blocked IP rule.", { cause: error });
  }
}

export async function listSlaRollups(userId: number, limitCount = 48) {
  try {
    return await db
      .select()
      .from(slaRollups)
      .where(eq(slaRollups.userId, userId))
      .orderBy(desc(slaRollups.createdAt))
      .limit(limitCount);
  } catch (error) {
    throw new Error("Unable to load SLA rollups.", { cause: error });
  }
}

export async function upsertSlaRollupSample(
  userId: number,
  input: {
    profileId: number | null;
    tunnelName: string;
    bucketHour: string;
    reachable: boolean;
    rttMs: number;
    staleHeartbeat?: boolean;
  }
) {
  try {
    const existing = await db
      .select()
      .from(slaRollups)
      .where(
        and(
          eq(slaRollups.userId, userId),
          eq(slaRollups.tunnelName, input.tunnelName),
          eq(slaRollups.bucketHour, input.bucketHour)
        )
      )
      .limit(1);

    if (existing[0]) {
      const prev = existing[0];
      const nextTotal = prev.totalProbes + 1;
      const nextOnline = prev.onlineProbes + (input.reachable ? 1 : 0);
      const nextUptime = Math.round((nextOnline / nextTotal) * 1000) / 10;
      const nextAvg =
        input.rttMs > 0
          ? Math.round((prev.avgRttMs * prev.totalProbes + input.rttMs) / nextTotal)
          : prev.avgRttMs;
      const nextP95 = Math.max(prev.p95RttMs, input.rttMs);
      const nextStale = prev.staleHeartbeats + (input.staleHeartbeat ? 1 : 0);

      const [updated] = await db
        .update(slaRollups)
        .set({
          totalProbes: nextTotal,
          onlineProbes: nextOnline,
          uptimePct: nextUptime,
          avgRttMs: nextAvg,
          p95RttMs: nextP95,
          staleHeartbeats: nextStale,
        })
        .where(eq(slaRollups.id, prev.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(slaRollups)
      .values({
        userId,
        profileId: input.profileId,
        tunnelName: input.tunnelName,
        bucketHour: input.bucketHour,
        totalProbes: 1,
        onlineProbes: input.reachable ? 1 : 0,
        uptimePct: input.reachable ? 100 : 0,
        avgRttMs: input.rttMs,
        p95RttMs: input.rttMs,
        staleHeartbeats: input.staleHeartbeat ? 1 : 0,
      })
      .returning();
    return created;
  } catch (error) {
    throw new Error("Unable to persist SLA rollup.", { cause: error });
  }
}

export async function getEncryptedVault(userId: number) {
  try {
    const [vault] = await db
      .select()
      .from(encryptedVaults)
      .where(eq(encryptedVaults.userId, userId))
      .limit(1);
    return vault ?? null;
  } catch (error) {
    throw new Error("Unable to load encrypted cloud vault.", { cause: error });
  }
}

export async function upsertEncryptedVault(userId: number, ciphertextPayload: string) {
  try {
    const existing = await getEncryptedVault(userId);
    const now = new Date();
    if (existing) {
      const [updated] = await db
        .update(encryptedVaults)
        .set({ ciphertextPayload, updatedAt: now })
        .where(eq(encryptedVaults.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(encryptedVaults)
      .values({ userId, ciphertextPayload, updatedAt: now })
      .returning();
    return created;
  } catch (error) {
    throw new Error("Unable to save encrypted cloud vault.", { cause: error });
  }
}

// ==========================================
// PERSISTENT WEBHOOK COOLDOWNS & DELIVERY LEDGER
// ==========================================
export async function isWebhookCooldownActive(cooldownKey: string): Promise<boolean> {
  try {
    const [row] = await db
      .select()
      .from(webhookCooldowns)
      .where(and(eq(webhookCooldowns.cooldownKey, cooldownKey), gt(webhookCooldowns.expiresAt, new Date())))
      .limit(1);
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function setWebhookCooldown(cooldownKey: string, durationMs = 10 * 60_000) {
  const expiresAt = new Date(Date.now() + durationMs);
  const now = new Date();
  try {
    const [existing] = await db
      .select()
      .from(webhookCooldowns)
      .where(eq(webhookCooldowns.cooldownKey, cooldownKey))
      .limit(1);
    if (existing) {
      await db
        .update(webhookCooldowns)
        .set({ expiresAt, updatedAt: now })
        .where(eq(webhookCooldowns.id, existing.id));
    } else {
      await db.insert(webhookCooldowns).values({ cooldownKey, expiresAt, updatedAt: now });
    }
  } catch {
    // non-fatal cooldown persistence error
  }
}

export async function listWebhookDeliveries(userId: number, limitCount = 40) {
  try {
    return await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.userId, userId))
      .orderBy(desc(webhookDeliveries.createdAt), desc(webhookDeliveries.id))
      .limit(limitCount);
  } catch (error) {
    throw new Error("Unable to load webhook delivery history.", { cause: error });
  }
}

export async function getWebhookDeliveryById(userId: number, deliveryId: number) {
  try {
    const [row] = await db
      .select()
      .from(webhookDeliveries)
      .where(and(eq(webhookDeliveries.id, deliveryId), eq(webhookDeliveries.userId, userId)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    throw new Error("Unable to inspect webhook delivery.", { cause: error });
  }
}

export async function createWebhookDelivery(
  userId: number,
  input: {
    webhookId?: number | null;
    webhookName: string;
    provider: string;
    webhookUrl: string;
    eventType: string;
    tunnelName?: string | null;
    title: string;
    message: string;
    status: string;
    httpStatus?: number | null;
    rttMs?: number | null;
    attemptCount?: number;
    maxAttempts?: number;
    nextRetryAt?: Date | null;
    lastError?: string | null;
    deliveredAt?: Date | null;
  }
) {
  try {
    const [created] = await db
      .insert(webhookDeliveries)
      .values({
        userId,
        webhookId: input.webhookId ?? null,
        webhookName: input.webhookName,
        provider: input.provider,
        webhookUrl: input.webhookUrl,
        eventType: input.eventType,
        tunnelName: input.tunnelName ?? null,
        title: input.title,
        message: input.message,
        status: input.status,
        httpStatus: input.httpStatus ?? null,
        rttMs: input.rttMs ?? null,
        attemptCount: input.attemptCount ?? 1,
        maxAttempts: input.maxAttempts ?? 3,
        nextRetryAt: input.nextRetryAt ?? null,
        lastError: input.lastError ?? null,
        deliveredAt: input.deliveredAt ?? null,
      })
      .returning();
    return created;
  } catch (error) {
    throw new Error("Unable to record webhook delivery.", { cause: error });
  }
}

export async function updateWebhookDeliveryById(
  deliveryId: number,
  patch: Partial<{
    status: string;
    httpStatus: number | null;
    rttMs: number | null;
    attemptCount: number;
    nextRetryAt: Date | null;
    lastError: string | null;
    deliveredAt: Date | null;
  }>
) {
  try {
    const [updated] = await db
      .update(webhookDeliveries)
      .set(patch)
      .where(eq(webhookDeliveries.id, deliveryId))
      .returning();
    return updated ?? null;
  } catch (error) {
    throw new Error("Unable to update webhook delivery.", { cause: error });
  }
}

export async function listDueWebhookRetries(limitCount = 15) {
  try {
    return await db
      .select()
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.status, "retrying"),
          lte(webhookDeliveries.nextRetryAt, new Date())
        )
      )
      .limit(limitCount);
  } catch {
    return [];
  }
}

// ==========================================
// IMMUTABLE CONFIG REVISIONS (DRIFT ROLLBACK)
// ==========================================
export async function createConfigRevision(
  userId: number,
  input: {
    profileId: number;
    tunnelName: string;
    configHash: string;
    configBody: string;
    notes?: string;
    authorEmail?: string | null;
  }
) {
  try {
    const [created] = await db
      .insert(configRevisions)
      .values({
        userId,
        profileId: input.profileId,
        tunnelName: input.tunnelName,
        configHash: input.configHash,
        configBody: input.configBody,
        notes: input.notes ?? "Pinned workbench snapshot",
        authorEmail: input.authorEmail ?? null,
      })
      .returning();
    return created;
  } catch (error) {
    throw new Error("Unable to archive config revision.", { cause: error });
  }
}

export async function listConfigRevisions(
  userId: number,
  profileId?: number,
  limitCount = 30
) {
  try {
    const conditions = [eq(configRevisions.userId, userId)];
    if (typeof profileId === "number" && Number.isFinite(profileId)) {
      conditions.push(eq(configRevisions.profileId, profileId));
    }
    return await db
      .select()
      .from(configRevisions)
      .where(and(...conditions))
      .orderBy(desc(configRevisions.createdAt), desc(configRevisions.id))
      .limit(limitCount);
  } catch (error) {
    throw new Error("Unable to load config revisions.", { cause: error });
  }
}

// ==========================================
// DATA RETENTION COMPACTION & STATS
// ==========================================
export async function getTelemetryRetentionStats(userId: number) {
  try {
    const [probeAgg] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(probeLogs)
      .where(eq(probeLogs.userId, userId));
    const [authAgg] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tunnelAuthLogs)
      .where(eq(tunnelAuthLogs.userId, userId));
    const [rollupAgg] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(slaRollups)
      .where(eq(slaRollups.userId, userId));
    const [revAgg] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(configRevisions)
      .where(eq(configRevisions.userId, userId));

    return {
      probeLogRows: probeAgg?.count ?? 0,
      authLogRows: authAgg?.count ?? 0,
      slaRollupRows: rollupAgg?.count ?? 0,
      configRevisionRows: revAgg?.count ?? 0,
      retentionDays: 14,
    };
  } catch (error) {
    throw new Error("Unable to query retention statistics.", { cause: error });
  }
}

export async function pruneOldTelemetryLogs(retentionDays = 14, userId?: number) {
  const cutoff = new Date(Date.now() - Math.max(1, retentionDays) * 86_400_000);
  try {
    const probeCondition = userId
      ? and(eq(probeLogs.userId, userId), lt(probeLogs.createdAt, cutoff))
      : lt(probeLogs.createdAt, cutoff);
    const authCondition = userId
      ? and(eq(tunnelAuthLogs.userId, userId), lt(tunnelAuthLogs.createdAt, cutoff))
      : lt(tunnelAuthLogs.createdAt, cutoff);

    const deletedProbes = await db
      .delete(probeLogs)
      .where(probeCondition)
      .returning({ id: probeLogs.id });
    const deletedAuth = await db
      .delete(tunnelAuthLogs)
      .where(authCondition)
      .returning({ id: tunnelAuthLogs.id });
    await db.delete(webhookCooldowns).where(lt(webhookCooldowns.expiresAt, new Date()));

    return {
      prunedProbeLogs: deletedProbes.length,
      prunedAuthLogs: deletedAuth.length,
      cutoffIso: cutoff.toISOString(),
    };
  } catch (error) {
    throw new Error("Unable to compact telemetry tables.", { cause: error });
  }
}

// ==========================================
// PULL-BASED NODE COMMAND QUEUE (ZERO-INBOUND-SSH)
// ==========================================
export async function enqueueNodeCommand(
  userId: number,
  input: {
    profileId: number;
    tunnelName: string;
    commandType: string;
    payloadJson?: Record<string, any>;
    hmacSecret?: string | null;
  }
) {
  const payload = input.payloadJson || {};
  const secret = input.hmacSecret || "omnieye-default-command-key";
  const signatureHmac = crypto
    .createHmac("sha256", secret)
    .update(`${input.profileId}:${input.commandType}:${JSON.stringify(payload)}`)
    .digest("hex");

  const [created] = await db
    .insert(nodeCommands)
    .values({
      userId,
      profileId: input.profileId,
      tunnelName: input.tunnelName,
      commandType: input.commandType,
      payloadJson: payload,
      signatureHmac,
      status: "pending",
    })
    .returning();
  return created;
}

export async function listNodeCommands(userId: number, limitCount = 40) {
  return await db
    .select()
    .from(nodeCommands)
    .where(eq(nodeCommands.userId, userId))
    .orderBy(desc(nodeCommands.createdAt), desc(nodeCommands.id))
    .limit(limitCount);
}

export async function claimPendingNodeCommandsForProfile(profileId: number) {
  const pending = await db
    .select()
    .from(nodeCommands)
    .where(
      and(eq(nodeCommands.profileId, profileId), eq(nodeCommands.status, "pending"))
    )
    .orderBy(nodeCommands.id)
    .limit(10);

  if (pending.length > 0) {
    for (const cmd of pending) {
      await db
        .update(nodeCommands)
        .set({ status: "dispatched" })
        .where(eq(nodeCommands.id, cmd.id));
    }
  }
  return pending;
}

export async function ackNodeCommand(
  commandId: number,
  resultSummary = "Executed cleanly by node agent"
) {
  const [updated] = await db
    .update(nodeCommands)
    .set({
      status: "acked",
      resultSummary: resultSummary.slice(0, 400),
      ackedAt: new Date(),
    })
    .where(eq(nodeCommands.id, commandId))
    .returning();
  return updated ?? null;
}

// ==========================================
// TAMPER-EVIDENT HASH-CHAINED AUDIT LEDGER
// ==========================================
export async function appendAuditLedgerEntry(
  userId: number,
  input: {
    actorEmail?: string | null;
    actorRole?: string;
    actionType: string;
    targetName: string;
    details: string;
  }
) {
  const [latest] = await db
    .select()
    .from(auditLedger)
    .where(eq(auditLedger.userId, userId))
    .orderBy(desc(auditLedger.id))
    .limit(1);

  const prevHash = latest?.entryHash || "0".repeat(64);
  const actorEmail = input.actorEmail || "operator@omnieye.local";
  const actorRole = input.actorRole || "owner";
  const canonical = `${prevHash}|${userId}|${actorEmail}|${actorRole}|${input.actionType}|${input.targetName}|${input.details}`;
  const entryHash = crypto.createHash("sha256").update(canonical).digest("hex");

  const [created] = await db
    .insert(auditLedger)
    .values({
      userId,
      actorEmail,
      actorRole,
      actionType: input.actionType,
      targetName: input.targetName,
      details: input.details,
      prevHash,
      entryHash,
    })
    .returning();
  return created;
}

export async function listAuditLedgerEntries(userId: number, limitCount = 50) {
  return await db
    .select()
    .from(auditLedger)
    .where(eq(auditLedger.userId, userId))
    .orderBy(desc(auditLedger.id))
    .limit(limitCount);
}

export async function updateUserRbacRole(userId: number, role: string) {
  const allowed = new Set(["owner", "operator", "auditor"]);
  const cleanRole = allowed.has(role) ? role : "owner";
  const [updated] = await db
    .update(users)
    .set({ role: cleanRole })
    .where(eq(users.id, userId))
    .returning();
  return updated ?? null;
}

// ==========================================
// DEVICE_ENCYCLOPEDIA & VQUERY HARDWARE DISCOVERY ENGINE
// ==========================================
const DEFAULT_DEVICE_ENCYCLOPEDIA_SPECS = [
  {
    deviceSlug: "hp-workstation-rtl8852be",
    vendor: "HP / Realtek",
    modelName: "HP Workstation (Realtek RTL8852BE / RTL8822CE PCIe Wi-Fi 6)",
    deviceCategory: "workstation",
    cpuArch: "x86_64_aesni",
    nicDriver: "rtw89_pci",
    usbOrPciId: "PCI 10ec:b852 / 10ec:c822",
    optimalMtu: 1420,
    optimalKeepaliveSec: 21,
    preferredCipher: "aes128-gcm@openssh.com / chacha20-poly1305",
    txQueueLen: 2000,
    tcpCongestion: "bbr",
    kernelQuirks: "GRUB_CMDLINE_LINUX_DEFAULT=\"quiet splash pcie_aspm=off rtw89_pci.disable_clkreq=y rtw89_core.disable_ps_mode=y\"",
    sysctlProfileJson: {
      "net.core.default_qdisc": "fq",
      "net.ipv4.tcp_congestion_control": "bbr",
      "net.core.rmem_max": "16777216",
      "net.core.wmem_max": "16777216",
      "net.ipv4.tcp_mtu_probing": "1",
    },
    ethtoolCommands: "iw dev wlan0 set power_save off && ip link set dev wlan0 txqueuelen 2000",
    technicalNotes:
      "Prevents PCIe L1 ASPM power-state lockups and ACPI watchdog resets on HP laptops with Realtek Wi-Fi cards while maintaining sub-25s UDP NAT bindings.",
    vqueryTags: ["hp", "realtek", "rtl8852be", "rtl8822ce", "rtw89", "pcie_aspm", "workstation", "wifi6", "windows", "linux"],
  },
  {
    deviceSlug: "samsung-galaxy-tab-s9-rndis",
    vendor: "Samsung / Qualcomm",
    modelName: "Galaxy Tab S9 / S24 Ultra USB-C 3.2 RNDIS & 5G CGNAT Gateway",
    deviceCategory: "mobile_tether",
    cpuArch: "arm64_crypto",
    nicDriver: "rndis_host",
    usbOrPciId: "USB 04e8:6863 (RNDIS / CDC-NCM)",
    optimalMtu: 1360,
    optimalKeepaliveSec: 15,
    preferredCipher: "chacha20-poly1305",
    txQueueLen: 1500,
    tcpCongestion: "bbr",
    kernelQuirks: "usbcore.autosuspend=-1 | udev ATTR{power/control}=\"on\" for idVendor=04e8",
    sysctlProfileJson: {
      "net.core.default_qdisc": "fq_codel",
      "net.ipv4.tcp_congestion_control": "bbr",
      "net.ipv4.tcp_notsent_lowat": "16384",
      "net.ipv4.ip_no_pmtu_disc": "0",
    },
    ethtoolCommands: "ip link set dev usb0 mtu 1360 txqueuelen 1500 && ethtool -K usb0 gro on gso on",
    technicalNotes:
      "Accounts for cellular 5G NSA/SA GTP-U + IPv6 CLAT/464XLAT encapsulation overhead (1360B MTU avoids silent DF packet drops) and aggressive 30s carrier CGNAT UDP state eviction.",
    vqueryTags: ["samsung", "galaxy", "tab-s9", "rndis", "usb0", "tether", "5g", "cgnat", "android", "qualcomm"],
  },
  {
    deviceSlug: "dragon-hub-intel-i225v",
    vendor: "Intel / Sovereign Node",
    modelName: "Dragon-Hub Edge Server (Intel I225-V 2.5GbE / X550 10GbE)",
    deviceCategory: "edge_router",
    cpuArch: "x86_64_avx512",
    nicDriver: "igc",
    usbOrPciId: "PCI 8086:15f3 (Intel I225-V)",
    optimalMtu: 1420,
    optimalKeepaliveSec: 25,
    preferredCipher: "aes256-gcm@openssh.com / wireguard-avx2",
    txQueueLen: 10000,
    tcpCongestion: "bbr",
    kernelQuirks: "pcie_port_pm=off igc.eee_enable=0 (Disables Energy Efficient Ethernet link flap on 2.5GbE)",
    sysctlProfileJson: {
      "net.core.default_qdisc": "fq",
      "net.ipv4.tcp_congestion_control": "bbr",
      "net.core.rmem_max": "67108864",
      "net.core.wmem_max": "67108864",
      "net.core.netdev_max_backlog": "16384",
      "net.ipv4.ip_forward": "1",
    },
    ethtoolCommands: "ethtool -G eth0 rx 4096 tx 4096 && ethtool -L eth0 combined 4 && ethtool --set-eee eth0 eee off",
    technicalNotes:
      "Maximizes multi-queue RSS/RPS ring buffers for high-throughput WireGuard & Tailscale mesh forwarding while disabling Intel I225-V EEE micro-sleep link drops.",
    vqueryTags: ["dragon-hub", "intel", "i225v", "igc", "2.5gbe", "server", "tailscale", "wireguard", "edge"],
  },
  {
    deviceSlug: "apple-iphone-ipheth-usb",
    vendor: "Apple",
    modelName: "iPhone 15/16 Pro USB-C Personal Hotspot (ipheth NCM)",
    deviceCategory: "mobile_tether",
    cpuArch: "arm64_crypto",
    nicDriver: "ipheth",
    usbOrPciId: "USB 05ac:12a8 (Apple Mobile Device Ethernet)",
    optimalMtu: 1380,
    optimalKeepaliveSec: 18,
    preferredCipher: "chacha20-poly1305",
    txQueueLen: 1200,
    tcpCongestion: "bbr",
    kernelQuirks: "usbmuxd systemd socket activation + ipheth Carrier-NAT MSS clamping (1340B)",
    sysctlProfileJson: {
      "net.core.default_qdisc": "fq_codel",
      "net.ipv4.tcp_congestion_control": "bbr",
      "net.ipv4.tcp_mtu_probing": "2",
    },
    ethtoolCommands: "ip link set dev eth1 mtu 1380 txqueuelen 1200",
    technicalNotes:
      "Prevents usbmuxd pairing drops and cellular IPv6 NAT64 fragmentation during SSH/WireGuard sessions over iOS USB hotspot.",
    vqueryTags: ["apple", "iphone", "ipheth", "usbmuxd", "usb", "hotspot", "tether", "ios", "macos"],
  },
  {
    deviceSlug: "rpi5-bcm2712-arm64",
    vendor: "Raspberry Pi Ltd",
    modelName: "Raspberry Pi 5 (Broadcom BCM2712 Cortex-A76 ARMv8.2 Crypto)",
    deviceCategory: "arm_sbc",
    cpuArch: "arm64_crypto",
    nicDriver: "macb_pcie_eth",
    usbOrPciId: "PCI 1de4:0001 (RP1 Southbridge GbE)",
    optimalMtu: 1420,
    optimalKeepaliveSec: 25,
    preferredCipher: "chacha20-poly1305",
    txQueueLen: 4000,
    tcpCongestion: "bbr",
    kernelQuirks: "arm_64bit=1 | Enable Packet Steering (RPS) across all 4 Cortex-A76 cores (echo f > rps_cpus)",
    sysctlProfileJson: {
      "net.core.default_qdisc": "fq",
      "net.ipv4.tcp_congestion_control": "bbr",
      "net.core.rmem_max": "33554432",
      "net.core.wmem_max": "33554432",
    },
    ethtoolCommands: "echo f > /sys/class/net/eth0/queues/rx-0/rps_cpus && ip link set dev eth0 txqueuelen 4000",
    technicalNotes:
      "Distributes WireGuard UDP softirq decryption across all 4 Cortex-A76 cores, raising line-rate WireGuard throughput from 340 Mbps to 940+ Mbps.",
    vqueryTags: ["raspberry-pi", "rpi5", "arm64", "bcm2712", "rps", "watchdog", "sbc", "chacha20"],
  },
  {
    deviceSlug: "cloud-virtio-multiqueue",
    vendor: "Cloud VPS / KVM",
    modelName: "Cloud Bastion VM (VirtIO-Net Multiqueue + vhost_net)",
    deviceCategory: "cloud_vps",
    cpuArch: "x86_64_aesni",
    nicDriver: "virtio_net",
    usbOrPciId: "PCI 1af4:1000 (VirtIO Network Device)",
    optimalMtu: 1420,
    optimalKeepaliveSec: 25,
    preferredCipher: "aes128-gcm@openssh.com",
    txQueueLen: 5000,
    tcpCongestion: "bbr",
    kernelQuirks: "virtio_net.napi_tx=1 | Clamp TCP MSS to PMTU via nftables forward chain",
    sysctlProfileJson: {
      "net.core.default_qdisc": "fq",
      "net.ipv4.tcp_congestion_control": "bbr",
      "net.core.somaxconn": "8192",
      "net.ipv4.tcp_fastopen": "3",
    },
    ethtoolCommands: "ethtool -L eth0 combined 2 && ethtool -K eth0 rx-udp-gro-forwarding on",
    technicalNotes:
      "Enables Linux 6.x UDP GRO forwarding (`rx-udp-gro-forwarding on`) for Cloud WireGuard & Cloudflare ingress relays, cutting hypervisor VM-exit overhead by 42%.",
    vqueryTags: ["cloud", "vps", "virtio", "kvm", "gcp", "aws", "hetzner", "cloudflare", "bastion"],
  },
];

export async function seedDeviceEncyclopediaIfEmpty() {
  const existing = await db.select().from(deviceEncyclopedia).limit(1);
  if (existing.length > 0) {
    return await db.select().from(deviceEncyclopedia).orderBy(deviceEncyclopedia.id);
  }
  await db
    .insert(deviceEncyclopedia)
    .values(DEFAULT_DEVICE_ENCYCLOPEDIA_SPECS)
    .onConflictDoNothing();
  return await db.select().from(deviceEncyclopedia).orderBy(deviceEncyclopedia.id);
}

export async function vqueryDeviceEncyclopedia(queryText = "", categoryFilter = "all") {
  await seedDeviceEncyclopediaIfEmpty();
  const allRows = await db.select().from(deviceEncyclopedia).orderBy(deviceEncyclopedia.id);
  const q = queryText.trim().toLowerCase();
  const cat = categoryFilter.trim().toLowerCase();

  const scored = allRows
    .filter((row) => cat === "all" || !cat || row.deviceCategory.toLowerCase() === cat)
    .map((row) => {
      if (!q) return { row, score: 100 };
      let score = 0;
      const haystacks = [
        row.deviceSlug,
        row.vendor,
        row.modelName,
        row.deviceCategory,
        row.cpuArch,
        row.nicDriver,
        row.usbOrPciId,
        row.kernelQuirks,
        row.technicalNotes,
        ...(Array.isArray(row.vqueryTags) ? row.vqueryTags : []),
      ]
        .join(" ")
        .toLowerCase();

      const tokens = q.split(/[\s,+/:-]+/).filter(Boolean);
      for (const tok of tokens) {
        if (row.deviceSlug.toLowerCase().includes(tok)) score += 45;
        if ((row.vqueryTags || []).some((t) => t.toLowerCase() === tok)) score += 40;
        if (row.nicDriver.toLowerCase().includes(tok)) score += 35;
        if (row.usbOrPciId.toLowerCase().includes(tok)) score += 35;
        if (haystacks.includes(tok)) score += 15;
      }
      return { row, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => ({
    ...s.row,
    matchScore: Math.min(100, s.score),
  }));
}

export async function upsertDeviceEncyclopediaEntry(input: {
  deviceSlug: string;
  vendor: string;
  modelName: string;
  deviceCategory: string;
  cpuArch: string;
  nicDriver: string;
  usbOrPciId: string;
  optimalMtu: number;
  optimalKeepaliveSec: number;
  preferredCipher: string;
  txQueueLen: number;
  tcpCongestion: string;
  kernelQuirks: string;
  sysctlProfileJson: Record<string, string>;
  ethtoolCommands: string;
  technicalNotes: string;
  vqueryTags: string[];
}) {
  const [upserted] = await db
    .insert(deviceEncyclopedia)
    .values({
      ...input,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: deviceEncyclopedia.deviceSlug,
      set: {
        vendor: input.vendor,
        modelName: input.modelName,
        deviceCategory: input.deviceCategory,
        cpuArch: input.cpuArch,
        nicDriver: input.nicDriver,
        usbOrPciId: input.usbOrPciId,
        optimalMtu: input.optimalMtu,
        optimalKeepaliveSec: input.optimalKeepaliveSec,
        preferredCipher: input.preferredCipher,
        txQueueLen: input.txQueueLen,
        tcpCongestion: input.tcpCongestion,
        kernelQuirks: input.kernelQuirks,
        sysctlProfileJson: input.sysctlProfileJson,
        ethtoolCommands: input.ethtoolCommands,
        technicalNotes: input.technicalNotes,
        vqueryTags: input.vqueryTags,
        updatedAt: new Date(),
      },
    })
    .returning();
  return upserted;
}


