import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  email: text("email"),
  role: text("role").notNull().default("owner"), // owner | operator | auditor
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tunnelProfiles = pgTable(
  "tunnel_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("wireguard"),
    endpointHost: text("endpoint_host").notNull(),
    endpointPort: integer("endpoint_port").notNull().default(51820),
    lat: doublePrecision("lat").notNull().default(37.7749),
    lng: doublePrecision("lng").notNull().default(-122.4194),
    locationLabel: text("location_label").notNull().default("Edge Hub"),
    segmentId: text("segment_id").notNull().default("wg-keepalive"),
    variablesJson: jsonb("variables_json").$type<Record<string, string>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    lastRttMs: integer("last_rtt_ms"),
    rxBytes: doublePrecision("rx_bytes").default(0),
    txBytes: doublePrecision("tx_bytes").default(0),
    handshakeAgeSec: integer("handshake_age_sec"),
    lastHeartbeatAt: timestamp("last_heartbeat_at"),
    ingestToken: text("ingest_token"),
    previousIngestToken: text("previous_ingest_token"),
    tokenGraceExpiresAt: timestamp("token_grace_expires_at"),
    hmacSecret: text("hmac_secret"),
    alertThresholdMs: integer("alert_threshold_ms").default(200),
    failoverRole: text("failover_role").notNull().default("standalone"), // primary | backup | standalone
    failoverTargetId: integer("failover_target_id"),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    consecutiveRecoveries: integer("consecutive_recoveries").notNull().default(0),
    healthState: text("health_state").notNull().default("healthy"), // healthy | degraded | failed_over
    expectedConfigHash: text("expected_config_hash"),
    reportedConfigHash: text("reported_config_hash"),
    lastDriftCheckAt: timestamp("last_drift_check_at"),
    lastRotatedAt: timestamp("last_rotated_at"),
    rotationPolicyDays: integer("rotation_policy_days").default(90),
    certExpiresAt: timestamp("cert_expires_at"),
    certSubject: text("cert_subject"),
    restrictToRegion: boolean("restrict_to_region").notNull().default(false),
    maintenanceUntil: timestamp("maintenance_until"),
    lastResolvedIp: text("last_resolved_ip"),
    routeFlapCount: integer("route_flap_count").notNull().default(0),
    canaryStatus: text("canary_status").notNull().default("none"), // none | canary_testing | promoted
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tunnel_profiles_user_idx").on(table.userId),
    index("tunnel_profiles_ingest_token_idx").on(table.ingestToken),
  ]
);

export const probeLogs = pgTable(
  "probe_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: integer("profile_id").references(() => tunnelProfiles.id, {
      onDelete: "set null",
    }),
    target: text("target").notNull(),
    rttMs: integer("rtt_ms").notNull(),
    status: text("status").notNull(),
    dnsResolver: text("dns_resolver").notNull().default("1.1.1.1"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("probe_logs_user_created_idx").on(table.userId, table.createdAt),
    index("probe_logs_profile_created_idx").on(table.profileId, table.createdAt),
  ]
);

