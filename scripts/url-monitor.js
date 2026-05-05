#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const FALLBACK_DEFAULT_URLS = [
  "https://structurer.sullo.co/"
];
const DEFAULT_CONNECTIVITY_URLS = [
  "https://www.google.com/generate_204",
  "https://cloudflare.com/cdn-cgi/trace",
];

loadDotEnv(path.resolve(process.cwd(), ".env"));

const RAW_DEFAULT_URLS = process.env.DEFAULT_URLS || "";
const POLL_MS = Number.parseInt(process.env.MONITOR_POLL_MS || "3600000", 10);
const TIMEOUT_MS = Number.parseInt(process.env.MONITOR_TIMEOUT_MS || "8000", 10);
const FAILURE_THRESHOLD = Number.parseInt(process.env.MONITOR_FAILURE_THRESHOLD || "2", 10);
const ALERT_SOUND_FILE = process.env.MONITOR_ALERT_SOUND_FILE || "";
const ALERT_SOUND_CMD = process.env.MONITOR_ALERT_SOUND_CMD || "";
const RAW_URLS = process.env.MONITOR_URLS || "";
const RAW_CONNECTIVITY_URLS = process.env.MONITOR_CONNECTIVITY_URLS || "";
const RESUME_GAP_FACTOR = Number.parseFloat(process.env.MONITOR_RESUME_GAP_FACTOR || "1.5");

const envDefaultUrls = parseUrlList(RAW_DEFAULT_URLS);
const overrideUrls = parseUrlList(RAW_URLS);
const urls = overrideUrls.length ? overrideUrls : (envDefaultUrls.length ? envDefaultUrls : FALLBACK_DEFAULT_URLS);
const connectivityUrls = RAW_CONNECTIVITY_URLS
  ? parseUrlList(RAW_CONNECTIVITY_URLS)
  : DEFAULT_CONNECTIVITY_URLS;

if (!urls.length) {
  console.error("No URLs configured. Set DEFAULT_URLS in .env or pass MONITOR_URLS.");
  process.exit(1);
}

const states = new Map(
  urls.map((url) => [
    url,
    {
      isDown: false,
      consecutiveFailures: 0,
    },
  ])
);

let lastLoopStart = Date.now();
let internetIsDown = false;

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseUrlList(rawValue) {
  return (rawValue || "")
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function timestamp() {
  return new Date().toISOString().replace("T", " ").replace("Z", " UTC");
}

function logLine(message) {
  console.log(`[${timestamp()}] ${message}`);
}

function playAlertSound() {
  if (ALERT_SOUND_CMD) {
    const [cmd, ...args] = ALERT_SOUND_CMD.split(" ").filter(Boolean);
    if (cmd) {
      spawn(cmd, args, { stdio: "ignore" }).on("error", () => {
        process.stdout.write("\u0007");
      });
      return;
    }
  }

  if (process.platform === "darwin") {
    const args = ALERT_SOUND_FILE ? [ALERT_SOUND_FILE] : ["/System/Library/Sounds/Funk.aiff"];
    spawn("afplay", args, { stdio: "ignore" }).on("error", () => {
      process.stdout.write("\u0007");
    });
    return;
  }

  process.stdout.write("\u0007");
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });

    const elapsed = Date.now() - started;
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        elapsed,
        reason: `HTTP ${response.status}`,
      };
    }

    return { ok: true, status: response.status, elapsed };
  } catch (error) {
    const elapsed = Date.now() - started;
    const reason = error?.name === "AbortError" ? `Timeout after ${TIMEOUT_MS}ms` : error.message;
    return { ok: false, elapsed, reason };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkInternetConnectivity() {
  const checks = await Promise.all(connectivityUrls.map((url) => checkUrl(url)));
  const firstSuccess = checks.find((result) => result.ok);
  if (firstSuccess) {
    return { ok: true, details: firstSuccess };
  }

  const firstFailure = checks[0] || { reason: "Unknown connectivity error", elapsed: 0 };
  return { ok: false, details: firstFailure };
}

async function runCycle() {
  const internet = await checkInternetConnectivity();
  if (!internet.ok) {
    if (!internetIsDown) {
      internetIsDown = true;
      logLine(
        `ALERT: Internet connectivity check failed (${internet.details.elapsed}ms) - ${internet.details.reason}`
      );
      playAlertSound();
    } else {
      logLine(
        `INTERNET DOWN: connectivity check failed (${internet.details.elapsed}ms) - ${internet.details.reason}`
      );
    }
    logLine("Skipping target URL checks until internet connectivity is restored.");
    return;
  }

  if (internetIsDown) {
    internetIsDown = false;
    logLine("RECOVERED: Internet connectivity restored.");
  }

  const checks = await Promise.all(urls.map((url) => checkUrl(url)));

  checks.forEach((result, index) => {
    const url = urls[index];
    const state = states.get(url);
    if (!state) {
      return;
    }

    if (result.ok) {
      if (state.isDown) {
        logLine(`RECOVERED: ${url} (${result.elapsed}ms, HTTP ${result.status})`);
      } else {
        logLine(`OK: ${url} (${result.elapsed}ms, HTTP ${result.status})`);
      }

      state.isDown = false;
      state.consecutiveFailures = 0;
      return;
    }

    state.consecutiveFailures += 1;
    logLine(
      `FAIL ${state.consecutiveFailures}/${FAILURE_THRESHOLD}: ${url} (${result.elapsed}ms) - ${result.reason}`
    );

    if (!state.isDown && state.consecutiveFailures >= FAILURE_THRESHOLD) {
      state.isDown = true;
      logLine(`ALERT: ${url} is DOWN`);
      playAlertSound();
    }
  });
}

async function loop() {
  const now = Date.now();
  const elapsedSinceLastLoop = now - lastLoopStart;
  const resumeThresholdMs = Math.max(POLL_MS * RESUME_GAP_FACTOR, POLL_MS + TIMEOUT_MS);
  if (elapsedSinceLastLoop > resumeThresholdMs) {
    logLine(
      `Resume detected after ${elapsedSinceLastLoop}ms idle gap; running immediate health checks.`
    );
  }
  lastLoopStart = now;

  try {
    await runCycle();
  } catch (error) {
    logLine(`Unexpected monitor error: ${error.message}`);
  } finally {
    setTimeout(loop, POLL_MS);
  }
}

logLine(`URL monitor started. Poll every ${POLL_MS}ms; timeout ${TIMEOUT_MS}ms; threshold ${FAILURE_THRESHOLD}.`);
logLine(`Monitoring ${urls.length} URL(s): ${urls.join(", ")}`);
logLine(`Connectivity pre-check URLs: ${connectivityUrls.join(", ")}`);
loop();