export const webhookTargets = pgTable("webhook_targets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  provider: text("provider").notNull().default("ntfy"),
  url: text("url").notNull(),
  assignedTunnels: jsonb("assigned_tunnels").$type<string[]>().notNull().default([]),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    webhookId: integer("webhook_id").references(() => webhookTargets.id, {
      onDelete: "set null",
    }),
    webhookName: text("webhook_name").notNull(),
    provider: text("provider").notNull().default("generic"),
    webhookUrl: text("webhook_url").notNull(),
    eventType: text("event_type").notNull().default("alert"),
    tunnelName: text("tunnel_name"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("pending"), // delivered | retrying | failed
    httpStatus: integer("http_status"),
    rttMs: integer("rtt_ms"),
    attemptCount: integer("attempt_count").notNull().default(1),
    maxAttempts: integer("max_attempts").notNull().default(3),
    nextRetryAt: timestamp("next_retry_at"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deliveredAt: timestamp("delivered_at"),
  },
  (table) => [
    index("webhook_deliveries_user_created_idx").on(table.userId, table.createdAt),
    index("webhook_deliveries_retry_idx").on(table.status, table.nextRetryAt),
  ]
);

export const webhookCooldowns = pgTable("webhook_cooldowns", {
  id: serial("id").primaryKey(),
  cooldownKey: text("cooldown_key").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tunnelAuthLogs = pgTable(
  "tunnel_auth_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: integer("profile_id").references(() => tunnelProfiles.id, {
      onDelete: "set null",
    }),
    tunnelName: text("tunnel_name").notNull(),
    protocol: text("protocol").notNull().default("ssh"), // ssh | cloudflare | tailscale | wireguard
    outcome: text("outcome").notNull().default("success"), // success | failed
    actor: text("actor").notNull().default("unknown"),
    sourceIp: text("source_ip").notNull().default("0.0.0.0"),
    authMethod: text("auth_method").notNull().default("ed25519-key"),
    reason: text("reason").notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("tunnel_auth_logs_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export const blockedIps = pgTable("blocked_ips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address").notNull(),
  protocol: text("protocol").notNull().default("ssh"),
  reason: text("reason").notNull().default("Automated brute-force ban"),
  failCount: integer("fail_count").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const slaRollups = pgTable(
  "sla_rollups",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: integer("profile_id").references(() => tunnelProfiles.id, {
      onDelete: "set null",
    }),
    tunnelName: text("tunnel_name").notNull(),
    bucketHour: text("bucket_hour").notNull(), // e.g., "2026-11-15T01:00"
    totalProbes: integer("total_probes").notNull().default(0),
    onlineProbes: integer("online_probes").notNull().default(0),
    uptimePct: doublePrecision("uptime_pct").notNull().default(100),
    avgRttMs: integer("avg_rtt_ms").notNull().default(0),
    p95RttMs: integer("p95_rtt_ms").notNull().default(0),
    staleHeartbeats: integer("stale_heartbeats").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sla_rollups_user_bucket_idx").on(table.userId, table.bucketHour),
  ]
);

export const configRevisions = pgTable(
  "config_revisions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: integer("profile_id")
      .notNull()
      .references(() => tunnelProfiles.id, { onDelete: "cascade" }),
    tunnelName: text("tunnel_name").notNull(),
    configHash: text("config_hash").notNull(),
    configBody: text("config_body").notNull(),
    notes: text("notes").notNull().default("Pinned workbench snapshot"),
    authorEmail: text("author_email"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("config_revisions_profile_created_idx").on(table.profileId, table.createdAt),
  ]
);

export const encryptedVaults = pgTable("encrypted_vaults", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  ciphertextPayload: text("ciphertext_payload").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const nodeCommands = pgTable(
  "node_commands",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: integer("profile_id")
      .notNull()
      .references(() => tunnelProfiles.id, { onDelete: "cascade" }),
    tunnelName: text("tunnel_name").notNull(),
    commandType: text("command_type").notNull(), // reload_nft_blocklist | rotate_wg_key | run_mtr_trace | sync_geoip_rules
    payloadJson: jsonb("payload_json").$type<Record<string, any>>().notNull().default({}),
    signatureHmac: text("signature_hmac").notNull(),
    status: text("status").notNull().default("pending"), // pending | dispatched | acked
    resultSummary: text("result_summary"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    ackedAt: timestamp("acked_at"),
  },
  (table) => [
    index("node_commands_profile_status_idx").on(table.profileId, table.status),
    index("node_commands_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export const auditLedger = pgTable(
  "audit_ledger",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorEmail: text("actor_email").notNull().default("operator@omnieye.local"),
    actorRole: text("actor_role").notNull().default("owner"),
    actionType: text("action_type").notNull(),
    targetName: text("target_name").notNull(),
    details: text("details").notNull(),
    prevHash: text("prev_hash").notNull(),
    entryHash: text("entry_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_ledger_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export const deviceEncyclopedia = pgTable(
  "device_encyclopedia",
  {
    id: serial("id").primaryKey(),
    deviceSlug: text("device_slug").notNull().unique(),
    vendor: text("vendor").notNull(),
    modelName: text("model_name").notNull(),
    deviceCategory: text("device_category").notNull(), // workstation | mobile_tether | edge_router | cloud_vps | arm_sbc
    cpuArch: text("cpu_arch").notNull(), // x86_64_aesni | arm64_crypto | x86_64_avx512
    nicDriver: text("nic_driver").notNull(), // rtw89_pci | rndis_host | igc | virtio_net | ipheth | bcmgenet
    usbOrPciId: text("usb_or_pci_id").notNull(),
    optimalMtu: integer("optimal_mtu").notNull().default(1420),
    optimalKeepaliveSec: integer("optimal_keepalive_sec").notNull().default(25),
    preferredCipher: text("preferred_cipher").notNull().default("chacha20-poly1305"),
    txQueueLen: integer("tx_queue_len").notNull().default(2000),
    tcpCongestion: text("tcp_congestion").notNull().default("bbr"),
    kernelQuirks: text("kernel_quirks").notNull(),
    sysctlProfileJson: jsonb("sysctl_profile_json").$type<Record<string, string>>().notNull().default({}),
    ethtoolCommands: text("ethtool_commands").notNull(),
    technicalNotes: text("technical_notes").notNull(),
    vqueryTags: jsonb("vquery_tags").$type<string[]>().notNull().default([]),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("device_encyclopedia_slug_idx").on(table.deviceSlug),
    index("device_encyclopedia_category_idx").on(table.deviceCategory),
  ]
);

export type DbUser = typeof users.$inferSelect;
export type DbTunnelProfile = typeof tunnelProfiles.$inferSelect;
export type DbProbeLog = typeof probeLogs.$inferSelect;
export type DbWebhookTarget = typeof webhookTargets.$inferSelect;
export type DbWebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type DbTunnelAuthLog = typeof tunnelAuthLogs.$inferSelect;
export type DbBlockedIp = typeof blockedIps.$inferSelect;
export type DbSlaRollup = typeof slaRollups.$inferSelect;
export type DbConfigRevision = typeof configRevisions.$inferSelect;
export type DbEncryptedVault = typeof encryptedVaults.$inferSelect;
export type DbNodeCommand = typeof nodeCommands.$inferSelect;
export type DbAuditLedger = typeof auditLedger.$inferSelect;
export type DbDeviceEncyclopedia = typeof deviceEncyclopedia.$inferSelect;

